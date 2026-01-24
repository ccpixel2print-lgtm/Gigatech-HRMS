import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { employeeSchema } from '@/lib/validators/employee'
import { Prisma } from '@prisma/client'

const SALT_ROUNDS = 10

/**
 * Generate next employee code
 * Format: EMP001, EMP002, ..., EMP999, EMP1000
 */
async function generateEmployeeCode(): Promise<string> {
  const lastEmployee = await prisma.employee.findFirst({
    orderBy: { employeeCode: 'desc' },
    select: { employeeCode: true }
  })

  if (!lastEmployee) {
    return 'EMP001'
  }

  // Extract number from last employee code (e.g., "EMP001" -> 1)
  const lastNumber = parseInt(lastEmployee.employeeCode.replace('EMP', ''))
  const nextNumber = lastNumber + 1

  // Format with leading zeros (EMP001, EMP002, etc.)
  return `EMP${nextNumber.toString().padStart(3, '0')}`
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

    // Validate input with the simplified schema
    const validation = employeeSchema.safeParse(body)
    if (!validation.success) {
      console.error('[API/EMPLOYEES] Validation failed:', validation.error.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    console.log('[API/EMPLOYEES] Creating employee:', data.firstName, data.lastName)

    // Check if work email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Work email already exists' },
        { status: 409 }
      )
    }

    // Check for duplicate PAN if provided
    if (data.panNumber) {
      const existingPan = await prisma.employee.findUnique({
        where: { panNumber: data.panNumber }
      })
      if (existingPan) {
        return NextResponse.json(
          { error: 'PAN number already exists' },
          { status: 409 }
        )
      }
    }

    // Generate employee code and username
    const employeeCode = await generateEmployeeCode()
    const username = await generateUsername(data.firstName, data.lastName)
    const password = '1234' // Default password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    console.log('[API/EMPLOYEES] Generated employee code:', employeeCode)
    console.log('[API/EMPLOYEES] Generated username:', username)

    // Calculate salary values
    const gross = data.basicSalary + data.hra + data.da + data.specialAllowance
    const deductions = data.pf + data.esi + data.professionalTax
    const netAnnual = gross - deductions
    const netMonthly = netAnnual / 12

    // Create employee and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User account
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: passwordHash,
          fullName: `${data.firstName} ${data.lastName}`,
          isActive: true,
          failedLoginAttempts: 0,
        }
      })

      // 2. Assign EMPLOYEE role
      const employeeRole = await tx.role.findUnique({
        where: { name: 'EMPLOYEE' }
      })

      if (employeeRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: employeeRole.id,
          }
        })
      }

      // 3. Create Employee record
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeCode: employeeCode,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date('1990-01-01'), // Default DOB
          gender: 'MALE', // Default gender
          personalPhone: '0000000000', // Default phone
          dateOfJoining: data.dateOfJoining,
          employmentType: 'FULL_TIME', // Default
          designation: data.designation || 'Employee',
          department: data.department || 'General',
          panNumber: data.panNumber,
          uanNumber: data.uanNumber,
          bankName: data.bankName,
          bankAccountNumber: data.accountNumber,
          bankIfscCode: data.ifscCode,
          status: 'DRAFT',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            }
          }
        }
      })

      // 4. Create EmployeeSalary record
      const salary = await tx.employeeSalary.create({
        data: {
          employeeId: employee.id,
          ctcAnnual: new Prisma.Decimal(gross),
          basicSalary: new Prisma.Decimal(data.basicSalary),
          hra: new Prisma.Decimal(data.hra),
          conveyanceAllowance: new Prisma.Decimal(data.da), // Using DA as conveyance
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

    console.log('[API/EMPLOYEES] Employee created successfully:', result.employee.id)

    // Return created employee with salary
    return NextResponse.json(
      {
        ...result.employee,
        salary: result.salary,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[API/EMPLOYEES] Error creating employee:', error)
    
    // Handle Prisma unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'A unique constraint would be violated. Please check email, PAN, or UAN numbers.' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create employee', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
