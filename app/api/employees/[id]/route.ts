import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// ------------------------------------------------------------------
// GET: Fetch Single Employee
// ------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: { salary: true }, 
    });

    if (!employee) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    // Map personalEmail -> email for the frontend form
    const responseData = {
        ...employee,
        email: employee.personalEmail, 
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// ------------------------------------------------------------------
// PATCH: Update Employee
// ------------------------------------------------------------------
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Destructure to separate Salary, System fields, and Mismatched Fields
    const { 
      // 1. Salary Fields
      basicSalary, hra, da, ta, pf, esi, specialAllowance, professionalTax, 
      
      // 2. Junk/System Fields (Exclude these from update)
      id: _id, 
      salary, 
      userId, 
      createdAt, 
      updatedAt,

      // 3. Mismatched Fields (Extract so they don't go into 'otherDetails')
      email, 
      accountNumber, // <--- EXTRACT THIS
      ifscCode,      // <--- EXTRACT THIS
      
      // 4. Everything else (Directly mapping fields like firstName, bankName)
      ...otherDetails 
    } = body;

    // Create the clean object for Employee Table
    const employeeData: any = { ...otherDetails };
    
    // MAP 'email' -> 'personalEmail'
    if (email !== undefined) {
        employeeData.personalEmail = email;
    }

    // MAP 'accountNumber' -> 'bankAccountNumber'
    if (accountNumber !== undefined) {
        employeeData.bankAccountNumber = accountNumber;
    }

    // MAP 'ifscCode' -> 'bankIfscCode'
    if (ifscCode !== undefined) {
        employeeData.bankIfscCode = ifscCode;
    }

    // FIX: Convert empty strings to null for unique/optional fields
    if (employeeData.panNumber === "") employeeData.panNumber = null;
    if (employeeData.uanNumber === "") employeeData.uanNumber = null;
    if (employeeData.bankAccountNumber === "") employeeData.bankAccountNumber = null;
    if (employeeData.employeeCode === "") delete employeeData.employeeCode; 

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      // 1. Update Employee Table
      if (Object.keys(employeeData).length > 0) {
        await tx.employee.update({
          where: { id: parseInt(id) },
          data: employeeData,
        });
      }

      // 2. Update Salary Table (with recalculated totals)
      if (basicSalary !== undefined) {
        const newBasic = Number(basicSalary);
        const newHra = Number(hra || 0);
        const newDa = Number(da || 0);
        const newTa = Number(ta || 0);
        const newPf = Number(pf || 0);
        const newEsi = Number(esi || 0);
        const newSpecial = Number(specialAllowance || 0);
        const newPt = Number(professionalTax || 0);

        const newGross = newBasic + newHra + newDa + newTa + newSpecial;
        const newDeductions = newPf + newEsi + newPt;
        const newNetMonthly = newGross - newDeductions;
        const newNetAnnual = newNetMonthly * 12;
        const newCtcAnnual = newGross * 12;

        await tx.employeeSalary.update({
          where: { employeeId: parseInt(id) },
          data: {
            basicSalary: newBasic,
            hra: newHra,
            da: newDa,
            ta: newTa,
            providentFund: newPf,
            esi: newEsi,
            specialAllowance: newSpecial,
            professionalTax: newPt,
            ctcAnnual: newCtcAnnual,
            netSalaryAnnual: newNetAnnual,
            netSalaryMonthly: newNetMonthly,
          },
        });
      }

      return await tx.employee.findUnique({
        where: { id: parseInt(id) },
        include: { salary: true },
      });
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return NextResponse.json({ message: 'Constraint violation: Email or PAN already exists.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

