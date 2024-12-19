// app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import logger from '@/lib/logger';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const supabase = createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) throw error;
      
      // Set auth cookie with session data
      const cookieStore = cookies();
      cookieStore.set('sb-auth', JSON.stringify(data), {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
    }

    return NextResponse.redirect(requestUrl.origin);
  } catch (error) {
    logger.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/error', request.url).toString());
  }
}