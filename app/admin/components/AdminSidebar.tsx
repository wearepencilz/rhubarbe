'use client';

import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { NavSections } from './ui/nav/nav-sections';
import { NavUserBlock } from './ui/nav/nav-user-block';
import AdminLocaleSwitcher from './AdminLocaleSwitcher';
import type { NavSectionType } from './ui/nav/nav-sections';

const sections: NavSectionType[] = [
    {
        label: 'General',
        items: [
            { label: 'Dashboard', href: '/admin', icon: '🏠' },
        ],
    },
    {
        label: 'Products',
        items: [
            { label: 'Products', href: '/admin/products', icon: '🎁' },
        ],
    },
    {
        label: 'Ordering',
        items: [
            { label: 'Menus', href: '/admin/menus', icon: '📅' },
            { label: 'Catering', href: '/admin/volume-products', icon: '📦' },
            { label: 'Cake', href: '/admin/cake-products', icon: '🎂' },
            { label: 'Orders', href: '/admin/orders', icon: '🧾' },
            { label: 'Pickup Locations', href: '/admin/pickup-locations', icon: '📍' },
        ],
    },
    {
        label: 'Content',
        items: [
            { label: 'Journal', href: '/admin/journal', icon: '📖' },
            { label: 'Recipes', href: '/admin/recipes', icon: '🍳' },
            { label: 'FAQs', href: '/admin/faqs', icon: '❓' },
            { label: 'Pages', href: '/admin/pages', icon: '📄' },
            { label: 'Requests', href: '/admin/requests', icon: '📬' },
        ],
    },
    {
        label: 'System',
        items: [
            { label: 'Design', href: '/admin/design', icon: '🎨' },
            { label: 'Users', href: '/admin/users', icon: '👤' },
            { label: 'Taxonomies', href: '/admin/taxonomies', icon: '🏷️' },
            { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
        ],
    },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const role = ((user?.publicMetadata as any)?.role ?? 'admin') as string;
    const [logoError, setLogoError] = useState(false);

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
                {logoError ? (
                    <span className="text-lg font-semibold text-gray-900">Rhubarbe CMS</span>
                ) : (
                    <Image
                        src="/uploads/1773788582982-logo.svg"
                        alt="Rhubarbe CMS"
                        width={120}
                        height={32}
                        className="h-8 w-auto object-contain"
                        onError={() => setLogoError(true)}
                    />
                )}
            </div>

            <div className="flex-1 overflow-y-auto">
                <NavSections items={sections} activeUrl={activeUrl} />
            </div>

            <div className="border-t border-gray-200 p-3">
                {user && (
                    <NavUserBlock
                        name={user.fullName ?? 'Admin'}
                        username={user.username ?? user.primaryEmailAddress?.emailAddress ?? 'admin'}
                        role={role}
                    />
                )}
            </div>
        </aside>
    );
}
