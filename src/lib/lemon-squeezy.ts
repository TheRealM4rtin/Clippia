import { createHmac, timingSafeEqual } from 'crypto';
import { LEMON_SQUEEZY_CONFIG } from '@/config/lemon-squeezy';

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