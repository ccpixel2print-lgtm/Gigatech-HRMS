import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/leaves/balance/[employeeId] - Get leave balances for an employee
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ employeeId: string }> }
) {
  try {
    // Await params in Next.js 14+
    const params = await context.params;
    
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

    const employeeId = parseInt(params.employeeId);

    // Verify employeeId is valid
    if (isNaN(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID' },
        { status: 400 }
      );
    }

    // Check authorization: admin can view any, employees can view only their own
    const hasAdminAccess = userRoles.some((role: string) => 
      ['ADMIN', 'HR_MANAGER'].includes(role)
    );

    if (!hasAdminAccess) {
      // Check if this employee belongs to the logged-in user
      const employee = await prisma.employee.findUnique({
        where: { 
          id: employeeId,
          userId: parseInt(userId)
        },
        select: { id: true }
      });

      if (!employee) {
        return NextResponse.json(
          { error: 'Forbidden: You can only view your own leave balance' },
          { status: 403 }
        );
      }
    }

    // Get all active leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        annualQuota: true,
        isPaid: true,
        carryForward: true,
      },
      orderBy: { code: 'asc' }
    });

    const currentYear = new Date().getFullYear();

    // Calculate balances for each leave type
    const balances = [];
    for (const leaveType of leaveTypes) {
      // Get approved leaves for this year and leave type
      const approvedLeaves = await prisma.leaveApplication.findMany({
        where: {
          employeeId: employeeId,
          leaveTypeId: leaveType.id,
          status: 'APPROVED',
          fromDate: {
            gte: new Date(`${currentYear}-01-01`),
            lte: new Date(`${currentYear}-12-31`)
          }
        },
        select: {
          totalDays: true
        }
      });

      // Sum up total days taken
      const totalUsed = approvedLeaves.reduce((sum, leave) => {
        return sum + parseFloat(leave.totalDays.toString());
      }, 0);

      // Calculate available balance
      const quota = parseFloat(leaveType.annualQuota.toString());
      const available = quota - totalUsed;

      balances.push({
        leaveTypeId: leaveType.id,
        code: leaveType.code,
        name: leaveType.name,
        quota,
        used: totalUsed,
        available: Math.max(0, available), // Ensure non-negative
        isPaid: leaveType.isPaid,
        carryForward: leaveType.carryForward,
      });
    }

    // Get pending applications count
    const pendingCount = await prisma.leaveApplication.count({
      where: {
        employeeId,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      employeeId,
      year: currentYear,
      balances,
      pendingCount,
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Failed to fetch leave balance', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
