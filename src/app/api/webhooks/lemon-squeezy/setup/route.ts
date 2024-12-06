import { NextResponse } from 'next/server';
import { createWebhook } from '@/lib/lemon-squeezy';
import { LEMON_SQUEEZY_CONFIG } from '@/config/lemon-squeezy';

export async function POST() {
  try {
    // Verify config
    const config = {
      storeId: LEMON_SQUEEZY_CONFIG.storeId,
      baseUrl: LEMON_SQUEEZY_CONFIG.baseUrl,
      hasApiKey: !!LEMON_SQUEEZY_CONFIG.apiKey,
      hasWebhookSecret: !!LEMON_SQUEEZY_CONFIG.webhookSecret
    };
    
    console.log('Verifying Lemon Squeezy config:', config);

    const missingConfigs = Object.entries(config)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missingConfigs.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing configuration',
          missingConfigs 
        },
        { status: 400 }
      );
    }

    console.log('Creating webhook...');
    const webhook = await createWebhook();

    if (!webhook) {
      return NextResponse.json(
        { 
          error: 'Failed to create webhook',
          config: {
            ...config,
            webhookUrl: `${LEMON_SQUEEZY_CONFIG.baseUrl}/api/webhooks/lemon-squeezy`
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      webhook,
      config
    });
  } catch (error) {
    console.error('Setup webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to setup webhook',
        details: error instanceof Error ? error.message : String(error),
        config: {
          storeId: LEMON_SQUEEZY_CONFIG.storeId,
          baseUrl: LEMON_SQUEEZY_CONFIG.baseUrl,
          hasApiKey: !!LEMON_SQUEEZY_CONFIG.apiKey,
          hasWebhookSecret: !!LEMON_SQUEEZY_CONFIG.webhookSecret
        }
      },
      { status: 500 }
    );
  }
} 