import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { employeeSchema } from '@/lib/validators/employee'
import { Prisma } from '@prisma/client'

const SALT_ROUNDS = 10

/**
 * Generate next employee code
 * Format: GGS1000, GGS1001, ...
 */
async function generateEmployeeCode(): Promise<string> {
  // Find the last employee that matches the new format "GGS"
  const lastEmployee = await prisma.employee.findFirst({
    where: { 
      employeeCode: { startsWith: 'GGS' } 
    },
    // We order by ID desc to get the most recently created one
    // (Ordering by string code can be buggy: "GGS9" > "GGS10" is false)
    orderBy: { id: 'desc' }, 
    select: { employeeCode: true }
  })

  if (!lastEmployee) {
    // STARTING POINT: No existing GGS employees, start at 1000
    return 'GGS1000';
  }

  // Extract number (e.g., "GGS1005" -> 1005)
  // We use regex to remove non-digits just to be safe
  const lastNumber = parseInt(lastEmployee.employeeCode.replace(/\D/g, ''));
  
  if (isNaN(lastNumber)) return 'GGS1000'; // Fallback

  const nextNumber = lastNumber + 1;

  // Return format GGS1001
  return `GGS${nextNumber}`;
}

/**
 * Generate username from first and last name
 * Format: firstname.lastname
 * Handle duplicates by appending number
 */
async function generateUsername(firstName: string, lastName: string): Promise<string> {
  const baseUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9.]/g, '')

  // Check if username exists
  const existingUser = await prisma.user.findUnique({
    where: { email: `${baseUsername}@company.com` }
  })

  if (!existingUser) {
    return baseUsername
  }

  // If exists, append number
  let counter = 1
  let newUsername = `${baseUsername}${counter}`
  
  while (await prisma.user.findUnique({ 
    where: { email: `${newUsername}@company.com` } 
  })) {
    counter++
    newUsername = `${baseUsername}${counter}`
  }

  return newUsername
}

// GET - List all employees
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const rolesHeader = request.headers.get('x-user-roles')
    const roles = rolesHeader ? JSON.parse(rolesHeader) : []
    
    if (!roles.includes('ADMIN') && !roles.includes('HR_MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or HR access required' },
        { status: 403 }
      )
    }

    console.log('[API/EMPLOYEES] Fetching all employees...')

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
          }
        },
        salary: true,
        reportingManager: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`[API/EMPLOYEES] Found ${employees.length} employees`)

    return NextResponse.json(employees, { status: 200 })

  } catch (error) {
    console.error('[API/EMPLOYEES] Error fetching employees:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch employees', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    // Check if user is ADMIN or HR_MANAGER
    const rolesHeader = request.headers.get('x-user-roles')
    const roles = rolesHeader ? JSON.parse(rolesHeader) : []
    
    if (!roles.includes('ADMIN') && !roles.includes('HR_MANAGER')) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or HR access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('[API/EMPLOYEES] Received body:', JSON.stringify(body, null, 2))

    const validation = employeeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.format() },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check if work email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Check PAN
    if (data.panNumber) {
      const existingPan = await prisma.employee.findUnique({
        where: { panNumber: data.panNumber }
      })
      if (existingPan) {
        return NextResponse.json({ error: 'PAN number already exists' }, { status: 409 })
      }
    }

    const employeeCode = await generateEmployeeCode()
    const password = '1234' 
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Calculate salary values
    const gross = data.basicSalary + data.hra + data.da + data.ta + data.specialAllowance; // Added TA
    const deductions = data.pf + data.esi + data.professionalTax
    const netAnnual = (gross - deductions) * 12; // Annual = Monthly * 12
    const netMonthly = gross - deductions;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: passwordHash,
          fullName: `${data.firstName} ${data.lastName}`,
          isActive: true,
          failedLoginAttempts: 0,
        }
      })

      // 2. Assign Role
      const employeeRole = await tx.role.findUnique({ where: { name: 'EMPLOYEE' } })
      if (employeeRole) {
        await tx.userRole.create({
          data: { userId: user.id, roleId: employeeRole.id }
        })
      }

      // 3. Create Employee (FIXED MAPPING)
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode: employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          personalEmail: data.email, // <--- FIX 1: Map Email to PersonalEmail
          personalPhone: data.personalPhone || '', 
          dateOfBirth: data.dateOfBirth || new Date('1900-01-01'),
          gender: data.gender || 'MALE', 
          dateOfJoining: data.dateOfJoining,
          employmentType: data.employmentType || 'FULL_TIME', 
          designation: data.designation || 'Employee',
          department: data.department || 'General',
          panNumber: data.panNumber || null,
          uanNumber: data.uanNumber || null,
          bankName: data.bankName,
          bankAccountNumber: data.bankAccountNumber || null, // Ensure key matches schema/zod
          bankIfscCode: data.bankIfscCode,
          currentAddress: data.currentAddress,
          status: 'DRAFT',
        },
        include: {
          user: { select: { id: true, email: true, fullName: true } }
        }
      })

      // 4. Create Salary (FIXED MAPPING)
      const salary = await tx.employeeSalary.create({
        data: {
          employeeId: employee.id,
          ctcAnnual: new Prisma.Decimal(gross * 12),
          basicSalary: new Prisma.Decimal(data.basicSalary),
          hra: new Prisma.Decimal(data.hra),
          
          da: new Prisma.Decimal(data.da), // <--- FIX 2: Map DA to DA
          ta: new Prisma.Decimal(data.ta), // <--- FIX 2: Map TA to TA
          
          conveyanceAllowance: new Prisma.Decimal(0), // Zero out unused legacy fields
          medicalAllowance: new Prisma.Decimal(0),
          
          specialAllowance: new Prisma.Decimal(data.specialAllowance),
          otherAllowances: new Prisma.Decimal(0),
          
          providentFund: new Prisma.Decimal(data.pf),
          esi: new Prisma.Decimal(data.esi),
          professionalTax: new Prisma.Decimal(data.professionalTax),
          incomeTax: new Prisma.Decimal(0),
          otherDeductions: new Prisma.Decimal(0),
          
          netSalaryAnnual: new Prisma.Decimal(netAnnual),
          netSalaryMonthly: new Prisma.Decimal(netMonthly),
          effectiveFrom: data.dateOfJoining,
          isActive: true,
        }
      })

      return { employee, salary }
    })

    return NextResponse.json({ ...result.employee, salary: result.salary }, { status: 201 })

  } catch (error) {
    console.error('[API/EMPLOYEES] Error:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'Constraint violation: Email or PAN already exists.' },
          { status: 409 }
        )
      }
    }
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}

