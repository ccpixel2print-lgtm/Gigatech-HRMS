import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId);

    // 2. Get Employee ID
    const employee = await prisma.employee.findFirst({
      where: { userId },
      select: { id: true } 
    });
    
    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // 3. Parse Body
    const body = await req.json();
    const { leaveTypeId, fromDate, toDate, reason } = body; 
    // Note: We ignore 'days' from body because we calculate it trustworthily here.

    // ---------------------------------------------------------
    // 3.5 SMART CALCULATION (Exclude Weekends & Holidays)
    // ---------------------------------------------------------
    const start = new Date(fromDate);
    const end = new Date(toDate);

    // Fetch Holidays in range
    const holidays = await prisma.holiday.findMany({
      where: {
        date: { gte: start, lte: end }
      }
    });
    
    const holidaySet = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));

    let calculatedDays = 0;
    let loopDate = new Date(start);

    while (loopDate <= end) {
      const dayOfWeek = loopDate.getDay(); // 0=Sun, 6=Sat
      const dateString = loopDate.toISOString().split('T')[0];

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dateString);

      if (!isWeekend && !isHoliday) {
        calculatedDays++;
      }
      
      // Next day
      loopDate.setDate(loopDate.getDate() + 1);
    }

    if (calculatedDays === 0) {
        return NextResponse.json({ error: "Selected dates are all holidays or weekends." }, { status: 400 });
    }
    // ---------------------------------------------------------

    // 4. Validate Balance (Using Calculated Days)
    const balanceRecord = await prisma.employeeLeaveBalance.findFirst({
      where: { 
        employeeId: employee.id, 
        leaveTypeId, 
        year: new Date().getFullYear()
      }
    });

    if (!balanceRecord || Number(balanceRecord.closing) < calculatedDays) {
       return NextResponse.json({ error: `Insufficient Balance. Required: ${calculatedDays}, Available: ${balanceRecord?.closing || 0}` }, { status: 400 });
    }

    // 4.5 Check for Overlapping Leaves
    const overlapping = await prisma.leaveApplication.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ["PENDING", "APPROVED", "L1_APPROVED", "L2_APPROVED"] },
        AND: [
          { fromDate: { lte: end } },
          { toDate: { gte: start } }
        ]
      }
    });

    if (overlapping) {
      return NextResponse.json({ 
        error: `Overlap detected with leave from ${new Date(overlapping.fromDate).toLocaleDateString()}` 
      }, { status: 409 });
    }

    // 5. Create Application
    const application = await prisma.leaveApplication.create({
      data: {
        employeeId: employee.id,
        leaveTypeId,
        fromDate: start,
        toDate: end,
        totalDays: calculatedDays, // Use our smart count
        reason,
        status: "PENDING"
      }
    });

    return NextResponse.json({ success: true, application });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Application Failed" }, { status: 500 });
  }
}
