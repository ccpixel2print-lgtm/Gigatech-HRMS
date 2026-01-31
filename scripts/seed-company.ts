const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Seeding Companies...');

  await prisma.company.createMany({
    data: [
      { 
        name: "Gigatech Global Services Services Pvt Ltd", 
        address: "Plot No 4/2, Sector 1, RAM SVR, Huda Techno Enclave, Hi-Tech City, Madhapur, Hyderabad 500 081",
        logoUrl: "/Gigatech-logo.png", // <--- LOCAL PUBLIC FILE
        gstIn: "29AAAAA0000A1Z5"
      },
      { 
        name: "DG Tutor", 
        address: "302, Meridian Plaza, Ameerpet, Hyderabad, TS", 
        logoUrl: "/expert-guru-logo.png", // <--- REMOTE URL
        gstIn: "36BBBBB1111B1Z9"
      }
    ],
    skipDuplicates: true
  });

  console.log("✅ Companies Seeded with Hybrid Logos");
}

main().catch(console.error).finally(() => prisma.$disconnect());
