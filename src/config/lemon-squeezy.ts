import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export type SubscriptionTier = "basic" | "early_adopter" | "support";

// Initialize the Lemon Squeezy SDK
lemonSqueezySetup({
  apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
  onError: (error) => {
    console.error("Lemon Squeezy Error:", error);
  },
});

export const LEMON_SQUEEZY_CONFIG = {
  apiKey: process.env.LEMON_SQUEEZY_API_KEY,
  webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET,
  storeId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL,
  products: {
    basic: {
      variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_VARIANT_ID,
      name: "Basic Plan",
      features: ["Basic AI Features", "Standard Support"],
    },
    early_adopter: {
      variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_EARLY_ADOPTER_VARIANT_ID,
      name: "Early Adopter",
      features: [
        "All Basic Features",
        "Early Access to New Features",
        "Priority Support",
      ],
    },
    support: {
      variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_SUPPORT_VARIANT_ID,
      name: "Support Plan",
      features: [
        "All Features",
        "Direct Support Channel",
        "Custom Integration Support",
      ],
    },
  },
} as const;

// Validate config
if (!LEMON_SQUEEZY_CONFIG.apiKey) {
  throw new Error("Missing LEMON_SQUEEZY_API_KEY");
}

if (!LEMON_SQUEEZY_CONFIG.webhookSecret) {
  throw new Error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET");
}

if (!LEMON_SQUEEZY_CONFIG.storeId) {
  throw new Error("Missing LEMON_SQUEEZY_STORE_ID");
}

if (!LEMON_SQUEEZY_CONFIG.baseUrl) {
  throw new Error("Missing NEXT_PUBLIC_APP_URL");
}

// Validate product variant IDs
Object.entries(LEMON_SQUEEZY_CONFIG.products).forEach(([tier, product]) => {
  if (!product.variantId) {
    throw new Error(`Missing variant ID for ${tier} tier`);
  }
});
