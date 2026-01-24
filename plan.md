# HR Lite - Implementation Plan (Phase I MVP)

## Project Status
- Current Phase: 3. HR Master Data (Employees & Salary)
- Status: IN PROGRESS

## 1. Foundation & Database Schema ✅ COMPLETED
- [x] Initialize Next.js 14 (App Router), TypeScript, Tailwind, ShadCN UI
- [x] Install dependencies: prisma, @prisma/client, next-auth(v5) or jose, bcryptjs, date-fns, zod, zustand, clsx, tailwind-merge
- [x] Setup `lib/prisma.ts` & `lib/utils.ts`
- [x] **LOOSE EDGE FIX:** Define Prisma Schema with specific hardening:
    - [x] `Users` table: Add `failedLoginAttempts` (Int) and `lockedUntil` (DateTime) for security
    - [x] `PayrollRecords` table: Ensure `Decimal(12,2)` for salary, `Decimal(5,2)` for percentages
    - [x] `PayrollRecords` table: Ensure `updatedAt` exists for Optimistic Concurrency Control
    - [x] Map JSON fields (`AdminRequests`, `AuditLogs`) to `@db.JsonB`
- [x] Configure `.env` and verify Neon DB connection via `prisma db push`

## 2. Authentication & Role Management ✅ COMPLETED
- [x] Implement `lib/auth.ts` using JWT & JOSE
- [x] **LOOSE EDGE FIX:** Implement Login Logic with Rate Limiting (5 attempts = 15 min lock)
- [x] Create `middleware.ts` for RBAC protection
- [x] Create Seed Script (`scripts/seed.ts`) to create Admin/HR/TeamLead/Employee users
- [x] Create Admin User Management UI (Create/Edit/Soft-Delete)
- [x] **LOOSE EDGE FEATURE:** Implement User Unlock functionality (Reset failedLoginAttempts & lockedUntil)

## 3. HR Master Data (Employees & Salary) ✅ COMPLETED
- [x] Create Employee Backend API with Zod validation (lib/validators/employee.ts)
- [x] Implement Employee Creation with Transaction (User + Employee + Salary in one atomic operation)
- [x] Add Employee Code Auto-generation (EMP001, EMP002, etc.)
- [x] Add Username Auto-generation (firstname.lastname)
- [x] Create Employee Onboarding Form with 4 tabs:
  - [x] Tab 1: Personal Details (Name, DOB, Gender, Address, Emergency Contact)
  - [x] Tab 2: Employment Details (Work Email, DOJ, Designation, Department, Employment Type)
  - [x] Tab 3: Bank & Statutory Details (Bank Name, Account No, IFSC, PAN, Aadhar, UAN, ESIC)
  - [x] Tab 4: Salary Structure (Basic, HRA, Conveyance, Medical, Special, PF, ESI, PT, Income Tax)
- [x] Implement real-time Salary Calculator with CTC Preview
- [x] Create Employee List Page (app/hr/employees/page.tsx) with table view
- [x] Create New Employee Page (app/hr/employees/new/page.tsx)
- [x] Create HR Layout with navigation sidebar (app/hr/layout.tsx)
- [x] Handle Decimal inputs properly (parse string to float)
- [x] Map all fields exactly to EmployeeSalary model
- [ ] Implement "Publish Employee" status workflow (Optional - can be added later)

## 4. Leave Management Engine
- [ ] Create Leave Template Management (Admin)
- [ ] Implement Holiday Calendar
- [ ] **LOOSE EDGE FIX:** Implement "Sandwich Rule" logic helper function (Logic: Holiday/Weekend -> Leave -> Sandwich Check)
- [ ] Create Leave Application Form & Approval Workflow (L1 -> L2)

## 5. Payroll Engine (The Core)
- [ ] **LOOSE EDGE FIX:** Implement strict Payroll Calculation Order:
    1. Identify Working Days
    2. Subtract Approved Leaves
    3. Apply LOP Logic
    4. Calculate Gross & Deductions
    5. Generate Net Pay
- [ ] Create Payroll Generation Interface (Select Month/Year -> Preview)
- [ ] Create Payslip PDF Generator using `@react-pdf/renderer` with Indian Format

## 6. Dashboards & UI Polish
- [ ] Role-based Dashboards (Admin, HR, Team Lead, Employee)
- [ ] "My Payslips" & "My Leaves" views for Employees
- [ ] Final UI Polish (ShadCN components)

## 7. Final Checks
- [ ] Database Migration Wizard UI
- [ ] End-to-End Test of Payroll Calculation
