import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  try {
    // Initialize response - just pass through by default
    let response = NextResponse.next()

    // Rate limiting for API routes (optional - disabled for now to avoid blocking)
    // if (request.nextUrl.pathname.startsWith('/api')) {
    //   const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    //   const { success, limit, reset, remaining } = await checkRateLimit(ip)
    //   if (!success) {
    //     return NextResponse.json(
    //       { error: 'Too Many Requests' },
    //       { status: 429 }
    //     )
    //   }
    // }

    // Supabase auth refresh is handled by the browser/client
    // Attempting to refresh auth in proxy can cause issues on the edge runtime
    // The client-side useAuth hook will handle session management

    return response
  } catch (error) {
    // If proxy fails for any reason, still allow the request to proceed
    // This prevents proxy errors from blocking the entire app
    console.error('Proxy error:', error)
    return NextResponse.next()
  }
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

