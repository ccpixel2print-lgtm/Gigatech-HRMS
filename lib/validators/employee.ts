import { z } from "zod";

export const employeeSchema = z.object({
  // Personal
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  personalPhone: z.string().optional(), // New
  dateOfBirth: z.coerce.date().optional(), // New
  gender: z.string().optional(), // New
  currentAddress: z.string().optional(), // New

  // Employment
  // Dates: Coerce string to Date object
  dateOfJoining: z.coerce.date(),
  designation: z.string().optional(),
  department: z.string().optional(),
  employmentType: z.string().optional(), // New (Full-time, etc)
  
  // Salary: Coerce string input to number, min 0
  basicSalary: z.coerce.number().min(1, "Basic Salary is required"),
  hra: z.coerce.number().default(0),
  da: z.coerce.number().default(0),
  ta: z.coerce.number().default(0),
  specialAllowance: z.coerce.number().default(0),
  pf: z.coerce.number().default(0),
  esi: z.coerce.number().default(0),
  professionalTax: z.coerce.number().default(0),
  
  // Bank
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  
  // Statutory
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
