import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leaves/applications - List all leave applications
export async function GET(request: NextRequest) {
  try {
    // Get user from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRolesHeader = request.headers.get('x-user-roles');
    const userRoles = userRolesHeader ? JSON.parse(userRolesHeader) : [];

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const hasAdminAccess = userRoles.some((role: string) => 
      ['ADMIN', 'HR_MANAGER'].includes(role)
    );

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    // Build query
    const where: any = {};
    
    // If not admin, find their employee record and show only their applications
    if (!hasAdminAccess) {
      const employee = await prisma.employee.findUnique({
        where: { userId: parseInt(userId) },
        select: { id: true }
      });
      
      if (employee) {
        where.employeeId = employee.id;
      } else {
        // User is not an employee, return empty array
        return NextResponse.json([]);
      }
    } else if (employeeId) {
      // Admin can filter by specific employee
      where.employeeId = parseInt(employeeId);
    }
    // If admin and no employeeId filter, return all applications (where remains empty)

    const applications = await prisma.leaveApplication.findMany({
      where,
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true,
            isPaid: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('✅ Fetched leave applications:', {
      count: applications.length,
      userId,
      userRoles,
      hasAdminAccess,
      where,
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching leave applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leave applications' },
      { status: 500 }
    );
  }
}

// POST /api/leaves/applications - Create new leave application
export async function POST(request: NextRequest) {
  try {
    // Get user from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRolesHeader = request.headers.get('x-user-roles');
    const userRoles = userRolesHeader ? JSON.parse(userRolesHeader) : [];

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      employeeId,
      leaveTypeId,
      fromDate,
      toDate,
      isHalfDayStart,
      isHalfDayEnd,
      reason,
      contactDuringLeave,
    } = body;

    // Validate required fields
    if (!employeeId || !leaveTypeId || !fromDate || !toDate || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, leaveTypeId, fromDate, toDate, reason' },
        { status: 400 }
      );
    }

    // CRITICAL VALIDATION: Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if leave type exists
    const leaveType = await prisma.leaveType.findUnique({
      where: { id: leaveTypeId },
    });

    if (!leaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      );
    }

    // Parse dates
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Validate date range
    if (from > to) {
      return NextResponse.json(
        { error: 'From date cannot be after To date' },
        { status: 400 }
      );
    }

    // CRITICAL VALIDATION: Overlap Check
    // Check if requested dates overlap with existing APPROVED or PENDING leaves
    const overlappingLeaves = await prisma.leaveApplication.findMany({
      where: {
        employeeId,
        status: {
          in: ['PENDING', 'L1_APPROVED', 'L2_APPROVED', 'APPROVED'],
        },
        OR: [
          // Case 1: Existing leave starts during requested period
          {
            fromDate: {
              gte: from,
              lte: to,
            },
          },
          // Case 2: Existing leave ends during requested period
          {
            toDate: {
              gte: from,
              lte: to,
            },
          },
          // Case 3: Existing leave completely covers requested period
          {
            AND: [
              { fromDate: { lte: from } },
              { toDate: { gte: to } },
            ],
          },
        ],
      },
    });

    if (overlappingLeaves.length > 0) {
      return NextResponse.json(
        {
          error: 'Leave dates overlap with existing leave application',
          overlappingLeaves: overlappingLeaves.map(l => ({
            id: l.id,
            fromDate: l.fromDate,
            toDate: l.toDate,
            status: l.status,
          })),
        },
        { status: 409 }
      );
    }

    // Calculate total days
    const timeDiff = to.getTime() - from.getTime();
    let totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end dates

    // Adjust for half days
    if (isHalfDayStart) totalDays -= 0.5;
    if (isHalfDayEnd) totalDays -= 0.5;

    // BALANCE CHECK (MVP: Simple check if balance exists)
    // For production, implement full balance validation
    const leaveBalance = await prisma.employeeLeaveBalance.findFirst({
      where: {
        employeeId,
        leaveTypeId,
        year: new Date().getFullYear(),
      },
    });

    // If balance exists and leave is paid, check if sufficient balance
    if (leaveBalance && leaveType.isPaid) {
      const availableBalance = leaveBalance.closing - leaveBalance.used;
      if (availableBalance < totalDays) {
        return NextResponse.json(
          {
            error: 'Insufficient leave balance',
            requested: totalDays,
            available: availableBalance.toString(),
          },
          { status: 400 }
        );
      }
    }

    // Create leave application
    const leaveApplication = await prisma.leaveApplication.create({
      data: {
        employeeId,
        leaveTypeId,
        fromDate: from,
        toDate: to,
        isHalfDayStart: isHalfDayStart || false,
        isHalfDayEnd: isHalfDayEnd || false,
        totalDays,
        reason,
        contactDuringLeave,
        status: 'PENDING',
      },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        leaveType: {
          select: {
            id: true,
            code: true,
            name: true,
            isPaid: true,
          },
        },
      },
    });

    console.log('✅ Leave application created:', {
      id: leaveApplication.id,
      employee: employee.user.fullName,
      leaveType: leaveType.name,
      fromDate: from.toISOString().split('T')[0],
      toDate: to.toISOString().split('T')[0],
      totalDays,
      status: leaveApplication.status,
    });

    return NextResponse.json(leaveApplication, { status: 201 });
  } catch (error) {
    console.error('Error creating leave application:', error);
    return NextResponse.json(
      { error: 'Failed to create leave application' },
      { status: 500 }
    );
  }
}
