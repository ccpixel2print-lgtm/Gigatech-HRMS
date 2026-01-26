import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Verify this import path matches your project structure
import { Prisma } from '@prisma/client';

// ------------------------------------------------------------------
// GET: Fetch Single Employee
// ------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // FIX 1: params is a Promise
) {
  try {
    const { id } = await params; // FIX 2: Await the params

    if (!id) return NextResponse.json({ message: "ID Missing" }, { status: 400 });

    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) }, 
      include: {
        salary: true, 
      },
    });

    if (!employee) {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
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
    
    // Destructure to separate Salary, System fields, and Personal Data
    const { 
      // 1. Salary Fields
      basicSalary, hra, da, pf, esi, specialAllowance, professionalTax, 
      
      // 2. Junk/System Fields (Exclude these from update)
      id: _id, 
      salary, 
      userId, 
      createdAt, 
      updatedAt,

      // 3. The Mismatch Field
      email, 
      
      // 4. Everything else
      ...otherDetails 
    } = body;

    // Create the clean object for Employee Table
    const employeeData: any = { ...otherDetails };
    
    // MAP 'email' to 'personalEmail'
    if (email) {
        employeeData.personalEmail = email;
    }

    const updatedEmployee = await prisma.$transaction(async (tx) => {
      // 1. Update Employee Table
      if (Object.keys(employeeData).length > 0) {
        await tx.employee.update({
          where: { id: parseInt(id) },
          data: employeeData,
        });
      }

      // 2. Update Salary Table (Only if basicSalary is defined)
      if (basicSalary !== undefined) {
        await tx.employeeSalary.update({
          where: { employeeId: parseInt(id) },
          data: {
            basicSalary: Number(basicSalary),
            hra: Number(hra || 0),
            esi: Number(esi || 0),
            specialAllowance: Number(specialAllowance || 0),
            professionalTax: Number(professionalTax || 0),
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
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

