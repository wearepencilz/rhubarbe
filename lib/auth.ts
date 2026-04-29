import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';

/**
 * Drop-in replacement for the old NextAuth `auth()`.
 * Returns a session-like object or null if unauthenticated.
 */
export async function auth() {
  const { userId, sessionClaims } = await clerkAuth();
  if (!userId) return null;

  // Read role from publicMetadata directly — sessionClaims.metadata is only
  // populated when a custom JWT template is configured in Clerk.
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const meta = (clerkUser.publicMetadata ?? {}) as Record<string, unknown>;

  return {
    user: {
      id: userId,
      name: (sessionClaims?.name as string) ?? '',
      email: (sessionClaims?.email as string) ?? '',
      role: (meta.role as string) ?? 'admin',
    },
  };
}
