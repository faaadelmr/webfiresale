import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create superadmin user
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      name: 'Super Admin',
      password: await bcrypt.hash('SuperAdmin123!', 10), // Strong default password
      role: 'superadmin',
      phone: '+6281234567891',
      isVerified: true,
      isActive: true,
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('Admin123!', 10), // Strong default password
      role: 'admin',
      phone: '+6281234567892',
      isVerified: true,
      isActive: true,
    },
  });

  // Create customer user
  const customer = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Regular Customer',
      password: await bcrypt.hash('Customer123!', 10), // Strong default password
      role: 'customer',
      phone: '+6281234567893',
      isVerified: true,
      isActive: true,
    },
  });

  console.log({
    superadmin: { id: superadmin.id, email: superadmin.email, role: superadmin.role },
    admin: { id: admin.id, email: admin.email, role: admin.role },
    customer: { id: customer.id, email: customer.email, role: customer.role },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });