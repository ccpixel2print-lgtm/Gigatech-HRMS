import { z } from "zod";

export const employeeSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  // Dates: Coerce string to Date object
  dateOfJoining: z.coerce.date(),
  designation: z.string().optional(),
  department: z.string().optional(),
  // Salary: Coerce string input to number, min 0
  basicSalary: z.coerce.number().min(1, "Basic Salary is required"),
  hra: z.coerce.number().default(0),
  da: z.coerce.number().default(0),
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
