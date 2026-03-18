'use client';

import { usePathname } from 'next/navigation';

export default function PublicLayout({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdmin && header}
      {children}
      {!isAdmin && footer}
    </>
  );
}
