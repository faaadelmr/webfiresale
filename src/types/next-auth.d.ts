import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
      avatar?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
      dateOfBirth?: string | null;
      gender?: string | null;
      role?: string;
      isVerified?: boolean;
    } & DefaultSession['user'];
  }
}