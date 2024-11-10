import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('token') // Get as code instead of token
    const type = requestUrl.searchParams.get('type')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    logger.info('Auth callback request:', {
      url: request.url,
      type,
      error,
      errorDescription,
      hasCode: !!code
    })

    if (error || errorDescription) {
      return NextResponse.redirect(
        `https://www.clippia.io/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(errorDescription || '')}`
      )
    }

    const supabase = createClient()

    // Handle both signup verification and magic links
    if (code) {
      logger.info('Processing authentication code')
      
      const { error: signInError } = await supabase.auth.exchangeCodeForSession(code)

      if (signInError) {
        logger.error('Authentication error:', signInError)
        return NextResponse.redirect(
          `https://www.clippia.io/auth-error?error=auth_failed&description=${encodeURIComponent(signInError.message)}`
        )
      }

      // After successful verification/signin, redirect to home
      return NextResponse.redirect('https://www.clippia.io/')
    }

    // No code present
    logger.error('No authentication code found')
    return NextResponse.redirect(
      'https://www.clippia.io/auth-error?error=invalid_request&description=Missing authentication code'
    )
  } catch (error) {
    logger.error('Auth callback error:', error)
    return NextResponse.redirect(
      `https://www.clippia.io/auth-error?error=server_error&description=${encodeURIComponent((error as Error).message || 'An unexpected error occurred')}`
    )
  }
}