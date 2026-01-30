const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Production Seeding...');

  // 1. Create Roles
  const roles = ['ADMIN', 'HR_MANAGER', 'TEAM_LEAD', 'EMPLOYEE'];
  
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `System Role: ${roleName}` },
    });
    console.log(`✅ Role: ${role.name}`);
  }

  // 2. Create Admin User
  const adminEmail = 'admin@gigatech.com';
  const defaultPassword = '1234';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: 'System Administrator',
      passwordHash: hashedPassword,
      isActive: true,
      failedLoginAttempts: 0,
    },
  });
  console.log(`✅ Admin User: ${adminUser.email}`);

  // 3. Assign Admin Role
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (adminRole) {
    await prisma.userRole.create({
        data: {
            userId: adminUser.id,
            roleId: adminRole.id
        }
    }).catch(() => console.log('   (Role already assigned)'));
  }

  // 4. Create HR Manager User (Optional but useful)
  const hrEmail = 'hr@gigatech.com';
  const hrUser = await prisma.user.upsert({
    where: { email: hrEmail },
    update: {},
    create: {
      email: hrEmail,
      fullName: 'HR Manager',
      passwordHash: hashedPassword,
      isActive: true,
    },
  });
  console.log(`✅ HR User: ${hrUser.email}`);

  const hrRole = await prisma.role.findUnique({ where: { name: 'HR_MANAGER' } });
  if (hrRole) {
    await prisma.userRole.create({
        data: { userId: hrUser.id, roleId: hrRole.id }
    }).catch(() => console.log('   (Role already assigned)'));
  }

  // 5. Seed Leave Templates (Essential for new employees)
  // Ensure we have a standard policy
  await prisma.leaveTemplates.upsert({
      where: { name: "Standard Policy 2026" },
      update: {},
      create: {
          name: "Standard Policy 2026",
          description: "Default policy",
          isDefault: true,
          sandwichRule: false
      }
  });
  // Note: We skip leave types details for now to keep script simple, 
  // but the template existence prevents errors.

  console.log('✅ Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
