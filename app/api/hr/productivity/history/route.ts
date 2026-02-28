import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Build Filter
  const where: any = {};

  if (employeeId) {
    where.attendanceRecord = { employeeId: parseInt(employeeId) };
  }

  if (from || to) {
    // If attendanceRecord constraint exists, merge it
    where.startTime = {};
    if (from) where.startTime.gte = new Date(from);
    if (to) {
        const endDate = new Date(to);
        endDate.setHours(23, 59, 59, 999); // End of day
        where.startTime.lte = endDate;
    }
  }

  try {
    const logs = await prisma.workLog.findMany({
      where,
      include: {
        attendanceRecord: {
          include: {
            employee: { select: { firstName: true, lastName: true, employeeCode: true } }
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
