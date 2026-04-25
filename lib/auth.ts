import { auth as clerkAuth } from '@clerk/nextjs/server';

/**
 * Drop-in replacement for the old NextAuth `auth()`.
 * Returns a session-like object or null if unauthenticated.
 */
export async function auth() {
  const { userId, sessionClaims } = await clerkAuth();
  if (!userId) return null;

  const meta = (sessionClaims?.metadata ?? {}) as Record<string, unknown>;
  return {
    user: {
      id: userId,
      name: (sessionClaims?.name as string) ?? '',
      email: (sessionClaims?.email as string) ?? '',
      role: (meta.role as string) ?? 'admin',
    },
  };
}
