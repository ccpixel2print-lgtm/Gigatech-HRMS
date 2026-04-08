import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    // Financial Year: Apr 2026 - Mar 2027
    // If current month is Jan-Mar, FY started previous year April
    // If current month is Apr-Dec, FY started this year April
    const fyStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const fyEndYear = fyStartYear + 1;

    // 1. Current Month Salary by Entity (Company)
    const monthlyByEntity = await prisma.payrollRecord.groupBy({
      by: ["employeeId"],
      where: {
        month: currentMonth,
        year: currentYear,
        status: { in: ["PROCESSED", "PAID"] },
      },
      _sum: { netSalary: true },
    });

    // Get employee -> company mapping
    const employeeIds = monthlyByEntity.map((r) => r.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, company: { select: { id: true, name: true } } },
    });

    const empMap = new Map(employees.map((e) => [e.id, e.company?.name || "Unassigned"]));

    // Aggregate monthly totals by entity
    const monthlyTotals: Record<string, number> = {};
    let monthlyGrandTotal = 0;
    for (const rec of monthlyByEntity) {
      const entity = empMap.get(rec.employeeId) || "Unassigned";
      const amount = parseFloat(rec._sum.netSalary?.toString() || "0");
      monthlyTotals[entity] = (monthlyTotals[entity] || 0) + amount;
      monthlyGrandTotal += amount;
    }

    // 2. Financial Year Salary by Entity
    // FY months: Apr(4)-Dec(12) of fyStartYear + Jan(1)-Mar(3) of fyEndYear
    const fyRecords = await prisma.payrollRecord.groupBy({
      by: ["employeeId"],
      where: {
        status: { in: ["PROCESSED", "PAID"] },
        OR: [
          { year: fyStartYear, month: { gte: 4 } },
          { year: fyEndYear, month: { lte: 3 } },
        ],
      },
      _sum: { netSalary: true },
    });

    // Get all FY employee IDs for mapping
    const fyEmpIds = fyRecords.map((r) => r.employeeId);
    const fyEmployees = await prisma.employee.findMany({
      where: { id: { in: fyEmpIds } },
      select: { id: true, company: { select: { id: true, name: true } } },
    });
    const fyEmpMap = new Map(fyEmployees.map((e) => [e.id, e.company?.name || "Unassigned"]));

    const fyTotals: Record<string, number> = {};
    let fyGrandTotal = 0;
    for (const rec of fyRecords) {
      const entity = fyEmpMap.get(rec.employeeId) || "Unassigned";
      const amount = parseFloat(rec._sum.netSalary?.toString() || "0");
      fyTotals[entity] = (fyTotals[entity] || 0) + amount;
      fyGrandTotal += amount;
    }

    return NextResponse.json({
      monthly: {
        month: currentMonth,
        year: currentYear,
        grandTotal: Math.round(monthlyGrandTotal * 100) / 100,
        byEntity: Object.entries(monthlyTotals).map(([name, total]) => ({
          name,
          total: Math.round(total * 100) / 100,
        })),
      },
      financialYear: {
        label: `FY ${fyStartYear}-${fyEndYear.toString().slice(2)}`,
        grandTotal: Math.round(fyGrandTotal * 100) / 100,
        byEntity: Object.entries(fyTotals).map(([name, total]) => ({
          name,
          total: Math.round(total * 100) / 100,
        })),
      },
    });
  } catch (error) {
    console.error("Salary stats error:", error);
    return NextResponse.json({ error: "Failed to fetch salary stats" }, { status: 500 });
  }
}
