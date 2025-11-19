// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import InstagramProvider from 'next-auth/providers/instagram'
import { validateUser, findOrCreateOAuthUser } from '@/lib/auth'
import { authSettings } from '@/lib/authSettings'
import prisma from '@/lib/prisma'

// Build dynamic providers array based on authSettings
const providers = [];

// Add Credentials provider if enabled
if (authSettings.providers.credentials) {
  providers.push(
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await validateUser(credentials.email, credentials.password)

        if (!user) {
          return null
        }

        return user
      }
    })
  );
}

// Add Google provider if enabled
if (authSettings.providers.google) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

// Add Facebook provider if enabled
if (authSettings.providers.facebook) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  );
}

// Add Instagram provider if enabled
if (authSettings.providers.instagram) {
  providers.push(
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
    })
  );
}

export const authOptions = {
  providers,
  callbacks: {
    async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      // Initial sign-in or user creation
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.provider = user.provider || (account ? account.provider : 'credentials');

        // For new users (not yet in database), we pass role from validateUser/findOrCreateOAuthUser
        if (user.role) {
          token.role = user.role;
        }
      }
      // Subsequent token refreshes - fetch user data from database
      else if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name || dbUser.email.split('@')[0]; // Use email prefix as name if not set
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.provider = dbUser.provider;
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.provider = token.provider;
        session.user.role = token.role;
      }

      return session;
    },
    async signIn(params: {
      user: any;
      account: any;
      profile?: any;
      email?: { verificationRequest?: boolean };
      credentials?: any
    }) {
      const { user, account, profile, email } = params;

      // Handle OAuth sign-in
      if (account?.provider && account.provider !== 'credentials' && profile) {
        try {
          // Check if the user has an email address
          if (!profile?.email) {
            console.error('OAuth profile missing email:', profile);
            return false;
          }

          // Find or create user in database
          const oauthUser = await findOrCreateOAuthUser(profile, account.provider);

          // Optional: You can return false to reject the sign-in if needed
          // For example, if you want to block certain email domains:
          // if (profile.email && profile.email.endsWith('@blockeddomain.com')) return false;

          return true; // Allow sign in
        } catch (error) {
          console.error('OAuth sign-in error:', error);
          return false; // Reject sign in on error
        }
      }

      // For credentials sign-in, allow it to proceed through the normal flow
      return true;
    }
  },
  pages: {
    signIn: '/signin',
    signOut: '/signin',
    verifyRequest: '/signin', // Used for email verification
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Allow sign-in for OAuth without email verification requirement
  // This is handled through the signIn callback instead
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }