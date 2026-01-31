import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const history = await prisma.salaryHistory.findMany({
    where: { employeeId: parseInt(id) },
    orderBy: { effectiveFrom: 'desc' } // Newest first
  });

  return NextResponse.json(history);
}
