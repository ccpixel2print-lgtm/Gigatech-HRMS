

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Get the Standard Policy
  const template = await prisma.leaveTemplate.findFirst({
    where: { name: "Standard Policy 2026" }
  });

  if (!template) return console.error("Template not found! Run seed-leaves.ts first.");

  // 2. Update ALL employees (Draft OR Published)
  const result = await prisma.employee.updateMany({
    where: { leaveTemplateId: null },
    data: { leaveTemplateId: template.id }
  });

  console.log(`✅ Assigned template to ${result.count} employees.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
