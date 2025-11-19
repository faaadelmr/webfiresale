import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdminUsers() {
  try {
    console.log('Starting user seeding...');
    
    // Hash passwords
    const superadminPassword = await bcrypt.hash('Superadmin123!', 10);
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const customerPassword = await bcrypt.hash('Customer123!', 10);
    
    // Create superadmin user
    const superadmin = await prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: {
        role: 'superadmin',
        name: 'Super Admin',
        provider: 'credentials',
      },
      create: {
        email: 'superadmin@example.com',
        password: superadminPassword,
        name: 'Super Admin',
        role: 'superadmin',
        provider: 'credentials',
      },
    });
    
    console.log(`Superadmin user created/updated: ${superadmin.email} with role ${superadmin.role}`);
    
    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        role: 'admin',
        name: 'Admin User',
        provider: 'credentials',
      },
      create: {
        email: 'admin@example.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'admin',
        provider: 'credentials',
      },
    });
    
    console.log(`Admin user created/updated: ${admin.email} with role ${admin.role}`);
    
    // Create customer user
    const customer = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {
        role: 'customer',
        name: 'Customer User',
        provider: 'credentials',
      },
      create: {
        email: 'customer@example.com',
        password: customerPassword,
        name: 'Customer User',
        role: 'customer',
        provider: 'credentials',
      },
    });
    
    console.log(`Customer user created/updated: ${customer.email} with role ${customer.role}`);
    
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAdminUsers()
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedAdminUsers;