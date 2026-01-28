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

    // 1. Get Employee ID
    const employee = await prisma.employee.findFirst({
      where: { userId: userId },
      select: { id: true }
    });

    if (!employee) return NextResponse.json({ error: "Employee record not found" }, { status: 404 });

    // 2. Fetch Published Payrolls
    const payrolls = await prisma.payrollRecord.findMany({
      where: { 
        employeeId: employee.id,
        status: { in: ["PROCESSED", "PAID", "PUBLISHED"] } 
      },
      // ADD THIS INCLUDE BLOCK
      include: {
        employee: true 
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });


    return NextResponse.json(payrolls);

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
