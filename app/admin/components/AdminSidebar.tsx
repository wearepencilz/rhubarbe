'use client';

import Image from 'next/image';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import type { NavSectionType } from './ui/nav/nav-sections';

const sections: NavSectionType[] = [
    { label: 'General', items: [{ label: 'Dashboard', href: '/admin', icon: '🏠' }] },
    { label: 'Products', items: [{ label: 'Products', href: '/admin/products', icon: '🎁' }] },
    { label: 'Ordering', items: [
        { label: 'Menus', href: '/admin/menus', icon: '📅' },
        { label: 'Catering', href: '/admin/volume-products', icon: '📦' },
        { label: 'Cake', href: '/admin/cake-products', icon: '🎂' },
        { label: 'Orders', href: '/admin/orders', icon: '🧾' },
        { label: 'Pickup Locations', href: '/admin/pickup-locations', icon: '📍' },
    ]},
    { label: 'Content', items: [
        { label: 'Journal', href: '/admin/journal', icon: '📖' },
        { label: 'Recipes', href: '/admin/recipes', icon: '🍳' },
        { label: 'FAQs', href: '/admin/faqs', icon: '❓' },
        { label: 'Pages', href: '/admin/pages', icon: '📄' },
        { label: 'Requests', href: '/admin/requests', icon: '📬' },
    ]},
    { label: 'System', items: [
        { label: 'Design', href: '/admin/design', icon: '🎨' },
        { label: 'Translations', href: '/admin/translations', icon: '🌐' },
        { label: 'Users', href: '/admin/users', icon: '👤' },
        { label: 'Taxonomies', href: '/admin/taxonomies', icon: '🏷️' },
        { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
    ]},
];

import { useSidebar } from '@/contexts/SidebarContext';

export default function AdminSidebar() {
    const pathname = usePathname();
    const { user } = useUser();
    const { signOut } = useClerk();
    const { expanded, setExpanded } = useSidebar();
    const [logoError, setLogoError] = useState(false);

    const activeUrl = pathname === '/admin'
        ? '/admin'
        : sections.flatMap((s) => s.items).find((item) => item.href !== '/admin' && item.href && (pathname?.startsWith(item.href + '/') || pathname === item.href))?.href;

    return (
        <aside
            className={`fixed top-4 left-4 bottom-4 z-40 flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 transition-all duration-200 overflow-hidden ${expanded ? 'w-[240px]' : 'w-[56px]'}`}
        >
            {/* Toggle + Logo */}
            <button onClick={() => setExpanded(!expanded)} className={`flex items-center h-14 shrink-0 border-b border-gray-100 w-full ${expanded ? 'px-5 justify-between' : 'justify-center'}`}>
                {expanded ? (
                    <>
                        {logoError ? (
                            <span className="text-sm font-semibold text-gray-900">Rhubarbe</span>
                        ) : (
                            <Image src="/uploads/1773788582982-logo.svg" alt="Rhubarbe" width={100} height={28} className="h-7 w-auto object-contain" onError={() => setLogoError(true)} />
                        )}
                        <span className="text-gray-400 text-xs">✕</span>
                    </>
                ) : (
                    <span className="text-lg">☰</span>
                )}
            </button>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2">
                {sections.map((section) => (
                    <div key={section.label} className="mb-1">
                        {expanded && <p className="px-5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{section.label}</p>}
                        {section.items.map((item) => {
                            const isActive = activeUrl === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href!}
                                    className={`flex items-center gap-3 mx-2 rounded-lg transition-colors ${expanded ? 'px-3 py-2' : 'justify-center py-2'} ${isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                                    title={expanded ? undefined : item.label}
                                >
                                    <span className="text-base shrink-0">{item.icon as string}</span>
                                    {expanded && <span className="text-sm font-medium truncate">{item.label}</span>}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User */}
            {user && (
                <div className={`border-t border-gray-100 py-3 ${expanded ? 'px-4' : 'flex flex-col items-center gap-2'}`}>
                    {expanded ? (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                {user.imageUrl && <img src={user.imageUrl} alt="" className="w-7 h-7 rounded-full" />}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-900 truncate">{user.fullName || 'Admin'}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{user.primaryEmailAddress?.emailAddress}</p>
                                </div>
                            </div>
                            <button onClick={() => signOut()} className="w-full text-left text-xs text-gray-500 hover:text-red-600 transition-colors py-1">
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <button onClick={() => signOut()} className="text-base text-gray-400 hover:text-red-500" title="Sign out">
                            🚪
                        </button>
                    )}
                </div>
            )}
        </aside>
    );
}
