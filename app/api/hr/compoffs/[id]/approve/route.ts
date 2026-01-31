import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const compOffId = parseInt(id);

    // 1. Get Record
    const record = await prisma.compOffRecord.findUnique({ where: { id: compOffId } });
    if (!record || record.status !== "PENDING") {
        return NextResponse.json({ error: "Invalid Request" }, { status: 400 });
    }

    // 2. Transaction: Activate & Credit Balance
    await prisma.$transaction(async (tx) => {
        // A. Activate Comp-Off
        await tx.compOffRecord.update({
            where: { id: compOffId },
            data: { status: "ACTIVE" }
        });

        // B. Find "CO" Leave Type ID
        const coType = await tx.leaveType.findUnique({ where: { code: "CO" } });
        if (!coType) throw new Error("CO Leave Type not found");

        // C. Credit Balance
        const year = new Date().getFullYear();
        
        // Find or Create Balance Record
        let balance = await tx.employeeLeaveBalance.findUnique({
            where: {
                employeeId_leaveTypeId_year: {
                    employeeId: record.employeeId,
                    leaveTypeId: coType.id,
                    year
                }
            }
        });

        if (!balance) {
            balance = await tx.employeeLeaveBalance.create({
                data: {
                    employeeId: record.employeeId,
                    leaveTypeId: coType.id,
                    year,
                    opening: 0,
                    credited: 0,
                    closing: 0
                }
            });
        }

        // Add 1 Day
        await tx.employeeLeaveBalance.update({
            where: { id: balance.id },
            data: {
                credited: { increment: 1 },
                closing: { increment: 1 }
            }
        });

        // D. Ledger Entry
        await tx.leaveTransaction.create({
            data: {
                employeeId: record.employeeId,
                leaveTypeId: "CO",
                type: "CREDIT",
                days: 1,
                reason: `Comp-Off Approved: ${record.reason}`
            }
        });
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
