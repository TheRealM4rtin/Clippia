import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    // Log incoming request details for debugging
    logger.info('Auth callback request:', {
      url: request.url,
      token: token ? '[REDACTED]' : 'none',
      type,
      error,
      errorDescription
    })

    // If there's an error in the URL, redirect to error page
    if (error || errorDescription) {
      return NextResponse.redirect(
        `https://www.clippia.io/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(errorDescription || '')}`
      )
    }

    const supabase = createClient()

    // Handle email verification with token
    if (token && type === 'signup') {
      logger.info('Attempting token verification')
      
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (verifyError) {
        logger.error('Token verification error:', verifyError)
        return NextResponse.redirect(
          `https://www.clippia.io/auth-error?error=verification_failed&description=${encodeURIComponent(verifyError.message)}`
        )
      }

      // Successful verification
      return NextResponse.redirect('https://www.clippia.io/')
    }

    // No token or unsupported type
    logger.error('Invalid callback parameters')
    return NextResponse.redirect(
      'https://www.clippia.io/auth-error?error=invalid_request&description=Invalid or missing authentication parameters'
    )
  } catch (error) {
    logger.error('Auth callback error:', error)
    return NextResponse.redirect(
      `https://www.clippia.io/auth-error?error=server_error&description=${encodeURIComponent((error as Error).message || 'An unexpected error occurred')}`
    )
  }
}