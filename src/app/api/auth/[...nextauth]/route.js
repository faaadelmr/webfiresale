import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    CredentialsProvider({
      name: 'Admin',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Check if the credentials match the admin credentials from environment variables
        const adminUser = process.env.USERADMIN;
        const adminPass = process.env.PASSADMIN;
        
        if (
          credentials?.username === adminUser && 
          credentials?.password === adminPass
        ) {
          // Find or create admin user in database
          let adminUserRecord = await prisma.user.findUnique({
            where: { email: 'admin@flashfire.com' }, // Use a default admin email
          });
          
          if (!adminUserRecord) {
            adminUserRecord = await prisma.user.create({
              data: {
                name: 'Admin',
                email: 'admin@flashfire.com',
                role: 'ADMIN',
              }
            });
          } else {
            // Update role in case it's not already ADMIN
            if (adminUserRecord.role !== 'ADMIN') {
              adminUserRecord = await prisma.user.update({
                where: { id: adminUserRecord.id },
                data: { role: 'ADMIN' }
              });
            }
          }
          
          return {
            id: adminUserRecord.id,
            name: adminUserRecord.name,
            email: adminUserRecord.email,
            role: adminUserRecord.role,
          };
        }
        
        return null; // Return null if credentials don't match
      }
    }),
    CredentialsProvider({
      name: 'User',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Check if the credentials match the admin credentials from environment variables
        const adminUser = process.env.USERADMIN;
        const adminPass = process.env.PASSADMIN;
        
        if (credentials?.email === adminUser && credentials?.password === adminPass) {
          // Find or create admin user in database
          let adminUserRecord = await prisma.user.findUnique({
            where: { email: 'admin@flashfire.com' }, // Use a default admin email
          });
          
          if (!adminUserRecord) {
            adminUserRecord = await prisma.user.create({
              data: {
                name: 'Admin',
                email: 'admin@flashfire.com',
                role: 'ADMIN',
              }
            });
          } else {
            // Update role in case it's not already ADMIN
            if (adminUserRecord.role !== 'ADMIN') {
              adminUserRecord = await prisma.user.update({
                where: { id: adminUserRecord.id },
                data: { role: 'ADMIN' }
              });
            }
          }
          
          return {
            id: adminUserRecord.id,
            name: adminUserRecord.name,
            email: adminUserRecord.email,
            role: adminUserRecord.role,
          };
        }
        
        // In a real application, you would validate the user's credentials against the database
        // For this example, we'll simulate finding a user
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email }
        });
        
        if (user) {
          // In a real app, you would verify the password here
          // Since we're not storing passwords in this example, we'll just return the user if found
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
        
        return null; // Return null if user not found
      }
    })
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (!session?.user) return session;
      session.user.id = user?.id ?? token?.id ?? token?.sub ?? null;
      session.user.role = user?.role ?? token?.role ?? null;
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };