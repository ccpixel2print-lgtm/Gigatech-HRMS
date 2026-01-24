import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLeaves() {
  console.log('🌱 Starting Leave Management Seeding...\n');

  try {
    // 1. Create Leave Template
    console.log('📋 Creating Leave Template: Standard Policy 2026');
    const template = await prisma.leaveTemplate.upsert({
      where: { name: 'Standard Policy 2026' },
      update: {},
      create: {
        name: 'Standard Policy 2026',
        description: 'Standard leave policy for all employees in 2026',
        isActive: true,
      },
    });
    console.log(`✅ Leave Template Created: ${template.name} (ID: ${template.id})\n`);

    // 2. Create Leave Types
    console.log('🏖️ Creating Leave Types...');
    
    const leaveTypes = [
      {
        code: 'CL',
        name: 'Casual Leave',
        description: 'Short-term leave for personal matters',
        annualQuota: 12,
        carryForward: false,
        maxCarryForward: 0,
        encashable: false,
        maxEncashment: 0,
        minDaysNotice: 1,
        maxConsecutiveDays: 3,
        canApplyHalfDay: true,
        requiresDocument: false,
        requiresL1Approval: true,
        requiresL2Approval: false,
        isPaid: true,
        applySandwichRule: true,
      },
      {
        code: 'EL',
        name: 'Earned Leave',
        description: 'Annual earned leave with carry forward',
        annualQuota: 15,
        carryForward: true,
        maxCarryForward: 15,
        encashable: true,
        maxEncashment: 10,
        minDaysNotice: 3,
        maxConsecutiveDays: null,
        canApplyHalfDay: true,
        requiresDocument: false,
        requiresL1Approval: true,
        requiresL2Approval: true,
        isPaid: true,
        applySandwichRule: false,
      },
      {
        code: 'SL',
        name: 'Sick Leave',
        description: 'Leave for medical reasons',
        annualQuota: 10,
        carryForward: false,
        maxCarryForward: 0,
        encashable: false,
        maxEncashment: 0,
        minDaysNotice: 0,
        maxConsecutiveDays: null,
        canApplyHalfDay: true,
        requiresDocument: false,
        documentRequiredAfter: 3,
        requiresL1Approval: true,
        requiresL2Approval: false,
        isPaid: true,
        applySandwichRule: false,
      },
      {
        code: 'LOP',
        name: 'Loss of Pay',
        description: 'Unpaid leave when other leaves are exhausted',
        annualQuota: 365,
        carryForward: false,
        maxCarryForward: 0,
        encashable: false,
        maxEncashment: 0,
        minDaysNotice: 1,
        maxConsecutiveDays: null,
        canApplyHalfDay: true,
        requiresDocument: false,
        requiresL1Approval: true,
        requiresL2Approval: true,
        isPaid: false,
        applySandwichRule: false,
      },
    ];

    for (const lt of leaveTypes) {
      const leaveType = await prisma.leaveType.upsert({
        where: { code: lt.code },
        update: {},
        create: {
          ...lt,
          leaveTemplateId: template.id,
        },
      });
      console.log(`  ✅ ${leaveType.name} (${leaveType.code}): ${leaveType.annualQuota} days, ${leaveType.isPaid ? 'Paid' : 'Unpaid'}${leaveType.carryForward ? ', Carry Forward' : ', No Carry Forward'}`);
    }

    console.log('\n🎉 Creating Holiday Calendar 2026...');
    
    // 3. Create Major Indian Holidays for 2026
    const holidays = [
      {
        name: 'Republic Day',
        date: new Date('2026-01-26'),
        type: 'NATIONAL',
        description: 'Republic Day of India',
        isOptional: false,
        applicableStates: [],
        year: 2026,
      },
      {
        name: 'Independence Day',
        date: new Date('2026-08-15'),
        type: 'NATIONAL',
        description: 'Independence Day of India',
        isOptional: false,
        applicableStates: [],
        year: 2026,
      },
      {
        name: 'Gandhi Jayanti',
        date: new Date('2026-10-02'),
        type: 'NATIONAL',
        description: 'Mahatma Gandhi Birthday',
        isOptional: false,
        applicableStates: [],
        year: 2026,
      },
      {
        name: 'Diwali',
        date: new Date('2026-10-31'),
        type: 'NATIONAL',
        description: 'Festival of Lights',
        isOptional: false,
        applicableStates: [],
        year: 2026,
      },
      {
        name: 'Holi',
        date: new Date('2026-03-06'),
        type: 'NATIONAL',
        description: 'Festival of Colors',
        isOptional: false,
        applicableStates: [],
        year: 2026,
      },
      {
        name: 'Christmas',
        date: new Date('2026-12-25'),
        type: 'NATIONAL',
        description: 'Christmas Day',
        isOptional: false,
        applicableStates: [],
        year: 2026,
      },
    ];

    for (const holiday of holidays) {
      const h = await prisma.holiday.upsert({
        where: {
          id: 0, // Dummy for upsert; we'll use create-or-skip logic
        },
        update: {},
        create: holiday,
      }).catch(() => 
        prisma.holiday.findFirst({
          where: {
            name: holiday.name,
            date: holiday.date,
            year: holiday.year,
          }
        })
      );
      if (h) {
        console.log(`  🎊 ${h.name}: ${h.date.toISOString().split('T')[0]} (${h.type})`);
      }
    }

    console.log('\n✅ Leave Management Seeding Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Leave Template: 1 (Standard Policy 2026)`);
    console.log(`  - Leave Types: 4 (CL, EL, SL, LOP)`);
    console.log(`  - Holidays: 6 (Major Indian holidays for 2026)`);

  } catch (error) {
    console.error('❌ Error seeding leave management:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedLeaves()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
