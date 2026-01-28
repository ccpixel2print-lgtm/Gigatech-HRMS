import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Helper function to safely convert Decimal to number
function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return parseFloat(value.toString());
}

// Helper function to create Decimal from number
function numberToDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

// GET /api/payroll - Fetch payroll records (Kept as is)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    // Filter out drafts if needed, or handle in UI
    // where.status = { in: ['PROCESSED', 'PAID', 'PUBLISHED', 'DRAFT'] };

    const records = await prisma.payrollRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
            user: { select: { email: true, fullName: true } }
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { employee: { employeeCode: 'asc' } }
      ]
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST /api/payroll - Generate payroll for a month
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) return NextResponse.json({ error: 'Month/Year required' }, { status: 400 });

    // Fetch Active Employees
    // 1. Calculate Payroll Period End Date
    // Create date for next month day 0 (which is last day of current month)
    const payrollEndDate = new Date(year, month, 0); 

    // 2. Fetch Active Employees who joined BEFORE or DURING this month
    const employees = await prisma.employee.findMany({
      where: { 
        status: { in: ['PUBLISHED'] },
        dateOfJoining: { lte: payrollEndDate } // <--- THE FIX
      },
      include: { salary: true }
    });

    if (employees.length === 0) return NextResponse.json({ error: 'No employees found' }, { status: 404 });

    const createdRecords = [];

    for (const employee of employees) {
      // 1. Check existence
      const existing = await prisma.payrollRecord.findFirst({
        where: { employeeId: employee.id, year, month }
      });
      if (existing) continue;

      if (!employee.salary) continue; // Skip if no salary config

      const s = employee.salary;

      // 2. Get Values (MONTHLY - No division by 12)
      const basic = decimalToNumber(s.basicSalary);
      const hra = decimalToNumber(s.hra);
      const da = decimalToNumber(s.da);
      const ta = decimalToNumber(s.ta); // <--- NEW FIELD
      const special = decimalToNumber(s.specialAllowance);
      
      const pf = decimalToNumber(s.providentFund);
      const esi = decimalToNumber(s.esi);
      const pt = decimalToNumber(s.professionalTax);

      // 3. Calculate Stats
      const grossSalary = basic + hra + da + ta + special;
      const totalDeductions = pf + esi + pt; // LOP is 0 initially
      const netSalary = grossSalary - totalDeductions;

      // 4. Create Record
      const record = await prisma.payrollRecord.create({
        data: {
          employeeId: employee.id,
          year,
          month,
          payrollDate: new Date(),
          
          // Attendance
          totalWorkingDays: numberToDecimal(30),
          presentDays: numberToDecimal(30),
          paidLeaveDays: numberToDecimal(0),
          unpaidLeaveDays: numberToDecimal(0),
          lopDays: numberToDecimal(0),
          
          // Earnings (Matching your Schema Names)
          basicSalary: numberToDecimal(basic),
          hra: numberToDecimal(hra),
          da: numberToDecimal(da), // Now valid
          ta: numberToDecimal(ta), // Now valid
          conveyanceAllowance: numberToDecimal(decimalToNumber(s.conveyanceAllowance)), // Copy from master
          medicalAllowance: numberToDecimal(decimalToNumber(s.medicalAllowance)),       // Copy from master
          specialAllowance: numberToDecimal(special),
          otherAllowances: numberToDecimal(0),
          grossSalary: numberToDecimal(grossSalary),
          
          // Deductions (Matching your Schema Names)
          providentFund: numberToDecimal(pf),
          esi: numberToDecimal(esi),
          professionalTax: numberToDecimal(pt),
          incomeTax: numberToDecimal(decimalToNumber(s.incomeTax)), // Copy from master
          lopDeduction: numberToDecimal(0),
          otherDeductions: numberToDecimal(0),
          totalDeductions: numberToDecimal(totalDeductions),
          
          // Net Pay
          netSalary: numberToDecimal(netSalary),
          
          // Status
          status: 'DRAFT'
        }as any
      });
      createdRecords.push(record);
    }

    return NextResponse.json({ 
      success: true, 
      summary: { created: createdRecords.length } 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Gen Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/payroll - Recalculate
// PATCH /api/payroll - Recalculate
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, lopDays, otherAllowances, otherDeductions, status } = body;

    const record = await prisma.payrollRecord.findUnique({
      where: { id },
      include: { employee: { include: { salary: true } } }
    });

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    // 1. Get Base Values
    const basic = decimalToNumber(record.basicSalary);
    const hra = decimalToNumber(record.hra);
    // Use optional chaining or defaults if TS complains about missing fields
    const da = decimalToNumber((record as any).da || 0); 
    const ta = decimalToNumber((record as any).ta || 0); 
    const special = decimalToNumber(record.specialAllowance);
    
    // 2. Get Input Values
    const newLopDays = lopDays !== undefined ? parseFloat(lopDays) : decimalToNumber(record.lopDays);
    const newBonus = otherAllowances !== undefined ? parseFloat(otherAllowances) : decimalToNumber(record.otherAllowances);
    const newOtherDed = otherDeductions !== undefined ? parseFloat(otherDeductions) : decimalToNumber(record.otherDeductions);
    const newStatus = status || record.status;

    // 3. Recalculate
    const baseGross = basic + hra + da + ta + special; 
    const dailyRate = baseGross / 30;
    const lopAmount = dailyRate * newLopDays;

    const finalGross = baseGross + newBonus;

    const baseDed = decimalToNumber(record.providentFund) + decimalToNumber(record.esi) + decimalToNumber(record.professionalTax);
    const finalDed = baseDed + lopAmount + newOtherDed;

    const finalNet = finalGross - finalDed;

    // 4. Calculate Attendance (The Fix for Error 4)
    // Assume 30 days if totalWorkingDays is missing/zero
    const totalDays = decimalToNumber(record.totalWorkingDays) || 30;
    const newPresentDays = totalDays - newLopDays; // <--- DEFINED HERE

    // 5. Update
    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        presentDays: numberToDecimal(newPresentDays), // <--- USED HERE
        lopDays: numberToDecimal(newLopDays),
        otherAllowances: numberToDecimal(newBonus),
        otherDeductions: numberToDecimal(newOtherDed),
        
        grossSalary: numberToDecimal(finalGross),
        lopDeduction: numberToDecimal(lopAmount),
        totalDeductions: numberToDecimal(finalDed),
        netSalary: numberToDecimal(finalNet),
        
        status: newStatus
      },
      // ADD THIS INCLUDE BLOCK
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
            // Add any other fields your UI displays
          }
        }
      }
    });

    return NextResponse.json(updated);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

