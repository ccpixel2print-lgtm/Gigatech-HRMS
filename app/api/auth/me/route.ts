import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

// Ensure this matches your .env exactly
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value; // Name matches your Login

    if (!token) {
      return NextResponse.json({ error: "Unauthorized - No Token" }, { status: 401 });
    }

    // Verify Token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Safety: Convert to number if your DB uses Int IDs
    const userId = Number(payload.userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true, isActive: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);

  } catch (error) {
    console.error("Token Verification Failed:", error);
    return NextResponse.json({ error: "Unauthorized - Invalid Token" }, { status: 401 });
  }
}

// PATCH Logic (Same Verification)
export async function PATCH(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.userId);

    const body = await req.json();
    const { fullName } = body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { fullName }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
