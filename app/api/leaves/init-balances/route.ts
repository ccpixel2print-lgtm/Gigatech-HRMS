import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const currentYear = new Date().getFullYear();
    
    const employees = await prisma.employee.findMany({
      where: { 
          status: "PUBLISHED",
          leaveTemplateId: { not: null }
      },
      include: { leaveTemplate: { include: { leaveTypes: true } } }
    });

    let count = 0;

    for (const emp of employees) {
      if (!emp.leaveTemplate) continue;

      // Determine Start Date for Calculation
      const doj = new Date(emp.dateOfJoining);
      const joinYear = doj.getFullYear();
      
      // If joined this year, calc from DOJ. If joined last year, calc from Jan 1.
      let startMonth = 0; // Jan = 0
      if (joinYear === currentYear) {
          startMonth = doj.getMonth();
          // Logic: If joined after 15th, skip this month?
          if (doj.getDate() > 15) startMonth += 1;
      }

      // Remaining Months (e.g., if Jan (0), 12 months left. If Dec (11), 1 month left)
      // Ensure we don't go negative
      const remainingMonths = Math.max(0, 12 - startMonth);

      for (const type of emp.leaveTemplate.leaveTypes) {
        const exists = await prisma.employeeLeaveBalance.findUnique({
            where: {
                employeeId_leaveTypeId_year: {
                    employeeId: emp.id,
                    leaveTypeId: type.id,
                    year: currentYear
                }
            }
        });

        if (!exists) {
            // PRO-RATA CALCULATION
            // Example: 12 quota * (6 months / 12) = 6
            const annualQuota = Number(type.annualQuota);
            
            // LOP has 0 quota, so math is safe (0 * anything = 0)
            let credit = (annualQuota / 12) * remainingMonths;
            
            // Rounding: Usually round up to 0.5 or 1
            // Let's keep 2 decimals for accuracy
            credit = Math.round(credit * 100) / 100;

            await prisma.employeeLeaveBalance.create({
                data: {
                    employeeId: emp.id,
                    leaveTypeId: type.id,
                    year: currentYear,
                    opening: 0,
                    credited: credit, // <--- SMART CREDIT
                    used: 0,
                    closing: credit
                }
            });
            count++;
        }
      }
    }

    return NextResponse.json({ success: true, initialized: count });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}