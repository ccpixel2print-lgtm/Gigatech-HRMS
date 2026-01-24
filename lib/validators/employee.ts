import { z } from 'zod'

// Gender enum
export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER'])

// Marital status enum
export const MaritalStatusEnum = z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'])

// Employment type enum
export const EmploymentTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'])

// Employee status enum
export const EmployeeStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'INACTIVE'])

// Decimal string validation (for Prisma Decimal fields)
// Accepts string representation of decimal numbers
const decimalString = z.string().refine(
  (val) => !isNaN(parseFloat(val)) && isFinite(parseFloat(val)),
  { message: 'Must be a valid decimal number' }
)

// Employee Salary Schema
export const employeeSalarySchema = z.object({
  // CTC Breakdown (Annual) - All required
  ctcAnnual: decimalString,
  basicSalary: decimalString,
  hra: decimalString,
  conveyanceAllowance: decimalString,
  medicalAllowance: decimalString,
  specialAllowance: decimalString,
  otherAllowances: decimalString.optional().default('0'),
  
  // Deductions
  providentFund: decimalString,
  esi: decimalString.optional().default('0'),
  professionalTax: decimalString.optional().default('0'),
  incomeTax: decimalString.optional().default('0'),
  otherDeductions: decimalString.optional().default('0'),
  
  // Net Salary
  netSalaryAnnual: decimalString,
  netSalaryMonthly: decimalString,
  
  // Dates
  effectiveFrom: z.string().or(z.date()),
  effectiveTo: z.string().or(z.date()).optional().nullable(),
  isActive: z.boolean().optional().default(true),
})

// Create Employee Schema
export const createEmployeeSchema = z.object({
  // Personal Details
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().or(z.date()),
  gender: GenderEnum,
  maritalStatus: MaritalStatusEnum.optional().nullable(),
  personalEmail: z.string().email('Invalid email format').optional().nullable(),
  personalPhone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  emergencyContactName: z.string().max(200).optional().nullable(),
  emergencyContactPhone: z.string().max(15).optional().nullable(),
  
  // Address
  currentAddress: z.string().max(500).optional().nullable(),
  permanentAddress: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  pincode: z.string().max(10).optional().nullable(),
  
  // Employment Details
  dateOfJoining: z.string().or(z.date()),
  dateOfLeaving: z.string().or(z.date()).optional().nullable(),
  employmentType: EmploymentTypeEnum,
  designation: z.string().min(1, 'Designation is required').max(200),
  department: z.string().min(1, 'Department is required').max(200),
  reportingManagerId: z.number().int().positive().optional().nullable(),
  
  // Statutory Details (Indian compliance)
  panNumber: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g., ABCDE1234F)')
    .optional()
    .nullable(),
  aadharNumber: z.string()
    .regex(/^[0-9]{12}$/, 'Aadhar must be 12 digits')
    .optional()
    .nullable(),
  uanNumber: z.string()
    .regex(/^[0-9]{12}$/, 'UAN must be 12 digits')
    .optional()
    .nullable(),
  esicNumber: z.string().max(20).optional().nullable(),
  
  // Bank Details
  bankName: z.string().max(200).optional().nullable(),
  bankAccountNumber: z.string().max(50).optional().nullable(),
  bankIfscCode: z.string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format')
    .optional()
    .nullable(),
  bankBranch: z.string().max(200).optional().nullable(),
  
  // Status
  status: EmployeeStatusEnum.optional().default('DRAFT'),
  
  // Salary (nested object)
  salary: employeeSalarySchema,
  
  // User account creation
  workEmail: z.string().email('Invalid email format'),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
})

// Update Employee Schema (same as create but with partial fields)
export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  id: z.number().int().positive(),
})

// Publish Employee Schema (for status changes)
export const publishEmployeeSchema = z.object({
  id: z.number().int().positive(),
  status: EmployeeStatusEnum,
})

// Types
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type PublishEmployeeInput = z.infer<typeof publishEmployeeSchema>
export type EmployeeSalaryInput = z.infer<typeof employeeSalarySchema>
