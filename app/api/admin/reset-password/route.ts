import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Admin Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const roles = (payload.roles as string[]) || [];

    if (!roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    // 2. Parse Request
    const body = await req.json();
    const { userId, newPassword } = body;

    if (!userId || !newPassword) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    // 3. Reset Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        passwordHash: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null, // Unlock if locked
        // mustChangePin: true // Optional: Force them to change it on next login? (Needs schema change)
      }
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
