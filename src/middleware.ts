import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // Get the session
    const {
        data: { session },
    } = await supabase.auth.getSession();

    // For /api/checkout endpoint
    if (req.nextUrl.pathname === '/api/checkout') {
        // Check Authorization header
        const authHeader = req.headers.get('Authorization');
        
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // If we have a session, add it to the response
        if (session) {
            // Clone the response to modify headers
            const response = NextResponse.next();
            
            // Add session user to request headers
            response.headers.set('x-user-id', session.user.id);
            response.headers.set('x-user-email', session.user.email || '');
            
            return response;
        }
    }

    return res;
}

export const config = {
    matcher: [
        '/api/checkout',
        '/api/protected/:path*',
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
}; 