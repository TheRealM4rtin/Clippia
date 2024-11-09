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

    // If there's an error in the URL, redirect to error page with details
    if (error || error_description) {
      logger.error('Auth callback error:', { error, error_description })
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=${error}&description=${error_description}`
      )
    }

    if (!code) {
      throw new Error('No code provided')
    }

    const supabase = createClient()
    
    // Exchange code for session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      throw sessionError
    }

    // Get the user and update their profile
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      throw userError
    }

    if (user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) {
        logger.error('Profile update error:', profileError)
      }
    }

    // Redirect to the home page
    return NextResponse.redirect(process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin)
  } catch (error) {
    logger.error('Auth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error`
    )
  }
}