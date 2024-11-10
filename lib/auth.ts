import { createClient } from '@/utils/supabase/client'
import logger from '@/lib/logger'

const supabase = createClient()

export const signUp = async (email: string, password: string) => {
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  console.log('Redirect URL:', redirectTo) // Debug log

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      }
    })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('Signup error:', error)
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

export const checkVerificationStatus = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('email_verified')
      .eq('id', user.id)
      .single()

    return profile
  } catch (error) {
    logger.error('Verification check error:', error)
    return null
  }
}

export const resendVerificationEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      logger.error('Resend verification error:', error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    logger.error('Resend verification error:', error)
    return {
      error: error instanceof Error ? error.message : 'Failed to resend verification email'
    }
  }
}
