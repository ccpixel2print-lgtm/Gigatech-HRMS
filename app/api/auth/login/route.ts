import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signJWT } from '@/lib/auth'

const LOCK_DURATION_MINUTES = 15
const MAX_FAILED_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
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
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact administrator.' },
        { status: 403 }
      )
    }

    // CRITICAL: Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (1000 * 60)
      )
      return NextResponse.json(
        { 
          error: `Account is locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
          lockedUntil: user.lockedUntil.toISOString()
        },
        { status: 429 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
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
      return NextResponse.json(
        { 
          error: `Invalid credentials. ${remainingAttempts} attempt(s) remaining before account lock.`,
          remainingAttempts
        },
        { status: 401 }
      )
    }

    // SUCCESS: Reset failed attempts and unlock account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    })

    // Create audit log
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

    // Generate JWT
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

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
