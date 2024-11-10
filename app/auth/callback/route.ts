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
    
    // If there's no code, redirect to auth-error
    if (!code) {
      logger.error('No code provided in callback')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=missing_code&description=No verification code was provided`
      )
    }

    const supabase = createClient()
    
    // Exchange code for session
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
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=no_session&description=No session data was returned`
      )
    }

    // If everything is successful, redirect to home
    return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clippia.io')
    
  } catch (error) {
    logger.error('Auth callback error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=server_error&description=${encodeURIComponent(errorMessage)}`
    )
  }
}