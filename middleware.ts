import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'

// Define protected routes and their required roles
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/hr': ['HR_MANAGER', 'ADMIN'],
  '/team': ['TEAM_LEAD', 'HR_MANAGER', 'ADMIN'],
  '/employee': ['EMPLOYEE', 'TEAM_LEAD', 'HR_MANAGER', 'ADMIN'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    // Redirect to login if no token
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify token
  const payload = await verifyJWT(token)

  if (!payload) {
    // Invalid token - redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    
    // Clear invalid token
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/'
    })
    
    return response
  }

  // For API routes (except /api/auth), just add user headers and continue
  // The API routes themselves will handle authorization
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId.toString())
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-roles', JSON.stringify(payload.roles))
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  // Check role-based access
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      const hasRequiredRole = allowedRoles.some(role => payload.roles.includes(role))
      
      if (!hasRequiredRole) {
        // User doesn't have required role - redirect to unauthorized page
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
      
      break
    }
  }

  // Add user info to request headers for use in API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId.toString())
  requestHeaders.set('x-user-email', payload.email)
  requestHeaders.set('x-user-roles', JSON.stringify(payload.roles))

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
