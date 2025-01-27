import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

let supabase: ReturnType<typeof createBrowserClient<Database>> | null = null;
let supabaseAdmin: ReturnType<typeof createBrowserClient<Database>> | null =
  null;

export function getSupabaseClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!supabase) {
    supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return supabase;
}

// Get the admin client (server-side only)
export function getSupabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("Admin client cannot be used on the client side");
  }

  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Admin credentials not found");
    }

    supabaseAdmin = createBrowserClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return supabaseAdmin;
}
