import { createClient } from '@/utils/supabase/client'
import logger from '@/lib/logger'

const supabase = createClient()

export const signUp = async (email: string, password: string) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;
      return { data: signInData, error: null };
    }

    throw new Error('No user data returned from signup');
  } catch (error) {
    console.error('Signup error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};

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
