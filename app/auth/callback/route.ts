import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

// This tells Next.js that this route should always be handled dynamically at runtime,
// which is necessary for auth callbacks since they need to process dynamic URL parameters and tokens.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  logger.info('Auth callback initiated', {
    url: request.url,
    params: Object.fromEntries(requestUrl.searchParams)
  })

  try {
    const code = requestUrl.searchParams.get('code')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Log the initial state
    logger.info('Auth callback parameters', { code, error, error_description })

    if (error || error_description) {
      logger.error('Auth callback received error params', { error, error_description })
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
    
    // Log before session exchange
    logger.info('Attempting to exchange code for session')
    
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      logger.error('Session exchange error:', {
        error: sessionError,
        code: code
      })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=${encodeURIComponent(sessionError.name)}&description=${encodeURIComponent(sessionError.message)}`
      )
    }

    // Log successful session exchange
    logger.info('Session exchange successful', {
      userId: sessionData.user?.id
    })

    // Successful verification - redirect to home
    const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_SITE_URL)
    logger.info('Redirecting to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    logger.error('Unexpected auth callback error:', {
      error,
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=server_error&description=${encodeURIComponent((error as Error).message || 'An unexpected error occurred')}`
    )
  }
}