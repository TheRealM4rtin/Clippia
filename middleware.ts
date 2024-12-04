import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const url = new URL(request.url)
  const response = await updateSession(request)

  // Redirect to login if not authenticated
  if (url.pathname === '/') {
    const session = await response.cookies.get('sb-auth-token')
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}