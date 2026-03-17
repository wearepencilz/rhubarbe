"use client";

import type { KeyboardEvent, ReactNode, RefAttributes } from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchLg } from "@untitledui/icons";
import { useFilter } from "react-aria";
import type { Key } from "react-aria-components";
import type { ListData } from "react-stately";
import { useListData } from "react-stately";
import type { IconComponentType } from "@/app/admin/components/ui/select/types";
import { HintText } from "@/app/admin/components/ui/input/hint-text";
import { Label } from "@/app/admin/components/ui/input/label";
import { type SelectItemType, sizes } from "@/app/admin/components/ui/select/select-base";
import { TagCloseX } from "@/app/admin/components/ui/tags/tag-close-x";
import { cx } from "@/app/admin/components/utils/cx";
import { SelectItem } from "./select-item";

// Keep these exports so existing imports don't break
export { SelectItem };

interface MultiSelectProps {
    hint?: ReactNode;
    label?: string;
    tooltip?: string;
    size?: "sm" | "md";
    placeholder?: string;
    shortcut?: boolean;
    items?: SelectItemType[];
    popoverClassName?: string;
    shortcutClassName?: string;
    selectedItems: ListData<SelectItemType>;
    placeholderIcon?: IconComponentType | null;
    isRequired?: boolean;
    isDisabled?: boolean;
    isInvalid?: boolean;
    name?: string;
    className?: string;
    "aria-label"?: string;
    children?: ReactNode | ((item: SelectItemType) => ReactNode);
    onItemCleared?: (key: Key) => void;
    onItemInserted?: (key: Key) => void;
}

export const MultiSelectBase = ({
    items = [],
    size = "sm",
    selectedItems,
    onItemCleared,
    onItemInserted,
    placeholder = "Search",
    ...props
}: MultiSelectProps) => {
    const { contains } = useFilter({ sensitivity: "base" });
    const [isOpen, setIsOpen] = useState(false);
    const [filterText, setFilterText] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedKeys = selectedItems.items.map((item) => item.id);

    const filteredItems = items.filter((item) => {
        if (selectedKeys.includes(item.id)) return false;
        if (!filterText) return true;
        return contains(item.label || item.supportingText || "", filterText);
    });

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
    }, []);

    const openDropdown = useCallback(() => {
        updatePosition();
        setIsOpen(true);
    }, [updatePosition]);

    const onRemove = useCallback(
        (key: Key) => {
            selectedItems.remove(key);
            onItemCleared?.(key);
        },
        [selectedItems, onItemCleared],
    );

    const onSelect = useCallback(
        (item: SelectItemType) => {
            if (!selectedKeys.includes(item.id)) {
                selectedItems.append(item);
                onItemInserted?.(item.id);
            }
            setFilterText("");
            inputRef.current?.focus();
        },
        [selectedItems, selectedKeys, onItemInserted],
    );

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return;
        const handleMouseDown = (e: MouseEvent) => {
            const dropdownEl = document.getElementById("multi-select-portal-dropdown");
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                dropdownEl && !dropdownEl.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setFilterText("");
            }
        };
        document.addEventListener("mousedown", handleMouseDown);
        return () => document.removeEventListener("mousedown", handleMouseDown);
    }, [isOpen]);

    // Update position on scroll/resize while open
    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen, updatePosition]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Escape") { setIsOpen(false); setFilterText(""); }
        if (e.key === "Backspace" && filterText === "" && selectedItems.items.length > 0) {
            const last = selectedItems.items[selectedItems.items.length - 1];
            onRemove(last.id);
        }
    };

    const isSelectionEmpty = selectedItems.items.length === 0;
    const Icon = props.placeholderIcon !== null ? (props.placeholderIcon ?? SearchLg) : null;

    return (
        <div className={cx("flex flex-col gap-1.5", props.className)}>
            {props.label && (
                <Label isRequired={props.isRequired} tooltip={props.tooltip}>
                    {props.label}
                </Label>
            )}

            {/* Trigger — measured for dropdown position */}
            <div
                ref={triggerRef}
                onClick={() => { if (!props.isDisabled) { openDropdown(); inputRef.current?.focus(); } }}
                className={cx(
                    "flex w-full flex-wrap items-center gap-1.5 rounded-lg bg-primary shadow-xs ring-1 ring-inset transition duration-100 ease-linear cursor-text",
                    props.isDisabled ? "cursor-not-allowed bg-disabled_subtle ring-primary" : "ring-primary",
                    isOpen ? "ring-2 ring-brand" : "",
                    sizes[size].root,
                )}
            >
                {Icon && <Icon className="pointer-events-none size-5 shrink-0 text-fg-quaternary" />}

                {!isSelectionEmpty && selectedItems.items.map((item) => (
                    <span key={item.id} className="flex items-center rounded-md bg-primary py-0.5 pr-1 pl-1.25 ring-1 ring-primary ring-inset">
                        <p className="truncate text-sm font-medium whitespace-nowrap text-secondary select-none">{item.label}</p>
                        <TagCloseX
                            size="md"
                            isDisabled={props.isDisabled}
                            className="ml-0.75"
                            onPress={() => onRemove(item.id)}
                        />
                    </span>
                ))}

                <input
                    ref={inputRef}
                    type="text"
                    value={filterText}
                    placeholder={isSelectionEmpty ? placeholder : ""}
                    disabled={props.isDisabled}
                    onChange={(e) => { setFilterText(e.target.value); openDropdown(); }}
                    onFocus={openDropdown}
                    onKeyDown={handleKeyDown}
                    className="min-w-[80px] flex-1 appearance-none bg-transparent text-sm text-primary caret-alpha-black/90 outline-none placeholder:text-placeholder disabled:cursor-not-allowed disabled:text-disabled disabled:placeholder:text-disabled"
                />
            </div>

            {/* Portal dropdown — renders into body at exact trigger coordinates */}
            {isOpen && filteredItems.length > 0 && typeof document !== "undefined" && createPortal(
                <div
                    id="multi-select-portal-dropdown"
                    style={{
                        position: "absolute",
                        top: dropdownStyle.top,
                        left: dropdownStyle.left,
                        width: dropdownStyle.width,
                        zIndex: 9999,
                    }}
                    className={cx(
                        "max-h-64 overflow-y-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/10",
                        props.popoverClassName,
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {filteredItems.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelect(item)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                        >
                            <span className="flex-1 font-medium">{item.label}</span>
                            {item.supportingText && (
                                <span className="text-xs text-gray-500">{item.supportingText}</span>
                            )}
                        </button>
                    ))}
                </div>,
                document.body,
            )}

            {props.hint && <HintText isInvalid={props.isInvalid}>{props.hint}</HintText>}
        </div>
    );
};

// Stub kept for backward compat
export const MultiSelectTagsValue = ({ size = "sm", placeholder }: { size?: "sm" | "md"; placeholder?: string; shortcut?: boolean; shortcutClassName?: string; placeholderIcon?: IconComponentType | null; isDisabled?: boolean }) => {
    return (
        <div className={cx("flex w-full items-center gap-2 rounded-lg bg-primary shadow-xs ring-1 ring-primary ring-inset", sizes[size].root)}>
            <SearchLg className="pointer-events-none size-5 text-fg-quaternary" />
            <input placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-placeholder" />
        </div>
    );
};

const UntitledMultiSelect = MultiSelectBase as typeof MultiSelectBase & {
    Item: typeof SelectItem;
};

UntitledMultiSelect.Item = SelectItem;

export { UntitledMultiSelect as UntitledMultiSelect };
