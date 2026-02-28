import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskTitle, estimatedMinutes } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const emp = await prisma.employee.findFirst({ where: { userId: Number(payload.userId) } });
    
    // 1. Clock In (Attendance Record)
    const today = new Date();
    today.setHours(0,0,0,0);

    let attendance = await prisma.attendanceRecord.findUnique({
        where: { employeeId_date: { employeeId: emp!.id, date: today } }
    });

    if (!attendance) {
        attendance = await prisma.attendanceRecord.create({
            data: {
                employeeId: emp!.id,
                date: today,
                checkInTime: new Date(),
                status: "PRESENT"
            }
        });
    }

    // 2. Pause Previous Active Task
    const activeTask = await prisma.workLog.findFirst({
        where: { attendanceRecordId: attendance.id, status: "IN_PROGRESS" }
    });
    
    if (activeTask) {
        const now = new Date();
        const duration = Math.floor((now.getTime() - new Date(activeTask.startTime).getTime()) / 60000);
        await prisma.workLog.update({
            where: { id: activeTask.id },
            data: { status: "PAUSED", endTime: now, durationMinutes: { increment: duration } }
        });
    }

    // 3. Start New Task
    const task = await prisma.workLog.create({
        data: {
            attendanceRecordId: attendance.id,
            taskTitle,
            estimatedMinutes: Number(estimatedMinutes),
            startTime: new Date(),
            status: "IN_PROGRESS"
        }
    });

    return NextResponse.json({ success: true, task });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
