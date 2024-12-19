import { createHmac, timingSafeEqual } from 'crypto';

// Configuration
const LEMON_SQUEEZY_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_API_KEY,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
};

if (!LEMON_SQUEEZY_CONFIG.apiKey) {
  throw new Error('Missing NEXT_PUBLIC_LEMON_SQUEEZY_API_KEY environment variable');
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hmac = createHmac('sha256', secret);
    const digest = hmac.update(payload).digest('hex');
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(digest)
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false;
  }
}

export async function createWebhook() {
  const response = await fetch('https://api.lemonsqueezy.com/v1/webhooks', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`
    },
    body: JSON.stringify({
      data: {
        type: 'webhooks',
        attributes: {
          url: `${LEMON_SQUEEZY_CONFIG.baseUrl}/api/webhooks/lemon-squeezy`,
          events: ['order_created', 'subscription_created', 'subscription_updated'],
          secret: LEMON_SQUEEZY_CONFIG.webhookSecret
        }
      }
    })
  });

  if (!response.ok) {
    console.error('Failed to create webhook:', await response.text());
    return null;
  }

  return response.json();
}

export async function createCheckoutSession(
  storeId: string,
  variantId: string,
  options: {
    checkoutData?: {
      email?: string;
      custom?: Record<string, string>;
    };
    checkoutOptions?: {
      embed?: boolean;
    };
  }
) {
  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          store_id: storeId,
          variant_id: variantId,
          custom_data: options.checkoutData?.custom,
          customer_email: options.checkoutData?.email,
          embed: options.checkoutOptions?.embed
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Checkout creation failed: ${await response.text()}`);
  }

  return response.json();
}

export { LEMON_SQUEEZY_CONFIG }; 