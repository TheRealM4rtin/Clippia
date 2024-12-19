import { getSupabaseClient } from "@/lib/supabase";
import { LEMON_SQUEEZY_CONFIG } from "@/lib/lemon-squeezy";
import { createHmac } from "crypto";
import {
  Subscription,
  SUBSCRIPTION_TIERS,
  SubscriptionTier,
  WebhookEvent,
} from "@/types/subscription";

export class SubscriptionService {
  private static instance: SubscriptionService;

  private constructor() { }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  /**
   * Verify webhook signature
   */
  public verifyWebhookSignature(payload: string, signature: string): boolean {
    const webhookSecret = LEMON_SQUEEZY_CONFIG.webhookSecret;
    if (!webhookSecret) {
      console.error("No webhook secret configured");
      return false;
    }
    const hmac = createHmac("sha256", webhookSecret);
    const digest = hmac.update(payload).digest("hex");
    return signature === digest;
  }

  /**
   * Process a webhook event
   */
  public async processWebhook(event: WebhookEvent): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return false;
    }

    const eventName = event.event_type;
    const userId = event.payload.meta.custom_data?.user_id;

    if (!userId || typeof userId !== "string") {
      console.error("No valid user_id in webhook data");
      return false;
    }

    try {
      switch (eventName) {
        case "subscription_created":
        case "subscription_updated":
        case "subscription_resumed": {
          const { error } = await supabase.from("subscriptions").upsert({
            user_id: userId,
            subscription_id:
              event.payload.attributes.subscription_id.toString(),
            status: "active",
            plan: "early_adopter" as SubscriptionTier,
            current_period_end:
              typeof event.payload.attributes.ends_at === "string"
                ? new Date(event.payload.attributes.ends_at).toISOString()
                : new Date().toISOString(),
          });

          if (error) {
            console.error("Failed to update subscription:", error);
            return false;
          }
          break;
        }

        case "subscription_cancelled":
        case "subscription_expired": {
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              plan: "basic" as SubscriptionTier,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("Failed to cancel subscription:", error);
            return false;
          }
          break;
        }

        default:
          console.warn("Unhandled webhook event:", eventName);
          return false;
      }

      return true;
    } catch (error) {
      console.error("Error processing webhook:", error);
      return false;
    }
  }

  /**
   * Get a user's subscription
   */
  public async getSubscription(userId: string): Promise<Subscription | null> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return null;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        const now = new Date().toISOString();
        const defaultSub = {
          user_id: userId,
          plan: "basic" as const,
          status: "active" as const,
          subscription_id: "",
          current_period_end: now,
          created_at: now,
          updated_at: now,
        };

        const { data: newSub, error: createError } = await supabase
          .from("subscriptions")
          .insert(defaultSub)
          .select()
          .single();

        if (createError || !newSub) {
          console.error("Failed to create default subscription:", createError);
          return null;
        }

        return newSub as Subscription;
      }
      return null;
    }

    return data as Subscription;
  }

  /**
   * Check if a user has an active subscription
   */
  public async hasActiveSubscription(userId: string): Promise<boolean> {
    console.log('Checking active subscription for user:', userId);
    
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return false;
    }

    try {
      console.log('Fetching subscription data...');
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          console.log('Creating default subscription for new user');
          const defaultSubscription = {
            user_id: userId,
            status: 'active',
            plan: 'basic',
            subscription_id: `default-${userId}`,
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };

          const { error: insertError } = await supabase
            .from("subscriptions")
            .insert(defaultSubscription);

          if (insertError) {
            console.error('Error creating default subscription:', insertError);
            return false;
          }

          return false; // New users start with basic (unpaid) plan
        }
        console.error('Error fetching subscription:', error);
        return false;
      }

      // Check if subscription exists and is active with a paid plan
      const hasPaidAccess = subscription?.status === "active" &&
        (subscription.plan === "early_adopter" ||
          subscription.plan === "support" ||
          subscription.plan === "paid");

      console.log('Subscription status:', {
        exists: !!subscription,
        status: subscription?.status,
        plan: subscription?.plan,
        hasPaidAccess
      });

      return hasPaidAccess;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }

  /**
   * Get a user's current subscription tier
   */
  public async getCurrentTier(userId: string): Promise<SubscriptionTier> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return "basic";
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", userId)
      .single();

    return subscription?.status === "active" && subscription?.plan
      ? (subscription.plan as SubscriptionTier)
      : "basic";
  }

  /**
   * Cancel a subscription
   */
  public async cancelSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    if (!subscription?.subscription_id) {
      return false;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return false;
    }

    try {
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.subscription_id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to cancel subscription:", await response.text());
        return false;
      }

      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: "basic",
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to update subscription status:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return false;
    }
  }

  /**
   * Get subscription features for a user
   */
  public async getFeatures(userId: string): Promise<string[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return SUBSCRIPTION_TIERS.basic.feature_flags;
    }

    try {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", userId)
        .single();

      // If no subscription or error, return basic features
      if (error || !subscription) {
        return SUBSCRIPTION_TIERS.basic.feature_flags;
      }

      // User has access if they have a paid plan or lifetime subscription
      const hasPaidAccess =
        subscription.status === "active" &&
        (subscription.plan === "paid" || subscription.plan === "lifetime");

      if (hasPaidAccess) {
        return [...SUBSCRIPTION_TIERS.basic.feature_flags, "cloud_storage"];
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }

    return SUBSCRIPTION_TIERS.basic.feature_flags;
  }

  /**
   * Check if a user has access to a specific feature
   */
  public async hasFeature(
    userId: string
  ): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return false;
    }

    try {
      // Check subscription status directly
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("status, plan")
        .eq("user_id", userId)
        .single();

      // If no subscription or error, user doesn't have access
      if (error || !subscription) {
        console.log("No subscription found or error:", error);
        return false;
      }

      console.log("Subscription data:", subscription);

      // User has access if they have a paid plan or lifetime subscription
      const hasPaidAccess =
        subscription.status === "active" &&
        (subscription.plan === "paid" || subscription.plan === "lifetime");

      console.log("Has paid access:", hasPaidAccess);
      return hasPaidAccess;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  }
}

export const getSubscriptionTiers = () => {
  return SUBSCRIPTION_TIERS;
};

export const getSubscriptionTier = (id: string) => {
  return id in SUBSCRIPTION_TIERS
    ? SUBSCRIPTION_TIERS[id as keyof typeof SUBSCRIPTION_TIERS]
    : null;
};

// export const getSubscriptionVariantId = (id: string) => {
//   const tier = getSubscriptionTier(id);
//   return tier?.variantId;
// };

// Export a singleton instance
export const subscriptionService = SubscriptionService.getInstance();
