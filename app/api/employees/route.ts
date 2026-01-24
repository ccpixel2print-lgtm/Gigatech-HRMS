import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createEmployeeSchema } from '@/lib/validators/employee'
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

    // Validate input
    const validation = createEmployeeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    console.log('[API/EMPLOYEES] Creating employee:', data.firstName, data.lastName)

    // Check if work email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.workEmail }
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

    // Check for duplicate Aadhar if provided
    if (data.aadharNumber) {
      const existingAadhar = await prisma.employee.findUnique({
        where: { aadharNumber: data.aadharNumber }
      })
      if (existingAadhar) {
        return NextResponse.json(
          { error: 'Aadhar number already exists' },
          { status: 409 }
        )
      }
    }

    // Generate employee code and username
    const employeeCode = await generateEmployeeCode()
    const username = await generateUsername(data.firstName, data.lastName)
    const password = data.password || '1234' // Default password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    console.log('[API/EMPLOYEES] Generated employee code:', employeeCode)
    console.log('[API/EMPLOYEES] Generated username:', username)

    // Create employee and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User account
      const user = await tx.user.create({
        data: {
          email: data.workEmail,
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
          middleName: data.middleName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          gender: data.gender,
          maritalStatus: data.maritalStatus,
          personalEmail: data.personalEmail,
          personalPhone: data.personalPhone,
          emergencyContactName: data.emergencyContactName,
          emergencyContactPhone: data.emergencyContactPhone,
          currentAddress: data.currentAddress,
          permanentAddress: data.permanentAddress,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          dateOfJoining: new Date(data.dateOfJoining),
          dateOfLeaving: data.dateOfLeaving ? new Date(data.dateOfLeaving) : null,
          employmentType: data.employmentType,
          designation: data.designation,
          department: data.department,
          reportingManagerId: data.reportingManagerId,
          panNumber: data.panNumber,
          aadharNumber: data.aadharNumber,
          uanNumber: data.uanNumber,
          esicNumber: data.esicNumber,
          bankName: data.bankName,
          bankAccountNumber: data.bankAccountNumber,
          bankIfscCode: data.bankIfscCode,
          bankBranch: data.bankBranch,
          status: data.status || 'DRAFT',
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
          ctcAnnual: new Prisma.Decimal(data.salary.ctcAnnual),
          basicSalary: new Prisma.Decimal(data.salary.basicSalary),
          hra: new Prisma.Decimal(data.salary.hra),
          conveyanceAllowance: new Prisma.Decimal(data.salary.conveyanceAllowance),
          medicalAllowance: new Prisma.Decimal(data.salary.medicalAllowance),
          specialAllowance: new Prisma.Decimal(data.salary.specialAllowance),
          otherAllowances: new Prisma.Decimal(data.salary.otherAllowances || '0'),
          providentFund: new Prisma.Decimal(data.salary.providentFund),
          esi: new Prisma.Decimal(data.salary.esi || '0'),
          professionalTax: new Prisma.Decimal(data.salary.professionalTax || '0'),
          incomeTax: new Prisma.Decimal(data.salary.incomeTax || '0'),
          otherDeductions: new Prisma.Decimal(data.salary.otherDeductions || '0'),
          netSalaryAnnual: new Prisma.Decimal(data.salary.netSalaryAnnual),
          netSalaryMonthly: new Prisma.Decimal(data.salary.netSalaryMonthly),
          effectiveFrom: new Date(data.salary.effectiveFrom),
          effectiveTo: data.salary.effectiveTo ? new Date(data.salary.effectiveTo) : null,
          isActive: data.salary.isActive ?? true,
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
          { error: 'A unique constraint would be violated. Please check PAN, Aadhar, UAN, or ESIC numbers.' },
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
