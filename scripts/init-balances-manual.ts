const { PrismaClient } = require('@prisma/client');
const prismaClient = new PrismaClient(); // Renamed to avoid conflict

async function initBalances() {
  console.log("🚀 Starting Balance Init...");
  const currentYear = new Date().getFullYear();
  
  // 1. Fetch Employees
  const employees = await prismaClient.employee.findMany({
    // REMOVED 'status: PUBLISHED' filter to catch everyone for testing
    where: { 
        leaveTemplateId: { not: null }
    },
    include: { leaveTemplate: { include: { leaveTypes: true } } }
  });

  console.log(`Found ${employees.length} employees with templates.`);

  let createdCount = 0;

  for (const emp of employees) {
    if (!emp.leaveTemplate) {
        console.log(`Skipping ${emp.firstName} (No Template)`);
        continue;
    }

    // Pro-Rata Logic
    const doj = new Date(emp.dateOfJoining);
    const joinYear = doj.getFullYear();
    let startMonth = 0; 
    if (joinYear === currentYear) {
        startMonth = doj.getMonth();
        if (doj.getDate() > 15) startMonth += 1;
    }
    const remainingMonths = Math.max(0, 12 - startMonth);

    console.log(`Processing ${emp.firstName}: ${remainingMonths} months remaining.`);

    for (const type of emp.leaveTemplate.leaveTypes) {
      // Check if exists
      const exists = await prismaClient.employeeLeaveBalance.findUnique({
          where: {
              employeeId_leaveTypeId_year: {
                  employeeId: emp.id,
                  leaveTypeId: type.id,
                  year: currentYear
              }
          }
      });

      if (!exists) {
          const annualQuota = Number(type.annualQuota);
          let credit = (annualQuota / 12) * remainingMonths;
          credit = Math.round(credit * 100) / 100;

          await prismaClient.employeeLeaveBalance.create({
              data: {
                  employeeId: emp.id,
                  leaveTypeId: type.id,
                  year: currentYear,
                  opening: 0,
                  credited: credit,
                  used: 0,
                  closing: credit
              }
          });
          createdCount++;
          console.log(`   + Credited ${type.code}: ${credit}`);
      } else {
          console.log(`   - ${type.code} already exists.`);
      }
    }
  }

  console.log(`✅ Finished. Created ${createdCount} balance records.`);
}

initBalances()
  .catch(console.error)
  .finally(() => prismaClient.$disconnect());
