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
    // Generate an email if personalEmail is missing
    const baseName = `${employee.firstName}.${employee.lastName}`.toLowerCase().replace(/\s/g, '');
    const emailToUse = employee.personalEmail || `${baseName}@gigatech.com`;
    
    const defaultPassword = "1234";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Create User & Update Employee
    await prisma.$transaction(async (tx) => {
      
      // Check if user already exists (by email)
      const existingUser = await tx.user.findUnique({ where: { email: emailToUse } });
      
      let newUserId: number;

      if (existingUser) {
        // If user exists, just link them
        newUserId = existingUser.id;
        // Optional: Ensure they are active?
      } else {
        // Create new User
        const newUser = await tx.user.create({
          data: {
            email: emailToUse,
            passwordHash: hashedPassword, // Matches your Schema
            fullName: `${employee.firstName} ${employee.lastName}`, // Matches your Schema
            isActive: true,
            // failedLoginAttempts defaults to 0
            // lockedUntil defaults to null
          }
        });
        newUserId = newUser.id;

        // Assign EMPLOYEE Role
        const employeeRole = await tx.role.findUnique({ where: { name: "EMPLOYEE" } });
        if (employeeRole) {
            await tx.userRole.create({
                data: {
                    userId: newUserId,
                    roleId: employeeRole.id
                }
            });
        }
      }

      // Update Employee Status & Link User
      await tx.employee.update({
        where: { id: employeeId },
        data: { 
            status: "PUBLISHED",
            userId: newUserId // Link the User ID
        }
      });
    });

    return NextResponse.json({ 
        success: true, 
        message: "Employee Published",
        credentials: { email: emailToUse, password: defaultPassword } 
    });

  } catch (error) {
    console.error("Publish Error:", error);
    return NextResponse.json({ error: "Failed to publish employee" }, { status: 500 });
  }
}
