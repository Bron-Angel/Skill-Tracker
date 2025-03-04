import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@auth/prisma-adapter';

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
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
        let user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          // Create a new user if they don't exist
          user = await prisma.user.create({
            data: {
              username: credentials.username,
              level: 0,
              experience: 0,
            },
          });
        }

        // Create a new session for the user
        await prisma.session.create({
          data: {
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });

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