import type { User, UserIdentity } from '@supabase/supabase-js'
import type { Database } from './database'

// Get profile type from database
type DbProfileRow = Database['public']['Tables']['profiles']['Row']

export interface AuthUser extends Omit<User, keyof DbProfileRow>, DbProfileRow {
  role?: string;
  email: string | null;
  email_verified?: boolean;
  confirmed_at?: string;
  app_metadata: {
    provider?: string;
    [key: string]: string | undefined;
  };
  user_metadata: {
    [key: string]: string | undefined;
  };
  identities?: UserIdentity[];
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: AuthUser;
}

export interface AuthResponse<T = { user: AuthUser | null; session: Session | null }> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface VerificationStatus {
  email_verified: boolean | null;
}

// Helper types for profile operations
export type ProfileOperation = {
  Insert: Database['public']['Tables']['profiles']['Insert']
  Update: Database['public']['Tables']['profiles']['Update']
  Row: Database['public']['Tables']['profiles']['Row']
}