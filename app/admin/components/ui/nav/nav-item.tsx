"use client";

import type { FC, HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Share04 } from "@untitledui/icons";
import { Badge } from "@/app/admin/components/ui/nav/badges";
import { cx, sortCx } from "@/app/admin/components/utils/cx";

const styles = sortCx({
    root: "group relative flex w-full cursor-pointer items-center rounded-md bg-white outline-none transition duration-100 ease-linear select-none hover:bg-gray-50 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
    rootSelected: "bg-gray-100 hover:bg-gray-100",
});

export interface NavItemBaseProps {
    iconOnly?: boolean;
    open?: boolean;
    href?: string;
    type: "link" | "collapsible" | "collapsible-child";
    icon?: FC<HTMLAttributes<HTMLOrSVGElement>> | string;
    badge?: ReactNode;
    current?: boolean;
    truncate?: boolean;
    onClick?: MouseEventHandler;
    children?: ReactNode;
}

export const NavItemBase = ({ current, type, badge, href, icon: Icon, children, truncate = true, onClick }: NavItemBaseProps) => {
    const iconElement = Icon && (
        typeof Icon === 'string'
            ? <span aria-hidden="true" className="mr-2 size-5 shrink-0 text-base leading-none">{Icon}</span>
            : <Icon aria-hidden="true" className="mr-2 size-5 shrink-0 text-gray-600 transition-inherit-all" />
    );

    const badgeElement =
        badge && (typeof badge === "string" || typeof badge === "number") ? (
            <Badge className="ml-3" color="gray" type="pill-color" size="sm">
                {badge}
            </Badge>
        ) : (
            badge
        );

    const labelElement = (
        <span className={cx("flex-1 text-md font-semibold text-gray-700 transition-inherit-all group-hover:text-gray-900", truncate && "truncate", current && "text-gray-900")}>
            {children}
        </span>
    );

    const isExternal = href && href.startsWith("http");
    const externalIcon = isExternal && <Share04 className="size-4 stroke-[2.5px] text-gray-500" />;

    if (type === "collapsible") {
        return (
            <summary className={cx("px-3 py-2", styles.root, current && styles.rootSelected)} onClick={onClick}>
                {iconElement}
                {labelElement}
                {badgeElement}
                <ChevronDown aria-hidden="true" className="ml-3 size-4 shrink-0 stroke-[2.5px] text-gray-500 in-open:-scale-y-100" />
            </summary>
        );
    }

    if (type === "collapsible-child") {
        return (
            <Link href={href!} target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : undefined}
                className={cx("py-2 pr-3 pl-10", styles.root, current && styles.rootSelected)} onClick={onClick} aria-current={current ? "page" : undefined}>
                {labelElement}
                {externalIcon}
                {badgeElement}
            </Link>
        );
    }

    return (
        <Link href={href!} target={isExternal ? "_blank" : "_self"} rel={isExternal ? "noopener noreferrer" : undefined}
            className={cx("px-3 py-2", styles.root, current && styles.rootSelected)} onClick={onClick} aria-current={current ? "page" : undefined}>
            {iconElement}
            {labelElement}
            {externalIcon}
            {badgeElement}
        </Link>
    );
};
