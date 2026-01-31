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
    const userId = Number(payload.userId);

    const employee = await prisma.employee.findFirst({ where: { userId } });
    if (!employee) return NextResponse.json({ error: "No employee" }, { status: 404 });

    const balances = await prisma.employeeLeaveBalance.findMany({
      where: { 
        employeeId: employee.id,
        year: new Date().getFullYear()
      },
      include: { leaveType: true }
    });

    return NextResponse.json(balances);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
