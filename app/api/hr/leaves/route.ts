import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Add Auth Check here if needed
  
  const leaves = await prisma.leaveApplication.findMany({
    include: {
      employee: { select: { firstName: true, lastName: true, employeeCode: true } },
      leaveType: { select: { code: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(leaves);
}
