'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { NavSections } from './ui/nav/nav-sections';
import { NavUserBlock } from './ui/nav/nav-user-block';
import type { NavSectionType } from './ui/nav/nav-sections';

const sections: NavSectionType[] = [
    {
        label: 'General',
        items: [
            { label: 'Dashboard', href: '/admin', icon: '🏠' },
        ],
    },
    {
        label: 'Commerce',
        items: [
            { label: 'Products', href: '/admin/products', icon: '🎁' },
            { label: 'Ingredients', href: '/admin/ingredients', icon: '🌿' },
        ],
    },
    {
        label: 'Content',
        items: [
            { label: 'Stories', href: '/admin/stories', icon: '📖' },
            { label: 'News', href: '/admin/news', icon: '📰' },
            { label: 'Pages', href: '/admin/pages', icon: '📄' },
            { label: 'Requests', href: '/admin/requests', icon: '📬' },
        ],
    },
    {
        label: 'System',
        items: [
            { label: 'Users', href: '/admin/users', icon: '👤' },
            { label: 'Taxonomies', href: '/admin/taxonomies', icon: '🏷️' },
            { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
        ],
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;
    const role = ((user as any)?.role ?? 'super_admin') as string;

    const activeUrl = pathname === '/admin'
        ? '/admin'
        : sections
            .flatMap((s) => s.items)
            .find((item) => item.href !== '/admin' && item.href && (
                pathname?.startsWith(item.href + '/') || pathname === item.href
            ))?.href;

    return (
        <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-gray-200 bg-white">
            <div className="flex h-16 items-center px-6 border-b border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Rhubarbe CMS</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                <NavSections items={sections} activeUrl={activeUrl} />
            </div>

            <div className="border-t border-gray-200 p-3">
                {user && (
                    <NavUserBlock
                        name={user.name ?? 'Admin'}
                        username={(user as any).username ?? 'admin'}
                        role={role}
                    />
                )}
            </div>
        </aside>
    );
}
