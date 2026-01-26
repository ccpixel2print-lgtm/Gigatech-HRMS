import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [total, draft, newJoiners] = await Promise.all([
      // 1. Total Employees
      prisma.employee.count(),
      
      // 2. Draft Profiles
      prisma.employee.count({ where: { status: "DRAFT" } }),
      
      // 3. New Joiners (This Month)
      prisma.employee.count({
        where: {
          dateOfJoining: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
    ]);

    return NextResponse.json({ total, draft, newJoiners });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
