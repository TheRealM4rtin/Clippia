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
    const token = requestUrl.searchParams.get('token')
    const type = requestUrl.searchParams.get('type')
    
    const supabase = createClient()

    // Handle token verification
    if (token && type === 'signup') {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      })

      if (verifyError) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=verification_failed&description=${encodeURIComponent(verifyError.message)}`
        )
      }
    }

    // Handle code exchange
    if (code) {
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=session_error&description=${encodeURIComponent(sessionError.message)}`
        )
      }
    }

    // Successful verification
    return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.clippia.io')
  } catch (error) {
    logger.error('Auth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=server_error&description=${encodeURIComponent((error as Error).message || 'An unexpected error occurred')}`
    )
  }
}