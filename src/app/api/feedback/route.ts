import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

const supabase = getSupabaseClient()!;

const limiter = {
  check: async (limit: number) => {
    const result = await rateLimit("feedback", limit, 60);
    if (!result.success) {
      throw new Error("Rate limit exceeded");
    }
  },
};

export async function POST(request: Request) {
  try {
    await limiter.check(5); // 5 requests per minute
  } catch {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const { username, feedback, wouldContribute, contributionDetails } =
      await request.json();

    const { error } = await supabase.from("feedback").insert({
      username,
      feedback,
      would_contribute: wouldContribute,
      contribution_details: contributionDetails,
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to submit feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Feedback submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
