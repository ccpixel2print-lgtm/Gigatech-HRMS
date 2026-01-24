import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const SALT_ROUNDS = 10

// Validation schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  roleIds: z.array(z.number()).min(1, 'At least one role is required'),
})

// GET - List all users with their roles
export async function GET(request: NextRequest) {
  try {
    // Check if user is ADMIN
    const rolesHeader = request.headers.get('x-user-roles')
    const roles = rolesHeader ? JSON.parse(rolesHeader) : []
    
    if (!roles.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    console.log('[API/USERS] Fetching all users...')
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`[API/USERS] Found ${users.length} users`)

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      isLocked: user.lockedUntil ? user.lockedUntil > new Date() : false,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return NextResponse.json(formattedUsers, { status: 200 })

  } catch (error) {
    console.error('[API/USERS] Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    // Check if user is ADMIN
    const rolesHeader = request.headers.get('x-user-roles')
    const roles = rolesHeader ? JSON.parse(rolesHeader) : []
    
    if (!roles.includes('ADMIN')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = createUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, fullName, password, roleIds } = validation.data

    console.log('[API/USERS] Creating user:', email)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Verify roles exist
    const validRoles = await prisma.role.findMany({
      where: {
        id: {
          in: roleIds
        }
      }
    })

    if (validRoles.length !== roleIds.length) {
      return NextResponse.json(
        { error: 'One or more invalid role IDs' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Create user with roles
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash,
        isActive: true,
        failedLoginAttempts: 0,
        userRoles: {
          create: roleIds.map(roleId => ({
            roleId
          }))
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    console.log('[API/USERS] User created successfully:', user.id)

    // Format response
    const formattedUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description
      })),
      createdAt: user.createdAt
    }

    return NextResponse.json(formattedUser, { status: 201 })

  } catch (error) {
    console.error('[API/USERS] Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
