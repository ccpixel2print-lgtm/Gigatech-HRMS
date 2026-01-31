import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body; 

    const leaveId = parseInt(id);
    console.log(`Processing Leave ${leaveId} -> ${status}`);

    // 1. Get Application with Type
    const application = await prisma.leaveApplication.findUnique({
      where: { id: leaveId },
      include: { leaveType: true } // Mandatory to get the Code
    });

    if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    // Allow re-approving for testing, or strictly block?
    // if (application.status !== "PENDING") ...

    await prisma.$transaction(async (tx) => {
      // A. Update Status
      await tx.leaveApplication.update({
        where: { id: leaveId },
        data: { 
            status,
            // If Rejected, maybe add rejectionReason?
        }
      });

      // B. If Approved -> Deduct Balance
      if (status === "APPROVED") {
        const days = Number(application.totalDays);
        const year = new Date(application.fromDate).getFullYear(); // Use Leave Year, not Current Year!

        // Find Balance Record
        const balance = await tx.employeeLeaveBalance.findUnique({
            where: {
                employeeId_leaveTypeId_year: {
                    employeeId: application.employeeId,
                    leaveTypeId: application.leaveTypeId,
                    year: year
                }
            }
        });

        if (balance) {
            console.log(`Deducting ${days} from Balance ${balance.id}`);
            await tx.employeeLeaveBalance.update({
                where: { id: balance.id },
                data: {
                    used: { increment: days },
                    closing: { decrement: days }
                }
            });
        } else {
            console.warn("No balance record found to deduct!");
            // Optional: Throw error if balance missing? Or just log?
        }

        // Add to Ledger
        await tx.leaveTransaction.create({
            data: {
                employeeId: application.employeeId,
                leaveTypeId: application.leaveType.code, // Ensure this is String
                type: "DEBIT",
                days: days,
                reason: `Leave Approved (#${leaveId})`,
                date: new Date()
            }
        });
      }
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Approval Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
