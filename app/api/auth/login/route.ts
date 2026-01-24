import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/auth'

const LOCK_DURATION_MINUTES = 15
const MAX_FAILED_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    console.log('[LOGIN] Starting login request...')
    
    const body = await request.json()
    const { email, password } = body

    console.log('[LOGIN] Email:', email)

    // Validate input
    if (!email || !password) {
      console.log('[LOGIN] Missing email or password')
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    console.log('[LOGIN] Finding user in database...')
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      console.log('[LOGIN] User not found')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('[LOGIN] User found:', user.id)

    // Check if user is active
    if (!user.isActive) {
      console.log('[LOGIN] User inactive')
      return NextResponse.json(
        { error: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      )
    }

    // CRITICAL: Check if account is locked - handle null safely
    if (user.lockedUntil) {
      const lockUntilDate = new Date(user.lockedUntil)
      const now = new Date()
      
      if (lockUntilDate > now) {
        const remainingMinutes = Math.ceil(
          (lockUntilDate.getTime() - now.getTime()) / (1000 * 60)
        )
        console.log('[LOGIN] Account locked until:', lockUntilDate)
        return NextResponse.json(
          { 
            error: `Account is locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
            lockedUntil: lockUntilDate.toISOString()
          },
          { status: 429 }
        )
      }
    }

    // Verify password
    console.log('[LOGIN] Verifying password...')
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      console.log('[LOGIN] Invalid password')
      // CRITICAL: Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1
      const updateData: any = {
        failedLoginAttempts: newFailedAttempts
      }

      // Lock account if max attempts reached
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date()
        lockUntil.setMinutes(lockUntil.getMinutes() + LOCK_DURATION_MINUTES)
        updateData.lockedUntil = lockUntil

        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        })

        console.log('[LOGIN] Account locked until:', lockUntil)
        return NextResponse.json(
          { 
            error: `Too many failed login attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`,
            lockedUntil: lockUntil.toISOString()
          },
          { status: 429 }
        )
      }

      // Update failed attempts
      await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })

      const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts
      console.log('[LOGIN] Failed attempts:', newFailedAttempts, 'Remaining:', remainingAttempts)
      return NextResponse.json(
        { 
          error: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lock.`,
          remainingAttempts
        },
        { status: 401 }
      )
    }

    // SUCCESS: Reset failed attempts and unlock account
    console.log('[LOGIN] Password valid, resetting failed attempts...')
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    })

    // Create audit log
    console.log('[LOGIN] Creating audit log...')
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        newData: {
          timestamp: new Date().toISOString(),
          email: user.email
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Extract roles
    const roles = user.userRoles.map(ur => ur.role.name)
    console.log('[LOGIN] User roles:', roles)

    // Generate JWT
    console.log('[LOGIN] Generating JWT...')
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      roles
    })

    // Create response with HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          roles
        }
      },
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    console.log('[LOGIN] Login successful for user:', user.id)
    return response

  } catch (error: any) {
    console.error('[LOGIN] ERROR:', error)
    console.error('[LOGIN] Error stack:', error.stack)
    console.error('[LOGIN] Error message:', error.message)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

