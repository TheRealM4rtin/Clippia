import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  
  // Always redirect non-www to www
  if (request.headers.get('host')?.startsWith('clippia.io')) {
    return NextResponse.redirect(
      `https://www.clippia.io${url.pathname}${url.search}`
    )
  }

  // Handle auth error redirects
  if (url.pathname === '/' && (url.searchParams.has('error') || url.searchParams.has('error_code'))) {
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    
    return NextResponse.redirect(
      `https://www.clippia.io/auth-error?error=${encodeURIComponent(error || '')}&description=${encodeURIComponent(errorDescription || '')}`
    )
  }

  // Update auth session
  const response = await updateSession(request)

  // Protected routes check
  const protectedPaths = ['/dashboard', '/settings', '/profile']
  if (
    protectedPaths.some(path => url.pathname.startsWith(path)) &&
    response.headers.get('x-supabase-auth') !== 'authenticated'
  ) {
    return NextResponse.redirect(
      `https://www.clippia.io/login?redirect=${encodeURIComponent(url.pathname)}`
    )
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}