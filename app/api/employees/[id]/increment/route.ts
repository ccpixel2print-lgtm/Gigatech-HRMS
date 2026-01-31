import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { 
      newSalary, 
      effectiveDate, 
      remarks,
      incrementPercentage 
    } = body;

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: { salary: true }
    });

    if (!employee || !employee.salary) {
      return NextResponse.json({ error: "Salary not found" }, { status: 404 });
    }

    const current = employee.salary;
    const pctLabel = incrementPercentage ? `${incrementPercentage}% Hike` : "Flat Revision";

    // Helper to calc totals
    const calcTotals = (s: any) => {
        const gross = Number(s.basicSalary) + Number(s.hra) + Number(s.da||0) + Number(s.ta||0) + Number(s.specialAllowance) + Number(s.otherAllowances||0);
        const ded = Number(s.providentFund) + Number(s.esi) + Number(s.professionalTax) + Number(s.incomeTax||0) + Number(s.otherDeductions||0);
        return {
            ctcAnnual: gross * 12,
            netAnnual: (gross - ded) * 12,
            netMonthly: gross - ded
        };
    };

    // Calculate New Totals
    const newTotals = calcTotals(newSalary);

    // Calculate Old Totals (Just in case they are missing in DB snapshot)
    // Actually, we should trust the DB, but to be safe for required fields:
    const oldTotals = calcTotals(current);

    await prisma.$transaction([
      // Archive OLD
      prisma.salaryHistory.create({
        data: {
          employeeId: employee.id,
          // Snapshot
          ctcAnnual: current.ctcAnnual || oldTotals.ctcAnnual, // Fallback if null
          basicSalary: current.basicSalary,
          hra: current.hra,
          da: current.da,
          ta: current.ta,
          conveyanceAllowance: current.conveyanceAllowance,
          medicalAllowance: current.medicalAllowance,
          specialAllowance: current.specialAllowance,
          otherAllowances: current.otherAllowances,
          providentFund: current.providentFund,
          esi: current.esi,
          professionalTax: current.professionalTax,
          incomeTax: current.incomeTax,
          otherDeductions: current.otherDeductions,
          
          // Missing Required Fields
          netSalaryAnnual: current.netSalaryAnnual || oldTotals.netAnnual,
          netSalaryMonthly: current.netSalaryMonthly || oldTotals.netMonthly,
          
          effectiveFrom: current.effectiveFrom,
          effectiveTo: new Date(effectiveDate),
          reason: `${remarks || "Revision"} - ${pctLabel}`, // Modified Logic                                              
        }
      }),

      // Update NEW
      prisma.employeeSalary.update({
        where: { employeeId: employee.id },
        data: {
          ...newSalary,
          // Add Calculated Totals
          ctcAnnual: newTotals.ctcAnnual,
          netSalaryAnnual: newTotals.netAnnual,
          netSalaryMonthly: newTotals.netMonthly,
          
          effectiveFrom: new Date(effectiveDate),
          updatedAt: new Date()
        }
      })
    ]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Increment Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}