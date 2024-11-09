import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

// This tells Next.js that this route should always be handled dynamically at runtime,
// which is necessary for auth callbacks since they need to process dynamic URL parameters and tokens.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Handle incoming error parameters
    if (error || error_description) {
      logger.error('Auth callback received error:', { error, error_description })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(error_description || '')}`
      )
    }

    if (!code) {
      logger.error('No code provided in callback')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=no_code&description=No verification code provided`
      )
    }

    const supabase = createClient()
    
    // Exchange code for session with error handling
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      logger.error('Session exchange error:', sessionError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=${encodeURIComponent(sessionError.name)}&description=${encodeURIComponent(sessionError.message)}`
      )
    }

    if (!sessionData.session || !sessionData.user) {
      logger.error('No session or user data returned')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=no_session&description=No session data returned`
      )
    }

    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: sessionData.user.id,
          email_verified: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (profileError) {
        logger.error('Profile update error:', profileError)
        // Continue with redirect even if profile update fails
      }
    } catch (profileError) {
      logger.error('Profile update error:', profileError)
      // Continue with redirect even if profile update fails
    }

    // Successful verification - redirect to home
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}`)
  } catch (error) {
    logger.error('Unexpected auth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=server_error&description=${encodeURIComponent((error as Error).message || 'An unexpected error occurred')}`
    )
  }
}