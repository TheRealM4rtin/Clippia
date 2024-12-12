// /app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/utils/supabase/server";
import { supabase } from "@/lib/supabase";


export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, userEmail, variantId } = await request.json();

    if (!userId || !userEmail || !variantId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the user ID matches the session
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 403 });
    }

    console.log("Creating checkout for user:", userId);

    // Create checkout attempt record
    const { error: checkoutError } = await supabase
      .from("checkout_attempts")
      .insert({
        user_id: userId,
        completed: false,
        status: "pending",
        created_at: new Date().toISOString(),
      });

    if (checkoutError) {
      console.error("Error creating checkout attempt:", checkoutError);
      return NextResponse.json(
        { error: "Failed to create checkout attempt" },
        { status: 500 }
      );
    }
    
    // Construct checkout URL with the variant ID and prefilled data
    const checkoutUrl = new URL(
      `https://clippia.lemonsqueezy.com/checkout/buy/${variantId}`
    );

    // Add user data as parameters
    checkoutUrl.searchParams.append("custom[user_id]", userId);
    checkoutUrl.searchParams.append("checkout[email]", userEmail);

    console.log("Generated checkout URL:", checkoutUrl.toString());

    return NextResponse.json({ url: checkoutUrl.toString() });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
