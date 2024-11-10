// app/api/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    logger.info('Callback URL:', requestUrl.toString())

    // For PKCE flow, we need to look for both code and token
    const code = requestUrl.searchParams.get('code') // Add this
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')
    const error = requestUrl.searchParams.get('error')
    const errorDescription = requestUrl.searchParams.get('error_description')
    
    logger.info('Auth callback params:', {
      hasCode: !!code,
      hasToken: !!token,
      type,
      error,
      errorDescription
    })

    if (error || errorDescription) {
      return NextResponse.redirect(
        `https://www.clippia.io/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(errorDescription || '')}`
      )
    }

    const supabase = createClient()

    // Handle PKCE token
    if (token && token.startsWith('pkce_')) {
      logger.info('Processing PKCE token')
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(token)
      
      if (sessionError) {
        logger.error('PKCE exchange error:', sessionError)
        return NextResponse.redirect(
          `https://www.clippia.io/auth-error?error=pkce_failed&description=${encodeURIComponent(sessionError.message)}`
        )
      }

      logger.info('PKCE exchange successful')
      return NextResponse.redirect('https://www.clippia.io/')
    }

    // Handle regular verification code
    if (code) {
      logger.info('Processing regular code')
      const { error: verifyError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (verifyError) {
        logger.error('Code exchange error:', verifyError)
        return NextResponse.redirect(
          `https://www.clippia.io/auth-error?error=verification_failed&description=${encodeURIComponent(verifyError.message)}`
        )
      }

      logger.info('Code exchange successful')
      return NextResponse.redirect('https://www.clippia.io/')
    }

    // If we get here, we're missing both code and token
    logger.error('No valid authentication parameters found')
    return NextResponse.redirect(
      'https://www.clippia.io/auth-error?error=invalid_request&description=Missing authentication parameters'
    )

  } catch (error) {
    logger.error('Auth callback error:', error)
    return NextResponse.redirect(
      `https://www.clippia.io/auth-error?error=server_error&description=${encodeURIComponent((error as Error).message || 'An unexpected error occurred')}`
    )
  }
}