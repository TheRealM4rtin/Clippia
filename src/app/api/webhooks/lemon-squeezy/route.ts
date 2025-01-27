import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { LEMON_SQUEEZY_CONFIG } from "@/config/lemon-squeezy";
import { verifyWebhookSignature } from "@/lib/lemon-squeezy";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  console.log("🔔 Webhook received");

  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.error("❌ Failed to initialize admin client");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Check if webhook secret is configured
    if (!LEMON_SQUEEZY_CONFIG?.webhookSecret) {
      console.error("❌ Webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 501 }
      );
    }

    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get("x-signature");

    console.log(
      "📝 Webhook headers:",
      Object.fromEntries(headersList.entries())
    );
    console.log("📦 Webhook body:", body);

    // Verify signature
    if (!signature) {
      console.error("❌ Missing signature");
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const isValid = verifyWebhookSignature(
      body,
      signature,
      LEMON_SQUEEZY_CONFIG.webhookSecret
    );
    if (!isValid) {
      console.error("❌ Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventName = event.meta.event_name;
    const userId = event.meta.custom_data?.user_id;

    if (!userId) {
      console.error("❌ No user_id in webhook data:", event);
      return NextResponse.json(
        { error: "No user_id provided" },
        { status: 400 }
      );
    }

    console.log(`👤 Processing event ${eventName} for user: ${userId}`);

    // Handle webhook event using RPC function
    const { data, error } = await supabaseAdmin.rpc("handle_webhook_event", {
      p_event_type: eventName,
      p_payload: event,
      p_user_id: userId,
    });

    if (error) {
      console.error("❌ Error processing webhook:", error);
      return NextResponse.json(
        { error: "Failed to process webhook" },
        { status: 500 }
      );
    }

    console.log("✅ Webhook processed successfully:", data);
    return NextResponse.json({ received: true, data });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
