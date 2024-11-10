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
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')
    const error = requestUrl.searchParams.get('error')
    const error_description = requestUrl.searchParams.get('error_description')

    // Log the initial state
    logger.info('Auth callback parameters', { code, token, type, error, error_description })

    if (error || error_description) {
      logger.error('Auth callback received error params', { error, error_description })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(error_description || '')}`
      )
    }

    const supabase = createClient()

    // Handle token verification if present
    if (token && type === 'signup') {
      logger.info('Attempting to verify signup token')
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (verifyError) {
        logger.error('Token verification error:', verifyError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=${encodeURIComponent(verifyError.name)}&description=${encodeURIComponent(verifyError.message)}`
        )
      }
    }
    
    // Handle code exchange if present
    if (code) {
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

      logger.info('Session exchange successful', {
        userId: sessionData.user?.id
      })
    }

    // Successful verification - redirect to home
    logger.info('Redirecting to home page')
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL))

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