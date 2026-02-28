import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // 1. Find Today's Attendance
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const emp = await prisma.employee.findFirst({ where: { userId: Number(payload.userId) } });
    if (!emp) return NextResponse.json({ error: "No employee" }, { status: 404 });

    const attendance = await prisma.attendanceRecord.findUnique({
      where: {
        employeeId_date: {
          employeeId: emp.id,
          date: today
        }
      },
      include: {
        workLogs: {
          orderBy: { startTime: 'desc' } // Most recent task first
        }
      }
    });

    return NextResponse.json({ attendance });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}