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

  private constructor() {}

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

  // Define valid plans as a class property
  private validPlans = [
    "early_adopter",
    "support",
    "paid",
    "basic",
    "lifetime",
  ];

  /**
   * Check if a user has an active subscription
   */
  public async hasActiveSubscription(userId: string): Promise<boolean> {
    console.log("🔍 Starting subscription check for user:", userId);

    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("❌ Supabase client not initialized");
      return false;
    }

    try {
      console.log("📡 Fetching subscription data from database...");
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("❌ Database error:", error);
        return false;
      }

      if (!subscription) {
        console.log("⚠️ No subscription found");
        return false;
      }

      console.log("📋 Raw subscription data:", subscription);
      console.log("✓ Valid plans:", this.validPlans);

      const hasPaidAccess =
        subscription.status === "active" &&
        this.validPlans.includes(subscription.plan);

      console.log("🔑 Access check results:", {
        exists: true,
        status: subscription.status,
        plan: subscription.plan,
        isStatusActive: subscription.status === "active",
        isPlanValid: this.validPlans.includes(subscription.plan),
        finalDecision: hasPaidAccess,
      });

      return hasPaidAccess;
    } catch (error) {
      console.error("❌ Error in subscription check:", error);
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
        .select("*")
        .eq("user_id", userId)
        .single();

      // If no subscription or error, return basic features
      if (error || !subscription) {
        return SUBSCRIPTION_TIERS.basic.feature_flags;
      }

      const hasPaidAccess =
        subscription.status === "active" &&
        this.validPlans.includes(subscription.plan);

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
  public async hasFeature(userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      console.error("Supabase client not initialized");
      return false;
    }

    try {
      const { data: subscription, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error || !subscription) {
        console.log("No subscription found or error:", error);
        return false;
      }

      console.log("Subscription data:", subscription);

      const hasPaidAccess =
        subscription.status === "active" &&
        this.validPlans.includes(subscription.plan);

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

// Add this to subscription.ts

export const debugSubscriptionState = async (userId: string) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("❌ No Supabase client available");
    return;
  }

  try {
    console.log('🔍 Running subscription debug for user:', userId);

    // Check raw subscription data
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error('❌ Error fetching subscription:', error);
      return;
    }

    // Validate subscription state
    const validPlans = ["early_adopter", "support", "paid", "basic", "lifetime"];
    const hasPaidAccess = subscription?.status === "active" && 
                         validPlans.includes(subscription.plan);

    console.log('📊 Subscription Debug Results:', {
      rawData: subscription,
      status: subscription?.status,
      plan: subscription?.plan,
      isActive: subscription?.status === "active",
      isPlanValid: validPlans.includes(subscription?.plan || ''),
      hasPaidAccess,
      validPlans
    });

  } catch (error) {
    console.error("❌ Debug error:", error);
  }
};
  