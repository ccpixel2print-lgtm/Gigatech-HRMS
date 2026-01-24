import { prisma } from '../lib/prisma.js';

async function updateEmployee() {
  try {
    await prisma.$executeRawUnsafe("UPDATE employees SET status = 'PUBLISHED' WHERE id = 1");
    console.log('✅ Updated employee 1 to PUBLISHED');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmployee();
