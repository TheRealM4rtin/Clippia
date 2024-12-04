// app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
      const supabase = createClient();
      await supabase.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(requestUrl.origin);
  } catch (error) {
    logger.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/error', request.url).toString());
  }
}