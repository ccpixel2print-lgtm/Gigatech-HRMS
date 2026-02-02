import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Helpers
function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) return 0;
  return parseFloat(value.toString());
}

function numberToDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

// GET (Fetch) - Unchanged
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    const where: any = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

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

// POST (Generate)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { month, year } = body;

    if (!month || !year) return NextResponse.json({ error: 'Month/Year required' }, { status: 400 });

    const payrollEndDate = new Date(year, month, 0); 

    const employees = await prisma.employee.findMany({
      where: { 
        status: { in: ['PUBLISHED'] },
        dateOfJoining: { lte: payrollEndDate }
      },
      include: { salary: true }
    });

    if (employees.length === 0) return NextResponse.json({ error: 'No employees found' }, { status: 404 });

    const createdRecords = [];

    for (const employee of employees) {
      const existing = await prisma.payrollRecord.findFirst({
        where: { employeeId: employee.id, year, month }
      });
      if (existing) continue;

      if (!employee.salary) continue; 

      const s = employee.salary;

      // Values
      const basic = decimalToNumber(s.basicSalary);
      const hra = decimalToNumber(s.hra);
      const da = decimalToNumber(s.da);
      const ta = decimalToNumber(s.ta); 
      const special = decimalToNumber(s.specialAllowance);
      
      const pf = decimalToNumber(s.providentFund);
      const esi = decimalToNumber(s.esi);
      const pt = decimalToNumber(s.professionalTax);
      const tds = decimalToNumber(s.incomeTax);

      const grossSalary = basic + hra + da + ta + special;
      const totalDeductions = pf + esi + pt + tds; 
      const netSalary = grossSalary - totalDeductions;

      // 5. CALCULATE EL CREDIT (Proposal only)
      let calculatedEl = 0;
      if (employee.leaveTemplateId) {
        const elType = await prisma.leaveType.findFirst({
            where: { leaveTemplateId: employee.leaveTemplateId, code: 'EL' }
        });
        if (elType) {
            calculatedEl = Number(elType.annualQuota) / 12; // e.g. 1.25
        }
      }

      // Create Record
      const record = await prisma.payrollRecord.create({
        data: {
          employeeId: employee.id,
          year,
          month,
          payrollDate: new Date(),
          
          totalWorkingDays: numberToDecimal(30),
          presentDays: numberToDecimal(30),
          paidLeaveDays: numberToDecimal(0),
          unpaidLeaveDays: numberToDecimal(0),
          lopDays: numberToDecimal(0),
          
          // New Field: EL Credit Proposal
          elCredit: numberToDecimal(calculatedEl),

          basicSalary: numberToDecimal(basic),
          hra: numberToDecimal(hra),
          da: numberToDecimal(da), 
          ta: numberToDecimal(ta), 
          conveyanceAllowance: numberToDecimal(decimalToNumber(s.conveyanceAllowance)), 
          medicalAllowance: numberToDecimal(decimalToNumber(s.medicalAllowance)),       
          specialAllowance: numberToDecimal(special),
          otherAllowances: numberToDecimal(0),
          grossSalary: numberToDecimal(grossSalary),
          
          providentFund: numberToDecimal(pf),
          esi: numberToDecimal(esi),
          professionalTax: numberToDecimal(pt),
          incomeTax: numberToDecimal(tds), 
          lopDeduction: numberToDecimal(0),
          otherDeductions: numberToDecimal(0),
          totalDeductions: numberToDecimal(totalDeductions),
          
          netSalary: numberToDecimal(netSalary),
          status: 'DRAFT'
        } as any
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

// PATCH (Update/Publish)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, lopDays, otherAllowances, otherDeductions, status, elCredit } = body; // <--- Accept elCredit

    const record = await prisma.payrollRecord.findUnique({
      where: { id },
      include: { employee: { include: { salary: true } } }
    });

    if (!record) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    const basic = decimalToNumber(record.basicSalary);
    const hra = decimalToNumber(record.hra);
    const da = decimalToNumber((record as any).da || 0); 
    const ta = decimalToNumber((record as any).ta || 0); 
    const special = decimalToNumber(record.specialAllowance);
    
    const newLopDays = lopDays !== undefined ? parseFloat(lopDays) : decimalToNumber(record.lopDays);
    const newBonus = otherAllowances !== undefined ? parseFloat(otherAllowances) : decimalToNumber(record.otherAllowances);
    const newOtherDed = otherDeductions !== undefined ? parseFloat(otherDeductions) : decimalToNumber(record.otherDeductions);
    const newStatus = status || record.status;
    const newElCredit = elCredit !== undefined ? parseFloat(elCredit) : decimalToNumber((record as any).elCredit || 0);

    const baseGross = basic + hra + da + ta + special; 
    const dailyRate = baseGross / 30;
    const lopAmount = dailyRate * newLopDays;

    const finalGross = baseGross + newBonus;
    const baseDed = decimalToNumber(record.providentFund) + decimalToNumber(record.esi) + decimalToNumber(record.professionalTax);
    const finalDed = baseDed + lopAmount + newOtherDed;
    const finalNet = finalGross - finalDed;

    const totalDays = decimalToNumber(record.totalWorkingDays) || 30;
    const newPresentDays = totalDays - newLopDays; 

    // CHECK FOR PUBLISH EVENT (The Magic Logic)
    if (record.status !== "PROCESSED" && newStatus === "PROCESSED") {
        if (newElCredit > 0 && record.employee.leaveTemplateId) {
            const elType = await prisma.leaveType.findFirst({
                where: { leaveTemplateId: record.employee.leaveTemplateId!, code: 'EL' }
            });
            
            if (elType) {
                // Find/Create/Update Balance
                const balanceKey = {
                    employeeId: record.employeeId,
                    leaveTypeId: elType.id,
                    year: record.year
                };
                
                const balance = await prisma.employeeLeaveBalance.findUnique({
                    where: { employeeId_leaveTypeId_year: balanceKey }
                });

                if (balance) {
                    await prisma.employeeLeaveBalance.update({
                        where: { id: balance.id },
                        data: {
                            credited: { increment: newElCredit },
                            closing: { increment: newElCredit }
                        }
                    });
                } else {
                    await prisma.employeeLeaveBalance.create({
                        data: {
                            ...balanceKey,
                            opening: 0,
                            credited: newElCredit,
                            used: 0,
                            closing: newElCredit
                        }
                    });
                }

                // Audit Log
                await prisma.leaveTransaction.create({
                    data: {
                        employeeId: record.employeeId,
                        leaveTypeId: 'EL',
                        type: 'CREDIT',
                        days: newElCredit,
                        reason: `Payroll Accrual ${record.month}/${record.year}`,
                        date: new Date()
                    }
                });
            }
        }
    }

    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        presentDays: numberToDecimal(newPresentDays),
        lopDays: numberToDecimal(newLopDays),
        otherAllowances: numberToDecimal(newBonus),
        otherDeductions: numberToDecimal(newOtherDed),
        elCredit: numberToDecimal(newElCredit), // <--- SAVE THE CREDIT
        
        grossSalary: numberToDecimal(finalGross),
        lopDeduction: numberToDecimal(lopAmount),
        totalDeductions: numberToDecimal(finalDed),
        netSalary: numberToDecimal(finalNet),
        
        status: newStatus
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: true,
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
