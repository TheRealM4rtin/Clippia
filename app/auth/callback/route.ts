import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// This tells Next.js that this route should always be handled dynamically at runtime,
// which is necessary for auth callbacks since they need to process dynamic URL parameters and tokens.
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
      const supabase = createClient()
      
      // Exchange code for session
      await supabase.auth.exchangeCodeForSession(code)

      // Get the user and update their profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
      }
    }

    // Redirect to the home page
    return NextResponse.redirect(requestUrl.origin)
  } catch (error) {
    console.error('Auth callback error:', error)
    return NextResponse.redirect(
      `${new URL(request.url).origin}/auth-error`
    )
  }
}