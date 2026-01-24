import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SALT_ROUNDS = 10
const DEFAULT_PASSWORD = '1234'

async function main() {
  console.log('🌱 Starting seed process...\n')

  // 1. Create System Roles
  console.log('📝 Creating system roles...')
  
  const roles = [
    { name: 'ADMIN', description: 'System Administrator with full access' },
    { name: 'HR_MANAGER', description: 'HR Manager with employee and payroll management access' },
    { name: 'TEAM_LEAD', description: 'Team Lead with team management and approval access' },
    { name: 'EMPLOYEE', description: 'Regular employee with basic access' },
  ]

  const createdRoles = []
  for (const role of roles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name }
    })

    if (existingRole) {
      console.log(`   ✓ Role "${role.name}" already exists`)
      createdRoles.push(existingRole)
    } else {
      const newRole = await prisma.role.create({
        data: role
      })
      console.log(`   ✅ Created role: ${role.name}`)
      createdRoles.push(newRole)
    }
  }

  // 2. Hash the default password
  console.log('\n🔐 Hashing default password...')
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS)
  console.log('   ✅ Password hashed')

  // 3. Create Default Users
  console.log('\n👥 Creating default users...\n')
  
  const users = [
    {
      email: 'admin@gigatech.com',
      fullName: 'System Administrator',
      roleName: 'ADMIN'
    },
    {
      email: 'hr@gigatech.com',
      fullName: 'HR Manager',
      roleName: 'HR_MANAGER'
    },
    {
      email: 'teamlead@gigatech.com',
      fullName: 'Team Lead',
      roleName: 'TEAM_LEAD'
    },
    {
      email: 'employee@gigatech.com',
      fullName: 'Employee User',
      roleName: 'EMPLOYEE'
    }
  ]

  for (const userData of users) {
    const role = createdRoles.find(r => r.name === userData.roleName)
    
    if (!role) {
      console.error(`   ❌ Role "${userData.roleName}" not found`)
      continue
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      console.log(`   ℹ️  User "${userData.email}" already exists - skipping`)
      continue
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        fullName: userData.fullName,
        isActive: true,
        failedLoginAttempts: 0,
        userRoles: {
          create: {
            roleId: role.id
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    console.log(`   ✅ Created user: ${user.email} (${userData.roleName})`)
    console.log(`      - ID: ${user.id}`)
    console.log(`      - Full Name: ${user.fullName}`)
    console.log(`      - Password: ${DEFAULT_PASSWORD}`)
  }

  // 4. Summary
  console.log('\n' + '='.repeat(60))
  console.log('✨ Seed completed successfully!\n')
  console.log('Default Login Credentials:')
  console.log('─'.repeat(60))
  console.log('Admin:     admin@gigatech.com / 1234')
  console.log('HR:        hr@gigatech.com / 1234')
  console.log('Team Lead: teamlead@gigatech.com / 1234')
  console.log('Employee:  employee@gigatech.com / 1234')
  console.log('='.repeat(60))
  console.log('\n⚠️  IMPORTANT: Change these passwords in production!\n')
}

main()
  .catch((e) => {
    console.error('\n❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
