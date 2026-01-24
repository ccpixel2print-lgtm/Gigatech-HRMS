import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-this-in-production-min-32-chars-long'
)

const JWT_ALGORITHM = 'HS256'
const JWT_EXPIRATION = '24h' // Token expires in 24 hours

export interface JWTPayload {
  userId: number
  email: string
  roles: string[]
}

/**
 * Signs a JWT token with user information
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verifies and decodes a JWT token
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

/**
 * Extracts JWT from Authorization header or cookies
 */
export function extractToken(authHeader?: string | null, cookieToken?: string): string | null {
  // Check Authorization header first (Bearer token)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Fall back to cookie token
  if (cookieToken) {
    return cookieToken
  }
  
  return null
}

/**
 * Checks if user has required role
 */
export function hasRole(userRoles: string[], requiredRole: string): boolean {
  return userRoles.includes(requiredRole)
}

/**
 * Checks if user has any of the required roles
 */
export function hasAnyRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role))
}
