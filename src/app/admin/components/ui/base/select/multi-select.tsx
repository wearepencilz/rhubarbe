"use client";

import type { FocusEventHandler, KeyboardEvent, PointerEventHandler, RefAttributes, RefObject } from "react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SearchLg } from "@untitledui/icons";
import { FocusScope, useFilter, useFocusManager } from "react-aria";
import type { ComboBoxProps as AriaComboBoxProps, GroupProps as AriaGroupProps, ListBoxProps as AriaListBoxProps, Key } from "react-aria-components";
import { ComboBox as AriaComboBox, Group as AriaGroup, Input as AriaInput, ListBox as AriaListBox, ComboBoxStateContext } from "react-aria-components";
import type { ListData } from "react-stately";
import { useListData } from "react-stately";
import { Avatar } from "@/src/app/admin/components/ui/base/avatar/avatar";
import type { IconComponentType } from "@/src/app/admin/components/ui/base/badges/badge-types";
import { HintText } from "@/src/app/admin/components/ui/base/input/hint-text";
import { Label } from "@/src/app/admin/components/ui/base/input/label";
import { type SelectItemType, sizes } from "@/src/app/admin/components/ui/base/select/select";
import { TagCloseX } from "@/src/app/admin/components/ui/base/tags/base-components/tag-close-x";
import { cx } from "@/utils/cx";
import { SelectItem } from "./select-item";

interface ComboBoxValueProps extends AriaGroupProps {
    size: "sm" | "md";
    shortcut?: boolean;
    isDisabled?: boolean;
    placeholder?: string;
    shortcutClassName?: string;
    placeholderIcon?: IconComponentType | null;
    ref?: RefObject<HTMLDivElement | null>;
    onFocus?: FocusEventHandler;
    onPointerEnter?: PointerEventHandler;
}

const ComboboxContext = createContext<{
    size: "sm" | "md";
    selectedKeys: Key[];
    selectedItems: ListData<SelectItemType>;
    onRemove: (keys: Set<Key>) => void;
    onInputChange: (value: string) => void;
}>({
    size: "sm",
    selectedKeys: [],
    selectedItems: {} as ListData<SelectItemType>,
    onRemove: () => {},
    onInputChange: () => {},
});

interface MultiSelectProps extends Omit<AriaComboBoxProps<SelectItemType>, "children" | "items">, RefAttributes<HTMLDivElement> {
    hint?: string;
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
    children: AriaListBoxProps<SelectItemType>["children"];
    onItemCleared?: (key: Key) => void;
    onItemInserted?: (key: Key) => void;
}

export const MultiSelectBase = ({
    items,
    children,
    size = "sm",
    selectedItems,
    onItemCleared,
    onItemInserted,
    shortcut,
    placeholder = "Search",
    name: _name,
    className: _className,
    ...props
}: MultiSelectProps) => {
    const { contains } = useFilter({ sensitivity: "base" });
    const selectedKeys = selectedItems.items.map((item) => item.id);
    const triggerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number } | null>(null);

    const filter = useCallback(
        (item: SelectItemType, filterText: string) => {
            return !selectedKeys.includes(item.id) && contains(item.label || item.supportingText || "", filterText);
        },
        [contains, selectedKeys],
    );

    const accessibleList = useListData({
        initialItems: items,
        filter,
    });

    const onRemove = useCallback(
        (keys: Set<Key>) => {
            const key = keys.values().next().value;
            if (!key) return;
            selectedItems.remove(key);
            onItemCleared?.(key);
        },
        [selectedItems, onItemCleared],
    );

    const onSelectionChange = (id: Key | null) => {
        if (!id) return;
        const item = accessibleList.getItem(id);
        if (!item) return;
        if (!selectedKeys.includes(id as string)) {
            selectedItems.append(item);
            onItemInserted?.(id);
        }
        accessibleList.setFilterText("");
    };

    const onInputChange = (value: string) => {
        accessibleList.setFilterText(value);
    };

    const updateDropdownPosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownStyle({
            top: rect.bottom + window.scrollY + 4,
            left: rect.left + window.scrollX,
            width: rect.width,
        });
    }, []);

    return (
        <ComboboxContext.Provider value={{ size, selectedKeys, selectedItems, onInputChange, onRemove }}>
            <AriaComboBox
                allowsEmptyCollection
                menuTrigger="focus"
                items={accessibleList.items}
                onInputChange={onInputChange}
                inputValue={accessibleList.filterText}
                selectedKey={null}
                onSelectionChange={onSelectionChange}
                onOpenChange={(open) => {
                    if (open) updateDropdownPosition();
                    props.onOpenChange?.(open);
                }}
                {...props}
            >
                {(state) => (
                    <div className="flex flex-col gap-1.5">
                        {props.label && (
                            <Label isRequired={state.isRequired} tooltip={props.tooltip}>
                                {props.label}
                            </Label>
                        )}

                        <MultiSelectTagsValue
                            size={size}
                            shortcut={shortcut}
                            ref={triggerRef}
                            placeholder={placeholder}
                            onFocus={updateDropdownPosition}
                            onPointerEnter={updateDropdownPosition}
                        />

                        {/* Portal-based dropdown: renders into document.body, positioned via getBoundingClientRect */}
                        {state.isOpen && dropdownStyle && typeof document !== "undefined" && createPortal(
                            <div
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
                            >
                                <AriaListBox selectionMode="multiple" className="size-full outline-hidden">
                                    {children}
                                </AriaListBox>
                            </div>,
                            document.body,
                        )}

                        {props.hint && <HintText isInvalid={state.isInvalid}>{props.hint}</HintText>}
                    </div>
                )}
            </AriaComboBox>
        </ComboboxContext.Provider>
    );
};

const InnerMultiSelect = ({ isDisabled, shortcut, shortcutClassName, placeholder }: Omit<MultiSelectProps, "selectedItems" | "children">) => {
    const focusManager = useFocusManager();
    const comboBoxContext = useContext(ComboboxContext);
    const comboBoxStateContext = useContext(ComboBoxStateContext);

    const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const isCaretAtStart = event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;
        if (!isCaretAtStart && event.currentTarget.value !== "") return;

        switch (event.key) {
            case "Backspace":
            case "ArrowLeft":
                focusManager?.focusPrevious({ wrap: false, tabbable: false });
                break;
            case "ArrowRight":
                focusManager?.focusNext({ wrap: false, tabbable: false });
                break;
        }
    };

    const handleInputMouseDown = (_event: React.MouseEvent<HTMLInputElement>) => {
        if (comboBoxStateContext && !comboBoxStateContext.isOpen) {
            comboBoxStateContext.open();
        }
    };

    const handleTagKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: Key) => {
        if (event.key === "Tab") return;
        event.preventDefault();

        const isFirstTag = comboBoxContext?.selectedItems?.items?.[0]?.id === value;

        switch (event.key) {
            case " ":
            case "Enter":
            case "Backspace":
                if (isFirstTag) {
                    focusManager?.focusNext({ wrap: false, tabbable: false });
                } else {
                    focusManager?.focusPrevious({ wrap: false, tabbable: false });
                }
                comboBoxContext.onRemove(new Set([value]));
                break;
            case "ArrowLeft":
                focusManager?.focusPrevious({ wrap: false, tabbable: false });
                break;
            case "ArrowRight":
                focusManager?.focusNext({ wrap: false, tabbable: false });
                break;
            case "Escape":
                comboBoxStateContext?.close();
                break;
        }
    };

    const isSelectionEmpty = comboBoxContext?.selectedItems?.items?.length === 0;

    return (
        <div className="relative flex w-full flex-1 flex-row flex-wrap items-center justify-start gap-1.5">
            {!isSelectionEmpty &&
                comboBoxContext?.selectedItems?.items?.map((value) => (
                    <span key={value.id} className="flex items-center rounded-md bg-primary py-0.5 pr-1 pl-1.25 ring-1 ring-primary ring-inset">
                        <Avatar size="xxs" alt={value?.label} src={value?.avatarUrl} />
                        <p className="ml-1.25 truncate text-sm font-medium whitespace-nowrap text-secondary select-none">{value?.label}</p>
                        <TagCloseX
                            size="md"
                            isDisabled={isDisabled}
                            className="ml-0.75"
                            onKeyDown={(event) => handleTagKeyDown(event, value.id)}
                            onPress={() => comboBoxContext.onRemove(new Set([value.id]))}
                        />
                    </span>
                ))}

            <div className={cx("relative flex min-w-[20%] flex-1 flex-row items-center", !isSelectionEmpty && "ml-0.5", shortcut && "min-w-[30%]")}>
                <AriaInput
                    placeholder={placeholder}
                    onKeyDown={handleInputKeyDown}
                    onMouseDown={handleInputMouseDown}
                    className="w-full flex-[1_0_0] appearance-none bg-transparent text-md text-ellipsis text-primary caret-alpha-black/90 outline-none placeholder:text-placeholder focus:outline-hidden disabled:cursor-not-allowed disabled:text-disabled disabled:placeholder:text-disabled"
                />
                {shortcut && (
                    <div
                        aria-hidden="true"
                        className={cx(
                            "absolute inset-y-0.5 right-0.5 z-10 flex items-center rounded-r-[inherit] bg-linear-to-r from-transparent to-bg-primary to-40% pl-8",
                            shortcutClassName,
                        )}
                    >
                        <span className={cx(
                            "pointer-events-none rounded px-1 py-px text-xs font-medium text-quaternary ring-1 ring-secondary select-none ring-inset",
                            isDisabled && "bg-transparent text-disabled",
                        )}>
                            ⌘K
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export const MultiSelectTagsValue = ({
    size,
    shortcut,
    placeholder,
    shortcutClassName,
    placeholderIcon: Icon = SearchLg,
    isDisabled: _isDisabled,
    ...otherProps
}: ComboBoxValueProps) => {
    return (
        <AriaGroup
            {...otherProps}
            className={({ isFocusWithin, isDisabled }) =>
                cx(
                    "relative flex w-full items-center gap-2 rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition duration-100 ease-linear ring-inset",
                    isDisabled && "cursor-not-allowed bg-disabled_subtle",
                    isFocusWithin && "ring-2 ring-brand",
                    sizes[size].root,
                )
            }
        >
            {({ isDisabled }) => (
                <>
                    {Icon && <Icon className="pointer-events-none size-5 text-fg-quaternary" />}
                    <FocusScope contain={false} autoFocus={false} restoreFocus={false}>
                        <InnerMultiSelect
                            isDisabled={isDisabled}
                            size={size}
                            shortcut={shortcut}
                            shortcutClassName={shortcutClassName}
                            placeholder={placeholder}
                        />
                    </FocusScope>
                </>
            )}
        </AriaGroup>
    );
};

const MultiSelect = MultiSelectBase as typeof MultiSelectBase & {
    Item: typeof SelectItem;
};

MultiSelect.Item = SelectItem;

export { MultiSelect as MultiSelect };
