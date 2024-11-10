import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'
import { Session } from '@/types/auth'
import { SupabaseError } from '@/types/errors'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Type for auth responses
export interface AuthResponse<T = Session> {
  data: T | null;
  error: string | null;
  message?: string;
}

// Add type for user session
type UserSession = {
  user: Database['public']['Tables']['profiles']['Row'] & {
    email?: string;
    confirmed_at?: string;
  };
  session: Session;
};

// Helper to get typed table data
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

// Helper to get insert types
export type InsertType<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

// Helper to get update types
export type UpdateType<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Type-safe auth functions
export const auth = {
  signUp: async (email: string, password: string): Promise<AuthResponse<UserSession>> => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
          data: {
            email_verified: false
          }
        }
      })

      if (error) throw error

      return {
        data: data as UserSession,
        error: null,
        message: data.user && !data.user.confirmed_at 
          ? 'Please check your email to verify your account' 
          : 'Signup successful'
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return {
        data: null,
        error: errorMessage
      }
    }
  },

  signIn: async (email: string, password: string): Promise<AuthResponse<UserSession>> => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return { data: data as UserSession, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return {
        data: null,
        error: errorMessage
      }
    }
  },

  signOut: async (): Promise<AuthResponse<null>> => {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      return {
        data: null,
        error: null,
        message: 'Signed out successfully'
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign out'
      return {
        data: null,
        error: errorMessage
      }
    }
  }
}