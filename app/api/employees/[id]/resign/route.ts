import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { dateOfLeaving, reason, type } = body; // type = RESIGNED or TERMINATED

    const employeeId = parseInt(id);

    // Transaction: Update Employee + Deactivate User
    await prisma.$transaction(async (tx) => {
      
      // 1. Update Employee
      const emp = await tx.employee.update({
        where: { id: employeeId },
        data: {
          status: type, // "RESIGNED"
          dateOfLeaving: new Date(dateOfLeaving),
          // We can add 'exitReason' if schema supports it, or store in remarks?
          // Since schema doesn't have 'exitReason', we skip it for now or add column later.
        }
      });

      // 2. Deactivate User Login
      if (emp.userId) {
        await tx.user.update({
          where: { id: emp.userId },
          data: { isActive: false }
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process resignation" }, { status: 500 });
  }
}
