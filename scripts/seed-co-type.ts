const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const template = await prisma.leaveTemplate.findFirst({ where: { name: 'Standard Policy 2026' } });
  
  if(template) {
      await prisma.leaveType.upsert({
        where: { code: 'CO' },
        update: {},
        create: {
          leaveTemplateId: template.id,
          code: 'CO',
          name: 'Compensatory Off',
          annualQuota: 0, // Starts at 0, earned by working
          isPaid: true
        }
      });
      console.log("✅ CO Leave Type Created");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
