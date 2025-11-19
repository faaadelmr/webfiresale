import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyUsers() {
  try {
    console.log('Verifying seeded users...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Role: ${user.role}`);
    });
    
    console.log('\nVerification completed!');
  } catch (error) {
    console.error('Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifyUsers()
    .catch((error) => {
      console.error('Verification failed:', error);
      process.exit(1);
    });
}

export default verifyUsers;