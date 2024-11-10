import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

interface SessionData {
  user: Database['public']['Tables']['profiles']['Row'] & {
    role?: string;
    email?: string;
  };
  access_token: string;
  refresh_token: string;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    const { data: { session }, error } = await supabase.auth.getSession()
    
    response.headers.set(
      'x-supabase-auth', 
      session ? 'authenticated' : 'unauthenticated'
    )

    if (session?.user) {
      response.headers.set('x-user-id', session.user.id)
      response.headers.set('x-user-email', session.user.email || '')
      response.headers.set('x-user-role', session.user.role || 'user')
    }

    if (error) {
      console.error('Session error:', error.message)
    }

  } catch (err) {
    console.error('Middleware error:', err)
  }

  return response
}

export function getSessionFromRequest(request: NextRequest): { 
  refreshToken: string; 
  accessToken: string; 
} | null {
  const refreshToken = request.cookies.get('sb-refresh-token')?.value
  const accessToken = request.cookies.get('sb-access-token')?.value

  if (refreshToken && accessToken) {
    return {
      refreshToken,
      accessToken,
    }
  }

  return null
}