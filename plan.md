# HR Lite - Implementation Plan (Phase I MVP)

## Project Status
- Current Phase: 1. Foundation & Schema
- Status: NOT STARTED

## 1. Foundation & Database Schema
- [ ] Initialize Next.js 14 (App Router), TypeScript, Tailwind, ShadCN UI
- [ ] Install dependencies: prisma, @prisma/client, next-auth(v5) or jose, bcryptjs, date-fns, zod, zustand, clsx, tailwind-merge
- [ ] Setup `lib/prisma.ts` & `lib/utils.ts`
- [ ] **LOOSE EDGE FIX:** Define Prisma Schema with specific hardening:
    - [ ] `Users` table: Add `failedLoginAttempts` (Int) and `lockedUntil` (DateTime) for security
    - [ ] `PayrollRecords` table: Ensure `Decimal(12,2)` for salary, `Decimal(5,2)` for percentages
    - [ ] `PayrollRecords` table: Ensure `updatedAt` exists for Optimistic Concurrency Control
    - [ ] Map JSON fields (`AdminRequests`, `AuditLogs`) to `@db.JsonB`
- [ ] Configure `.env` and verify Neon DB connection via `prisma db push`

## 2. Authentication & Role Management
- [ ] Implement `lib/auth.ts` using JWT & JOSE
- [ ] **LOOSE EDGE FIX:** Implement Login Logic with Rate Limiting (5 attempts = 15 min lock)
- [ ] Create `middleware.ts` for RBAC protection
- [ ] Create Seed Script (`scripts/seed.ts`) to create Admin/HR/TeamLead/Employee users
- [ ] Create Admin User Management UI (Create/Edit/Soft-Delete)

## 3. HR Master Data (Employees & Salary)
- [ ] Create Employee Onboarding Form (Personal, Bank, Statutory)
- [ ] Create Salary Config Form with Indian Standard breakdowns (Basic, HRA, DA, PF, ESI)
- [ ] Implement "Publish Employee" status workflow

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
