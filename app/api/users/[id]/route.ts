import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for update
const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.number()).min(1).optional(),
  action: z.enum(['update', 'unlock']).optional()
})

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const formattedUser = {
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
    }

    return NextResponse.json(formattedUser, { status: 200 })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH - Update user or unlock account
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { fullName, isActive, roleIds, action } = validation.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Handle unlock action
    if (action === 'unlock') {
      const unlockedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null
        },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      })

      return NextResponse.json({
        id: unlockedUser.id,
        email: unlockedUser.email,
        fullName: unlockedUser.fullName,
        isActive: unlockedUser.isActive,
        failedLoginAttempts: unlockedUser.failedLoginAttempts,
        lockedUntil: unlockedUser.lockedUntil,
        isLocked: false,
        roles: unlockedUser.userRoles.map(ur => ({
          id: ur.role.id,
          name: ur.role.name
        }))
      }, { status: 200 })
    }

    // Prepare update data
    const updateData: any = {}
    if (fullName !== undefined) updateData.fullName = fullName
    if (isActive !== undefined) updateData.isActive = isActive

    // Handle role updates
    if (roleIds && roleIds.length > 0) {
      // Verify roles exist
      const roles = await prisma.role.findMany({
        where: {
          id: {
            in: roleIds
          }
        }
      })

      if (roles.length !== roleIds.length) {
        return NextResponse.json(
          { error: 'One or more invalid role IDs' },
          { status: 400 }
        )
      }

      // Delete existing roles and create new ones
      await prisma.userRole.deleteMany({
        where: { userId }
      })

      updateData.userRoles = {
        create: roleIds.map(roleId => ({
          roleId
        }))
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    const formattedUser = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      isActive: updatedUser.isActive,
      failedLoginAttempts: updatedUser.failedLoginAttempts,
      lockedUntil: updatedUser.lockedUntil,
      isLocked: updatedUser.lockedUntil ? updatedUser.lockedUntil > new Date() : false,
      roles: updatedUser.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description
      })),
      updatedAt: updatedUser.updatedAt
    }

    return NextResponse.json(formattedUser, { status: 200 })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete user (set isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Soft delete
    const deletedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        message: 'User deactivated successfully',
        userId: deletedUser.id
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
