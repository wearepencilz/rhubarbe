"use client";

import type { FC, HTMLAttributes, ReactNode } from "react";
import { cx } from "@/app/admin/components/utils/cx";
import { NavItemBase } from "./nav-item";

export interface NavSectionItemType {
    label: string;
    href?: string;
    icon?: FC<HTMLAttributes<HTMLOrSVGElement>> | string;
    badge?: ReactNode;
}

export interface NavSectionType {
    label: string;
    items: NavSectionItemType[];
}

interface NavSectionsProps {
    activeUrl?: string;
    items: NavSectionType[];
    className?: string;
}

export const NavSections = ({ activeUrl, items, className }: NavSectionsProps) => {
    return (
        <nav className={cx("flex flex-col gap-1 px-2 lg:px-4 py-4", className)}>
            {items.map((section, i) => (
                <div key={section.label} className={cx(i > 0 && "mt-2")}>
                    <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {section.label}
                    </p>
                    <ul className="flex flex-col gap-0.5">
                        {section.items.map((item) => (
                            <li key={item.label}>
                                <NavItemBase
                                    type="link"
                                    href={item.href}
                                    icon={item.icon}
                                    badge={item.badge}
                                    current={
                                        item.href === "/admin"
                                            ? activeUrl === "/admin"
                                            : !!item.href && activeUrl === item.href
                                    }
                                >
                                    {item.label}
                                </NavItemBase>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </nav>
    );
};
