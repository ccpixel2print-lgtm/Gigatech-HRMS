import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date");

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId);

    const emp = await prisma.employee.findFirst({ where: { userId } });
    if (!emp) return NextResponse.json({ error: "No employee" }, { status: 404 });

    // Build Query
    const where: any = {
      attendanceRecord: { employeeId: emp.id }
    };

    if (dateFilter) {
      const start = new Date(dateFilter);
      const end = new Date(dateFilter);
      end.setHours(23, 59, 59, 999);
      where.startTime = { gte: start, lte: end };
    }

    const logs = await prisma.workLog.findMany({
      where,
      orderBy: { startTime: 'desc' }
    });

    return NextResponse.json(logs);

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
