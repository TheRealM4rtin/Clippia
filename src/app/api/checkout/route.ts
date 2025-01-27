// /app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/utils/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createCheckoutSession } from "@/lib/lemon-squeezy";

const storeId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID;
if (!storeId) {
  throw new Error("Store ID is not defined");
}

// In /app/api/checkout/route.ts
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const supabaseAdmin = getSupabaseAdmin();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("Received checkout request:", {
      ...body,
      userId: body.userId ? "Present" : "Missing",
      userEmail: body.userEmail ? "Present" : "Missing",
      variantId: body.variantId ? "Present" : "Missing",
    });

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID) {
      console.error("Missing NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!process.env.LEMON_SQUEEZY_API_KEY) {
      console.error("Missing LEMON_SQUEEZY_API_KEY");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Create checkout attempt record
    try {
      const { error: checkoutError } = await supabaseAdmin.rpc(
        "create_checkout_attempt",
        {
          p_user_id: body.userId,
          p_user_email: body.userEmail,
          p_variant_id: body.variantId,
        }
      );

      if (checkoutError) {
        console.error("Failed to create checkout attempt:", checkoutError);
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Continue with checkout even if DB logging fails
    }

    try {
      const checkoutData = await createCheckoutSession(
        process.env.NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID!,
        body.variantId,
        {
          checkoutData: {
            email: body.userEmail,
            custom: {
              user_id: body.userId,
            },
          },
          checkoutOptions: {
            embed: true,
          },
        }
      );

      if (!checkoutData?.data?.attributes?.url) {
        console.error("Invalid checkout response:", checkoutData);
        return NextResponse.json(
          { error: "Invalid checkout response" },
          { status: 500 }
        );
      }

      return NextResponse.json({ url: checkoutData.data.attributes.url });
    } catch (checkoutError) {
      console.error("Checkout creation failed:", checkoutError);
      return NextResponse.json(
        {
          error:
            checkoutError instanceof Error
              ? checkoutError.message
              : "Checkout creation failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
