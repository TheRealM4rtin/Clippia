// /app/api/checkout/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/utils/supabase/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const STORE_URL = "https://clippia.lemonsqueezy.com/";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, userEmail } = await request.json();

    if (!userId || !userEmail) {
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

    const storeUrl = new URL(STORE_URL);
    storeUrl.searchParams.append("custom[user_id]", userId);
    storeUrl.searchParams.append("checkout[email]", userEmail);
    storeUrl.searchParams.append("prefill[email]", userEmail);
    // storeUrl.searchParams.append("test", "true");

    console.log("Generated store URL:", storeUrl.toString());

    return NextResponse.json({ url: storeUrl.toString() });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
