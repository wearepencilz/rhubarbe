# Clerk Auth Migration Spec

## Goal

Replace the self-managed NextAuth credentials provider with Clerk for the admin CMS. This gives us hosted login UI, session management, MFA, and user management without maintaining our own password hashing, login page, or JWT plumbing.

## Current State

| Concern | Current Implementation |
|---|---|
| Library | `next-auth@5.0.0-beta.30` (Auth.js v5 beta) |
| Provider | Credentials only (username + password) |
| Session | JWT, 30-day max age |
| Password storage | HMAC-SHA256 with per-user salt in Postgres `users` table |
| Roles | `super_admin`, `admin`, `editor` |
| Protected routes | `/admin/*` via `middleware.ts` |
| API auth | `await auth()` in 39 route files — POST/PUT/DELETE require session |
| Login UI | Custom `app/admin/login/page.tsx` |
| Sign out | `signOut({ callbackUrl: '/admin/login' })` in 2 components |

## Scope

- Admin CMS only (`/admin/*` routes and their API endpoints)
- The public storefront remains unauthenticated (no customer accounts yet)
- No changes to Shopify auth or webhooks

## Migration Plan

### Phase 1 — Install & Configure Clerk

1. Install `@clerk/nextjs`
2. Add env vars to `.env.local` and Vercel:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/admin/login`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/admin`
3. Wrap the app in `<ClerkProvider>` (in root layout or admin layout)
4. Configure Clerk dashboard:
   - Enable email + password sign-in (to match current UX)
   - Optionally enable Google/GitHub OAuth for team convenience
   - Set up roles: `super_admin`, `admin`, `editor` via Clerk Organizations or custom claims

### Phase 2 — Replace Middleware

Current `middleware.ts` uses `getToken()` from `next-auth/jwt`. Replace with Clerk's `clerkMiddleware()`:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

Clerk handles the redirect to sign-in automatically when `auth.protect()` fails.

### Phase 3 — Replace API Route Auth

Current pattern (39 files):
```typescript
import { auth } from '@/lib/auth';
const session = await auth();
if (!session) { return 401; }
```

New pattern:
```typescript
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();
if (!userId) { return 401; }
```

Create a helper to ease migration and preserve role checking:

```typescript
// lib/auth.ts (new)
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';

export async function requireAuth() {
  const { userId, sessionClaims } = await clerkAuth();
  if (!userId) return null;
  return {
    id: userId,
    role: (sessionClaims?.metadata as { role?: string })?.role || 'editor',
  };
}
```

Then the API routes change minimally:
```typescript
import { requireAuth } from '@/lib/auth';
const session = await requireAuth();
if (!session) { return 401; }
```

### Phase 4 — Replace Login Page

Delete `app/admin/login/page.tsx`. Replace with Clerk's `<SignIn />` component:

```typescript
// app/admin/login/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn afterSignInUrl="/admin" />
    </div>
  );
}
```

### Phase 5 — Replace Sign Out

Current: `signOut({ callbackUrl: '/admin/login' })` from `next-auth/react`.

Replace with Clerk's `<SignOutButton>` or `useClerk().signOut()`:

```typescript
import { SignOutButton } from '@clerk/nextjs';

<SignOutButton redirectUrl="/admin/login">
  <button>Sign Out</button>
</SignOutButton>
```

Update in:
- `app/admin/components/AdminNav.tsx`
- `app/admin/components/ui/nav/nav-user-block.tsx`

### Phase 6 — User Display

Replace `session.user.name` references with Clerk's `useUser()` hook or `currentUser()` server function:

```typescript
// Client components
import { useUser } from '@clerk/nextjs';
const { user } = useUser();
// user.firstName, user.lastName, user.imageUrl

// Server components / API routes
import { currentUser } from '@clerk/nextjs/server';
const user = await currentUser();
```

### Phase 7 — Cleanup

Remove:
- `next-auth` from `package.json`
- `lib/auth.ts` (old NextAuth config) — replaced by new Clerk helper
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/auth/debug/`
- Password hashing logic in `lib/db/queries/users.ts` (`hashPassword`, `verifyPassword`, `ensureDefaultUser`)
- `AUTH_SECRET` / `NEXTAUTH_SECRET` / `NEXTAUTH_URL` from env vars

Keep:
- `users` table in Postgres — but repurpose it for Clerk user metadata sync if needed, or drop the `passwordHash`/`salt` columns
- Role definitions — migrate to Clerk custom claims or Organizations

## Roles Strategy

Two options:

**Option A — Public Metadata (simpler)**
Store role in Clerk user's `publicMetadata.role`. Set via Clerk dashboard or API. Access in session claims.

**Option B — Organizations (more scalable)**
Create a Clerk Organization for the shop. Assign roles (`admin`, `editor`) as org membership roles. Better if multiple shops or teams are ever needed.

Recommendation: **Option A** for now. This is a single-shop CMS with 2–3 users.

## Database Impact

The `users` table currently stores:
- `id`, `name`, `email`, `username`, `passwordHash`, `salt`, `role`, `active`, `createdAt`, `updatedAt`

After migration:
- `passwordHash`, `salt` columns become unused — drop them in a migration
- `id` changes from our UUID to Clerk's `user_id` string — any foreign keys referencing `users.id` need updating
- Alternatively, keep the `users` table as a local profile cache synced via Clerk webhooks

## Files to Modify

| File | Change |
|---|---|
| `package.json` | Remove `next-auth`, add `@clerk/nextjs` |
| `.env.local` | Remove `NEXTAUTH_*`, `AUTH_SECRET`; add `CLERK_*` keys |
| `middleware.ts` | Replace NextAuth token check with `clerkMiddleware` |
| `lib/auth.ts` | Replace NextAuth config with Clerk `requireAuth` helper |
| `app/api/auth/[...nextauth]/route.ts` | Delete |
| `app/admin/login/page.tsx` | Replace with Clerk `<SignIn>` |
| `app/admin/components/AdminNav.tsx` | Replace `signOut` import |
| `app/admin/components/ui/nav/nav-user-block.tsx` | Replace `signOut` import + user display |
| `app/admin/layout.tsx` | Add `<ClerkProvider>` |
| 39 API route files | Replace `auth()` import and call |
| `lib/db/queries/users.ts` | Remove password functions |
| `lib/db/schema.ts` | Drop password columns from users table |

## Risks & Considerations

- **Clerk is a paid service** — free tier covers 10,000 MAU which is plenty for admin-only use (2–3 users)
- **Vendor dependency** — auth is now external; if Clerk goes down, admin is inaccessible
- **Migration window** — existing admin sessions will be invalidated; coordinate with any other admin users
- **Clerk user creation** — existing admin users need to be manually created in Clerk dashboard before go-live
- **API route changes are mechanical but numerous** — 39 files need the import swap; use find-and-replace

## Testing Checklist

- [ ] Admin login works via Clerk hosted UI
- [ ] Unauthenticated users redirected to `/admin/login`
- [ ] Authenticated users can access `/admin/*` pages
- [ ] API POST/PUT/DELETE return 401 without valid Clerk session
- [ ] API GET endpoints remain public (no auth required)
- [ ] Sign out redirects to `/admin/login`
- [ ] User name/role display correctly in admin nav
- [ ] Role-based access works (if implemented)
- [ ] Vercel deployment works with Clerk env vars
- [ ] No references to `next-auth` remain in codebase
