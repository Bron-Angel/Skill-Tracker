import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/jsonDb';

// Add this type declaration before your NextAuth configuration
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Username',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'Enter your username' },
      },
      async authorize(credentials) {
        if (!credentials?.username) {
          return null;
        }

        // Find or create user by username
        let user = await db.user.findUnique({
          username: credentials.username,
        });

        if (!user) {
          // Create a new user if they don't exist
          user = await db.user.create({
            username: credentials.username,
            level: 0,
            experience: 0,
          });
        }

        return {
          id: user.id,
          name: user.username,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/account/new',
  },
});

export { handler as GET, handler as POST }; 