const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🛠️ Fixing EL Balances...");

  // 1. Find EL Leave Type
  const elType = await prisma.leaveType.findFirst({ where: { code: 'EL' } });
  if (!elType) return console.error("EL Type not found");

  // 2. Update ALL EL Balances to 0
  const result = await prisma.employeeLeaveBalance.updateMany({
    where: { 
        leaveTypeId: elType.id,
        year: new Date().getFullYear()
    },
    data: {
        credited: 0,
        closing: 0, 
        // Note: If someone already USED leave, 'closing' should be negative? 
        // For fresh prod launch, assuming nobody used it yet.
    }
  });

  console.log(`✅ Reset ${result.count} EL records to 0.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
