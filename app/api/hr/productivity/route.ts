import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) { 
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");
    
    if (!dateStr) return NextResponse.json([]);

    const date = new Date(dateStr);
    
    // Find logs for this date
    const logs = await prisma.workLog.findMany({
      where: {
        attendanceRecord: {
          date: date
        }
      },
      include: {
        attendanceRecord: {
          include: {
            employee: {
              select: { firstName: true, lastName: true, employeeCode: true }
            }
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
