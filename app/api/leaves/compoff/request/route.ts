import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function POST(req: Request) {
  try {
    // 1. Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    
    // 2. Get Employee
    const employee = await prisma.employee.findFirst({ where: { userId: Number(payload.userId) } });
    if (!employee) return NextResponse.json({ error: "No employee" }, { status: 404 });

    const body = await req.json();
    const { date, reason } = body;

    // 3. Create Request
    // Note: status starts as 'PENDING' (Default in schema?)
    // Wait, CompOffRecord status default is 'ACTIVE'. We need a 'PENDING' state for approval.
    // Check Schema: status String @default("ACTIVE")
    // If schema doesn't support "PENDING", we might need to assume HR adds it manually?
    // OR: We create it as 'PENDING' if schema allows string.
    
    await prisma.compOffRecord.create({
      data: {
        employeeId: employee.id,
        workedDate: new Date(date),
        reason,
        status: "PENDING", // Ensure your schema allows this, or we update schema
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 90)), // 90 days validity
        creditedDays: 1, // Standard 1 day
        balanceDays: 1
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
