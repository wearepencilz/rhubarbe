import NextAuth, { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { byUsername, verifyPassword, ensureDefaultUser, type UserRole } from './db/queries/users';

export const authOptions: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          // Ensure at least one user exists
          await ensureDefaultUser();

          const user = await byUsername(credentials.username as string);
          if (!user || !user.active) return null;

          const valid = await verifyPassword(user, credentials.password as string);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error('[Auth] authorize error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days — persistent login via cookie
  },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role as UserRole;
      }
      return session;
    },
    authorized: async ({ auth }) => {
      return !!auth;
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions);
