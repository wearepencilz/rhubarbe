"use client";

import type { ReactNode } from "react";
import { cx } from "@/app/admin/components/utils/cx";
import { Dot } from "./dot-icon";
import type { BadgeColors, BadgeTypeToColorMap, BadgeTypes, Sizes } from "./badge-types";
import { badgeTypes } from "./badge-types";

export const filledColors: Record<BadgeColors, { root: string; addon: string; addonButton: string }> = {
    gray: {
        root: "bg-gray-50 text-gray-700 ring-gray-200",
        addon: "text-gray-500",
        addonButton: "hover:bg-gray-100 text-gray-400 hover:text-gray-500",
    },
    brand: {
        root: "bg-primary-50 text-primary-700 ring-primary-200",
        addon: "text-primary-500",
        addonButton: "hover:bg-primary-100 text-primary-400 hover:text-primary-500",
    },
    error: {
        root: "bg-error-50 text-error-700 ring-error-200",
        addon: "text-error-500",
        addonButton: "hover:bg-error-100 text-error-400 hover:text-error-500",
    },
    warning: {
        root: "bg-warning-50 text-warning-700 ring-warning-200",
        addon: "text-warning-500",
        addonButton: "hover:bg-warning-100 text-warning-400 hover:text-warning-500",
    },
    success: {
        root: "bg-success-50 text-success-700 ring-success-200",
        addon: "text-success-500",
        addonButton: "hover:bg-success-100 text-success-400 hover:text-success-500",
    },
    "gray-blue": {
        root: "bg-slate-50 text-slate-700 ring-slate-200",
        addon: "text-slate-500",
        addonButton: "hover:bg-slate-100 text-slate-400 hover:text-slate-500",
    },
    "blue-light": {
        root: "bg-sky-50 text-sky-700 ring-sky-200",
        addon: "text-sky-500",
        addonButton: "hover:bg-sky-100 text-sky-400 hover:text-sky-500",
    },
    blue: {
        root: "bg-blue-50 text-blue-700 ring-blue-200",
        addon: "text-blue-500",
        addonButton: "hover:bg-blue-100 text-blue-400 hover:text-blue-500",
    },
    indigo: {
        root: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        addon: "text-indigo-500",
        addonButton: "hover:bg-indigo-100 text-indigo-400 hover:text-indigo-500",
    },
    purple: {
        root: "bg-purple-50 text-purple-700 ring-purple-200",
        addon: "text-purple-500",
        addonButton: "hover:bg-purple-100 text-purple-400 hover:text-purple-500",
    },
    pink: {
        root: "bg-pink-50 text-pink-700 ring-pink-200",
        addon: "text-pink-500",
        addonButton: "hover:bg-pink-100 text-pink-400 hover:text-pink-500",
    },
    orange: {
        root: "bg-orange-50 text-orange-700 ring-orange-200",
        addon: "text-orange-500",
        addonButton: "hover:bg-orange-100 text-orange-400 hover:text-orange-500",
    },
};

const withPillTypes = {
    [badgeTypes.pillColor]: {
        common: "size-max flex items-center whitespace-nowrap rounded-full ring-1 ring-inset",
        styles: filledColors,
    },
    [badgeTypes.badgeColor]: {
        common: "size-max flex items-center whitespace-nowrap rounded-md ring-1 ring-inset",
        styles: filledColors,
    },
    [badgeTypes.badgeModern]: {
        common: "size-max flex items-center whitespace-nowrap rounded-md ring-1 ring-inset shadow-xs",
        styles: {
            gray: {
                root: "bg-primary text-secondary ring-primary",
                addon: "text-gray-500",
                addonButton: "hover:bg-utility-gray-100 text-utility-gray-400 hover:text-utility-gray-500",
            },
        },
    },
};

export type BadgeColor<T extends BadgeTypes> = BadgeTypeToColorMap<typeof withPillTypes>[T];

interface BadgeProps<T extends BadgeTypes> {
    type?: T;
    size?: Sizes;
    color?: BadgeColor<T>;
    children: ReactNode;
    className?: string;
}

export const Badge = <T extends BadgeTypes>(props: BadgeProps<T>) => {
    const { type = "pill-color", size = "md", color = "gray", children } = props;
    const colors = withPillTypes[type];

    const pillSizes = {
        sm: "py-0.5 px-2 text-xs font-medium",
        md: "py-0.5 px-2.5 text-sm font-medium",
        lg: "py-1 px-3 text-sm font-medium",
    };
    const badgeSizes = {
        sm: "py-0.5 px-1.5 text-xs font-medium",
        md: "py-0.5 px-2 text-sm font-medium",
        lg: "py-1 px-2.5 text-sm font-medium rounded-lg",
    };

    const sizes = {
        [badgeTypes.pillColor]: pillSizes,
        [badgeTypes.badgeColor]: badgeSizes,
        [badgeTypes.badgeModern]: badgeSizes,
    };

    return <span className={cx(colors.common, sizes[type][size], colors.styles[color as keyof typeof colors.styles]?.root, props.className)}>{children}</span>;
};

interface BadgeWithDotProps<T extends BadgeTypes> {
    type?: T;
    size?: Sizes;
    color?: BadgeTypeToColorMap<typeof withPillTypes>[T];
    className?: string;
    children: ReactNode;
}

export const BadgeWithDot = <T extends BadgeTypes>(props: BadgeWithDotProps<T>) => {
    const { size = "md", color = "gray", type = "pill-color", className, children } = props;

    const colors = withPillTypes[type];

    const pillSizes = {
        sm: "gap-1 py-0.5 pl-1.5 pr-2 text-xs font-medium",
        md: "gap-1.5 py-0.5 pl-2 pr-2.5 text-sm font-medium",
        lg: "gap-1.5 py-1 pl-2.5 pr-3 text-sm font-medium",
    };
    const badgeSizes = {
        sm: "gap-1 py-0.5 px-1.5 text-xs font-medium",
        md: "gap-1.5 py-0.5 px-2 text-sm font-medium",
        lg: "gap-1.5 py-1 px-2.5 text-sm font-medium rounded-lg",
    };
    const sizes = {
        [badgeTypes.pillColor]: pillSizes,
        [badgeTypes.badgeColor]: badgeSizes,
        [badgeTypes.badgeModern]: badgeSizes,
    };

    return (
        <span className={cx(colors.common, sizes[type][size], colors.styles[color as keyof typeof colors.styles]?.root, className)}>
            <Dot className={colors.styles[color as keyof typeof colors.styles]?.addon} size="sm" />
            {children}
        </span>
    );
};
