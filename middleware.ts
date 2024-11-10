import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Redirect from clippia.io to www.clippia.io
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