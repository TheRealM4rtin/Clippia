import { supabase } from "@/lib/supabase";
import { LEMON_SQUEEZY_CONFIG } from "@/config/lemon-squeezy";
import { type NewCheckout, type Checkout } from "@lemonsqueezy/lemonsqueezy.js";
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
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .single();

    return subscription?.status === "active";
  }

  /**
   * Get a user's current subscription tier
   */
  public async getCurrentTier(userId: string): Promise<SubscriptionTier> {
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
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      return SUBSCRIPTION_TIERS.basic.feature_flags;
    }

    return SUBSCRIPTION_TIERS[subscription.plan].feature_flags;
  }

  /**
   * Check if a user has access to a specific feature
   */
  public async hasFeature(
    userId: string,
    featureKey: string
  ): Promise<boolean> {
    const features = await this.getFeatures(userId);
    return features.includes(featureKey);
  }

  /**
   * Create a checkout session for a subscription
   */
  public async createCheckoutSession(
  storeId: string | number,
  variantId: string | number,
  checkoutOptions: NewCheckout
): Promise<Checkout | null> {
  try {
    const formattedStoreId = storeId.toString();
    const formattedVariantId = variantId.toString();

    const requestBody = {
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            name: "Clippia Subscription",
            description: "Subscribe to Clippia"
          },
          checkout_options: {
            embed: true,
            media: true,
            logo: true,
            desc: true,
            discount: true,
            subscription_preview: true
          },
          checkout_data: {
            email: checkoutOptions.checkoutData?.email || "",
            custom: {
              user_id: checkoutOptions.checkoutData?.custom?.user_id || ""
            }
          },
          expires_at: null,
          preview: false,
          test_mode: false
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: formattedStoreId
            }
          },
          variant: {
            data: {
              type: "variants",
              id: formattedVariantId
            }
          }
        }
      }
    };

    console.log('Full Lemon Squeezy request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // Get response body regardless of status
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse response as JSON:", responseText);
      throw new Error("Invalid JSON response from Lemon Squeezy");
    }

    if (!response.ok) {
      console.error('Lemon Squeezy API error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseData
      });
      throw new Error(responseData?.errors?.[0]?.detail || 'Unknown Lemon Squeezy API error');
    }

    return responseData;
  } catch (error) {
    console.error('Checkout creation error:', error);
    throw error;
    }
  }
}

export const getSubscriptionTiers = () => {
  return SUBSCRIPTION_TIERS;
};

export const getSubscriptionTier = (id: string) => {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === id);
};

export const getSubscriptionVariantId = (id: string) => {
  const tier = getSubscriptionTier(id);
  return tier?.variantId;
};

// Export a singleton instance
export const subscriptionService = SubscriptionService.getInstance();
