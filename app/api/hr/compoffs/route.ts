import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const whereClause = status ? { status } : {}; // If status param exists, filter. Else fetch all.

  const records = await prisma.compOffRecord.findMany({
    where: whereClause,
    include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(records);
}
