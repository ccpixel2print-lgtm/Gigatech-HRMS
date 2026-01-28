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

    // Fetch Employee linked to this User
    const employee = await prisma.employee.findFirst({
      where: { userId: userId },
      include: { salary: true }
    });

    if (!employee) {
      return NextResponse.json({ error: "No employee record found for this user" }, { status: 404 });
    }

    // Remap email just like we did for Admin
    const responseData = {
        ...employee,
        email: employee.personalEmail, 
    };

    return NextResponse.json(responseData);

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
