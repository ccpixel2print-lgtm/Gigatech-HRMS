import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employeeId = parseInt(id);

    // 1. Fetch Employee
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (employee.status === "PUBLISHED") {
      return NextResponse.json({ message: "Already published" });
    }

    // 2. Prepare Credentials
    const baseName = `${employee.firstName}.${employee.lastName}`.toLowerCase().replace(/\s/g, '');
    const emailToUse = employee.personalEmail || `${baseName}@gigatech.com`;
    const defaultPassword = "1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Transaction
    await prisma.$transaction(async (tx) => {
      
      // --- A. USER CREATION ---
      const existingUser = await tx.user.findUnique({ where: { email: emailToUse } });
      let newUserId: number;

      if (existingUser) {
        newUserId = existingUser.id;
      } else {
        const newUser = await tx.user.create({
          data: {
            email: emailToUse,
            passwordHash: hashedPassword,
            fullName: `${employee.firstName} ${employee.lastName}`,
            isActive: true,
          }
        });
        newUserId = newUser.id;

        const employeeRole = await tx.role.findUnique({ where: { name: "EMPLOYEE" } });
        if (employeeRole) {
            await tx.userRole.create({
                data: { userId: newUserId, roleId: employeeRole.id }
            });
        }
      }

      // --- B. LEAVE BALANCE GENERATION (DYNAMIC PRO-RATA) ---
      let templateId = employee.leaveTemplateId;

      // 1. If no template assigned, find default
      if (!templateId) {
        const defaultTemplate = await tx.leaveTemplate.findFirst({
            where: { name: "Standard Policy 2026" } 
        });
        if (defaultTemplate) {
            templateId = defaultTemplate.id;
        }
      }

      // 2. If we have a template, generate balances
      if (templateId) {
        const leaveTypes = await tx.leaveType.findMany({ where: { leaveTemplateId: templateId } });
        const currentYear = new Date().getFullYear();
        
        // Calculate Pro-Rata Factor
        const doj = new Date(employee.dateOfJoining);
        let startMonth = 0; // Jan = 0
        
        // Only apply pro-rata if joined THIS year
        if (doj.getFullYear() === currentYear) {
            startMonth = doj.getMonth();
            if (doj.getDate() > 15) startMonth += 1; // Join late in month -> skip month
        }
        
        const remainingMonths = Math.max(0, 12 - startMonth);

        for (const type of leaveTypes) {
            // Check if balance exists
            const exists = await tx.employeeLeaveBalance.findUnique({
                where: {
                    employeeId_leaveTypeId_year: {
                        employeeId: employeeId,
                        leaveTypeId: type.id,
                        year: currentYear
                    }
                }
            });

            if (!exists) {
                const annualQuota = Number(type.annualQuota);
                let credit = 0;

                // --- SMART LOGIC ---
                if (type.code === 'EL') {
                    // EL starts at 0 (Accrues monthly)
                    credit = 0;
                } else if (type.code === 'LOP' || type.code === 'CO') {
                    // Utility types start at 0
                    credit = annualQuota;
                } else {
                    // CL / SL: Pro-Rata Calculation
                    // Formula: (Quota / 12) * Remaining Months
                    credit = (annualQuota / 12) * remainingMonths;
                    
                    // Round to 2 decimals
                    credit = Math.round(credit * 100) / 100;
                }

                await tx.employeeLeaveBalance.create({
                    data: {
                        employeeId: employeeId,
                        leaveTypeId: type.id,
                        year: currentYear,
                        opening: 0,
                        credited: credit,
                        used: 0,
                        closing: credit
                    }
                });
            }
        }
      }

      // --- C. UPDATE EMPLOYEE STATUS ---
      await tx.employee.update({
        where: { id: employeeId },
        data: { 
            status: "PUBLISHED",
            userId: newUserId,
            leaveTemplateId: templateId 
        }
      });
    });

    return NextResponse.json({ 
        success: true, 
        message: "Employee Published & Leaves Assigned",
        credentials: { email: emailToUse, password: defaultPassword } 
    });

  } catch (error) {
    console.error("Publish Error:", error);
    return NextResponse.json({ error: "Failed to publish employee" }, { status: 500 });
  }
}