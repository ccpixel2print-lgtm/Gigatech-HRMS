import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentYear = new Date().getFullYear();

  // Fetch all employees with their balances
  const employees = await prisma.employee.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true, firstName: true, lastName: true, employeeCode: true,
      leaveBalances: {
        where: { year: currentYear },
        include: { leaveType: { select: { code: true } } }
      }
    },
    orderBy: { firstName: 'asc' }
  });

  // Transform for Table
  // Row: Name | CL (Bal) | SL (Bal) | EL (Bal) | CO (Bal)
  const report = employees.map(emp => {
    const balMap: any = {};
    emp.leaveBalances.forEach(b => {
      balMap[b.leaveType.code] = {
        total: Number(b.credited), // or opening + credited
        used: Number(b.used),
        balance: Number(b.closing)
      };
    });
    return { ...emp, balances: balMap };
  });

  return NextResponse.json(report);
}
