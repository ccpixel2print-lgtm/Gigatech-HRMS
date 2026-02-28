import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const today = new Date();
  today.setHours(0,0,0,0);

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, firstName: true, lastName: true, designation: true,
      attendanceRecords: {
        where: { date: today },
        include: { workLogs: true }
      }
    }
  });

  // Calculate Stats per Employee
  const summary = employees.map(emp => {
    const todayRecord = emp.attendanceRecords[0];
    const totalMins = todayRecord?.workLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0) || 0;
    const activeTask = todayRecord?.workLogs.find(l => l.status === "IN_PROGRESS");

    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      designation: emp.designation,
      totalHours: (totalMins / 60).toFixed(1),
      status: activeTask ? "Working" : (todayRecord ? "Idle" : "Absent"),
      currentTask: activeTask?.taskTitle || "-"
    };
  });

  return NextResponse.json(summary);
}
