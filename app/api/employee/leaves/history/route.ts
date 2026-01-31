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

    // Fetch BOTH in parallel
    const [leaves, compOffs] = await prisma.$transaction([
        prisma.leaveApplication.findMany({
            where: { employeeId: employee.id },
            include: { leaveType: true },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.compOffRecord.findMany({
            where: { employeeId: employee.id },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    // Return combined object
    return NextResponse.json({ leaves, compOffs });

  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
