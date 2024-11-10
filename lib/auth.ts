import { createClient } from '@/utils/supabase/client'
import logger from '@/lib/logger'
import type { AuthUser, AuthResponse, Session, VerificationStatus } from '@/types/auth'

const supabase = createClient()

export const checkVerificationStatus = async (): Promise<VerificationStatus | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // First check user metadata
    if (user.user_metadata?.email_verified !== undefined) {
      return {
        email_verified: user.user_metadata.email_verified as boolean
      }
    }

    // Then check if email is confirmed in auth
    if (user.confirmed_at) {
      return {
        email_verified: true
      }
    }

    // Default to not verified
    return {
      email_verified: false
    }
  } catch (error) {
    logger.error('Verification check error:', error)
    return null
  }
}

export const resendVerificationEmail = async (email: string): Promise<AuthResponse<null>> => {
  try {
    logger.info('Attempting to resend verification email')
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: 'https://www.clippia.io/auth/callback'
      }
    })

    if (error) {
      logger.error('Resend verification error:', error)
      throw error
    }

    return { 
      data: null,
      error: null,
      message: 'Verification email sent successfully'
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Failed to resend verification email'
    
    logger.error('Resend verification error:', errorMessage)
    return {
      data: null,
      error: errorMessage
    }
  }
}

export const signOut = async (): Promise<AuthResponse<null>> => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    return { 
      data: null, 
      error: null,
      message: 'Signed out successfully'
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? 
      error.message : 
      'Failed to sign out'
    
    return {
      data: null,
      error: errorMessage
    }
  }
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return null

    // Transform the user data to match AuthUser interface
    const authUser: AuthUser = {
      ...user,
      email: user.email || null,  // Explicitly handle email field
      email_verified: user.user_metadata?.email_verified || false,
      role: user.user_metadata?.role || 'user',
      created_at: user.created_at || null,
      updated_at: user.updated_at || null,
      // Add any other required fields from your profile
    }

    return authUser

  } catch (error) {
    logger.error('Get current user error:', error)
    return null
  }
}

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session as Session | null
  } catch (error) {
    logger.error('Get current session error:', error)
    return null
  }
}

// Type guard
export const isAuthUser = (user: unknown): user is AuthUser => {
  return Boolean(user) && 
    typeof user === 'object' && 
    user !== null &&
    'id' in user && 
    typeof (user as Record<string, unknown>).id === 'string'
}