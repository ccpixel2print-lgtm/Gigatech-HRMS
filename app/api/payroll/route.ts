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

// GET /api/payroll - Fetch payroll records
export async function GET(request: NextRequest) {
  try {
    // Get user from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRolesHeader = request.headers.get('x-user-roles');
    const userRoles = userRolesHeader ? JSON.parse(userRolesHeader) : [];

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const hasAdminAccess = userRoles.some((role: string) => 
      ['ADMIN', 'HR_MANAGER'].includes(role)
    );

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin/HR can view payroll' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Build where clause
    const where: any = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    // Fetch payroll records
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
            user: {
              select: {
                email: true,
                fullName: true
              }
            }
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
    console.error('Error fetching payroll records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payroll records' },
      { status: 500 }
    );
  }
}

// POST /api/payroll - Generate payroll for a month
export async function POST(request: NextRequest) {
  try {
    // Get user from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRolesHeader = request.headers.get('x-user-roles');
    const userRoles = userRolesHeader ? JSON.parse(userRolesHeader) : [];

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const hasAdminAccess = userRoles.some((role: string) => 
      ['ADMIN', 'HR_MANAGER'].includes(role)
    );

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin/HR can generate payroll' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { month, year } = body;

    // Validate input
    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    // Fetch all ACTIVE employees with their salary details
    // For testing, accept both PUBLISHED and DRAFT employees
    const employees = await prisma.employee.findMany({
      where: {
        status: {
          in: ['PUBLISHED', 'DRAFT'] // Accept both for testing
        }
      },
      include: {
        salary: true,
        user: {
          select: {
            email: true,
            fullName: true
          }
        }
      }
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: 'No active employees found' },
        { status: 404 }
      );
    }

    const createdRecords = [];
    const existingRecords = [];
    const skippedRecords = [];

    // Loop through each employee
    for (const employee of employees) {
      // Check if payroll record already exists
      const existingRecord = await prisma.payrollRecord.findUnique({
        where: {
          employeeId_year_month: {
            employeeId: employee.id,
            year,
            month
          }
        }
      });

      if (existingRecord) {
        existingRecords.push(existingRecord);
        continue;
      }

      // Check if employee has salary configured
      if (!employee.salary) {
        console.log(`Skipping employee ${employee.employeeCode}: No salary configured`);
        skippedRecords.push({
          employeeId: employee.id,
          employeeCode: employee.employeeCode,
          reason: 'No salary configured'
        });
        continue;
      }

      const salary = employee.salary;

      // Calculate monthly values from annual salary
      // Convert Decimal to number for calculation
      const basicMonthly = decimalToNumber(salary.basicSalary) / 12;
      const hraMonthly = decimalToNumber(salary.hra) / 12;
      const conveyanceMonthly = decimalToNumber(salary.conveyanceAllowance) / 12;
      const medicalMonthly = decimalToNumber(salary.medicalAllowance) / 12;
      const specialMonthly = decimalToNumber(salary.specialAllowance) / 12;
      const otherAllowancesMonthly = decimalToNumber(salary.otherAllowances) / 12;

      const pfMonthly = decimalToNumber(salary.providentFund) / 12;
      const esiMonthly = decimalToNumber(salary.esi) / 12;
      const ptMonthly = decimalToNumber(salary.professionalTax) / 12;
      const incomeTaxMonthly = decimalToNumber(salary.incomeTax) / 12;
      const otherDeductionsMonthly = decimalToNumber(salary.otherDeductions) / 12;

      // Calculate gross salary (sum of all earnings)
      const grossSalary = basicMonthly + hraMonthly + conveyanceMonthly + 
                          medicalMonthly + specialMonthly + otherAllowancesMonthly;

      // Calculate total deductions (sum of all deductions)
      const totalDeductions = pfMonthly + esiMonthly + ptMonthly + 
                              incomeTaxMonthly + otherDeductionsMonthly;

      // Calculate net salary (gross - deductions)
      const netSalary = grossSalary - totalDeductions;

      // Calculate total working days (assume 26 for now)
      const totalWorkingDays = 26;

      // Create payroll record
      const record = await prisma.payrollRecord.create({
        data: {
          employeeId: employee.id,
          year,
          month,
          payrollDate: new Date(),
          
          // Attendance
          totalWorkingDays: numberToDecimal(totalWorkingDays),
          presentDays: numberToDecimal(totalWorkingDays), // Initially full attendance
          paidLeaveDays: numberToDecimal(0),
          unpaidLeaveDays: numberToDecimal(0),
          lopDays: numberToDecimal(0),
          
          // Earnings
          basicSalary: numberToDecimal(basicMonthly),
          hra: numberToDecimal(hraMonthly),
          conveyanceAllowance: numberToDecimal(conveyanceMonthly),
          medicalAllowance: numberToDecimal(medicalMonthly),
          specialAllowance: numberToDecimal(specialMonthly),
          otherAllowances: numberToDecimal(otherAllowancesMonthly),
          grossSalary: numberToDecimal(grossSalary),
          
          // Deductions
          providentFund: numberToDecimal(pfMonthly),
          esi: numberToDecimal(esiMonthly),
          professionalTax: numberToDecimal(ptMonthly),
          incomeTax: numberToDecimal(incomeTaxMonthly),
          lopDeduction: numberToDecimal(0),
          otherDeductions: numberToDecimal(otherDeductionsMonthly),
          totalDeductions: numberToDecimal(totalDeductions),
          
          // Net Pay
          netSalary: numberToDecimal(netSalary),
          
          // Status
          status: 'DRAFT'
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              designation: true,
              user: {
                select: {
                  email: true,
                  fullName: true
                }
              }
            }
          }
        }
      });

      createdRecords.push(record);
      
      console.log(`✅ Created payroll for ${employee.employeeCode} - ${employee.firstName} ${employee.lastName}`);
    }

    return NextResponse.json({
      success: true,
      message: `Payroll generated for ${month}/${year}`,
      summary: {
        total: employees.length,
        created: createdRecords.length,
        existing: existingRecords.length,
        skipped: skippedRecords.length
      },
      createdRecords,
      existingRecords,
      skippedRecords
    }, { status: 201 });

  } catch (error) {
    console.error('Error generating payroll:', error);
    return NextResponse.json(
      { error: 'Failed to generate payroll', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/payroll - Update/Recalculate a payroll record
export async function PATCH(request: NextRequest) {
  try {
    // Get user from headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    const userRolesHeader = request.headers.get('x-user-roles');
    const userRoles = userRolesHeader ? JSON.parse(userRolesHeader) : [];

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const hasAdminAccess = userRoles.some((role: string) => 
      ['ADMIN', 'HR_MANAGER'].includes(role)
    );

    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Only admin/HR can update payroll' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, lopDays, otherAllowances, otherDeductions, status } = body;

    // Validate input
    if (!id) {
      return NextResponse.json(
        { error: 'Payroll record ID is required' },
        { status: 400 }
      );
    }

    // Fetch the payroll record with employee and salary details
    const record = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            salary: true
          }
        }
      }
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Payroll record not found' },
        { status: 404 }
      );
    }

    if (!record.employee.salary) {
      return NextResponse.json(
        { error: 'Employee salary not configured' },
        { status: 400 }
      );
    }

    // Get base salary values (monthly)
    const salary = record.employee.salary;
    const basicMonthly = decimalToNumber(salary.basicSalary) / 12;
    const hraMonthly = decimalToNumber(salary.hra) / 12;
    const conveyanceMonthly = decimalToNumber(salary.conveyanceAllowance) / 12;
    const medicalMonthly = decimalToNumber(salary.medicalAllowance) / 12;
    const specialMonthly = decimalToNumber(salary.specialAllowance) / 12;
    const basePfMonthly = decimalToNumber(salary.providentFund) / 12;
    const baseEsiMonthly = decimalToNumber(salary.esi) / 12;
    const basePtMonthly = decimalToNumber(salary.professionalTax) / 12;
    const baseIncomeTaxMonthly = decimalToNumber(salary.incomeTax) / 12;

    // Calculate daily rate for LOP calculation
    // Daily rate = Sum of all base earnings / 30
    const totalMonthlyEarnings = basicMonthly + hraMonthly + conveyanceMonthly + 
                                  medicalMonthly + specialMonthly;
    const dailyRate = totalMonthlyEarnings / 30;

    // Use provided values or keep existing ones
    const newLopDays = lopDays !== undefined ? parseFloat(lopDays) : decimalToNumber(record.lopDays);
    const newOtherAllowances = otherAllowances !== undefined ? parseFloat(otherAllowances) : decimalToNumber(record.otherAllowances);
    const newOtherDeductions = otherDeductions !== undefined ? parseFloat(otherDeductions) : decimalToNumber(record.otherDeductions);
    const newStatus = status || record.status;

    // Calculate LOP deduction
    const lopDeduction = dailyRate * newLopDays;

    // Calculate new gross salary
    // Gross = Base earnings + other allowances
    const newGrossSalary = basicMonthly + hraMonthly + conveyanceMonthly + 
                           medicalMonthly + specialMonthly + newOtherAllowances;

    // Calculate new total deductions
    // Deductions = Base deductions + LOP + other deductions
    const newTotalDeductions = basePfMonthly + baseEsiMonthly + basePtMonthly + 
                               baseIncomeTaxMonthly + lopDeduction + newOtherDeductions;

    // Calculate new net salary
    const newNetSalary = newGrossSalary - newTotalDeductions;

    // Update attendance fields based on LOP
    const totalWorkingDays = decimalToNumber(record.totalWorkingDays);
    const newPresentDays = totalWorkingDays - newLopDays;

    // Update the record
    const updatedRecord = await prisma.payrollRecord.update({
      where: { id },
      data: {
        // Attendance
        presentDays: numberToDecimal(newPresentDays),
        lopDays: numberToDecimal(newLopDays),
        
        // Earnings
        otherAllowances: numberToDecimal(newOtherAllowances),
        grossSalary: numberToDecimal(newGrossSalary),
        
        // Deductions
        lopDeduction: numberToDecimal(lopDeduction),
        otherDeductions: numberToDecimal(newOtherDeductions),
        totalDeductions: numberToDecimal(newTotalDeductions),
        
        // Net Pay
        netSalary: numberToDecimal(newNetSalary),
        
        // Status
        status: newStatus,
        
        // Update timestamp based on status
        ...(newStatus === 'PROCESSED' && { processedAt: new Date() }),
        ...(newStatus === 'PAID' && { paidAt: new Date() })
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            user: {
              select: {
                email: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    console.log(`✅ Updated payroll for ${record.employee.employeeCode}:`, {
      lopDays: newLopDays,
      lopDeduction: lopDeduction.toFixed(2),
      grossSalary: newGrossSalary.toFixed(2),
      totalDeductions: newTotalDeductions.toFixed(2),
      netSalary: newNetSalary.toFixed(2),
      status: newStatus
    });

    return NextResponse.json(updatedRecord);

  } catch (error) {
    console.error('Error updating payroll:', error);
    return NextResponse.json(
      { error: 'Failed to update payroll', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
