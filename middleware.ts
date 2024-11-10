import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  
  // Handle root path with error parameters
  if (url.pathname === '/' && (url.searchParams.has('error') || url.searchParams.has('error_code'))) {
    const error = url.searchParams.get('error')
    const error_description = url.searchParams.get('error_description')
    
    // Redirect to auth-error page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(error_description || '')}`
    )
  }

  // Handle domain redirect
  if (request.headers.get('host') === 'clippia.io') {
    return NextResponse.redirect(
      `https://www.clippia.io${request.nextUrl.pathname}${request.nextUrl.search}`
    )
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}