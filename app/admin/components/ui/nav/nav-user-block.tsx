"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { signOut } from "next-auth/react";
import { LogOut01, Settings01, ChevronSelectorVertical } from "@untitledui/icons";
import { cx } from "@/app/admin/components/utils/cx";
import Link from "next/link";

interface NavUserBlockProps {
  name: string;
  username: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

interface PopoverPos { top: number; left: number; width: number }

export function NavUserBlock({ name, username, role }: NavUserBlockProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<PopoverPos | null>(null);

  const roleLabel = ROLE_LABELS[role] ?? role;

  // Calculate position above the trigger
  const updatePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 8, // will be adjusted after render via transform
      left: rect.left,
      width: rect.width,
    });
  };

  const toggle = () => {
    if (!open) updatePos();
    setOpen((v) => !v);
  };

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: PointerEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const popover = open && pos ? (
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        left: pos.left,
        width: pos.width,
        // anchor to bottom of popover = top of trigger - 8px gap
        top: pos.top,
        transform: "translateY(-100%)",
        zIndex: 9999,
      }}
      className="rounded-xl border border-gray-200 bg-white shadow-xl"
    >
      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          <p className="truncate text-xs text-gray-500">@{username}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="p-1">
        <Link
          href="/admin/settings/users"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings01 className="size-4 shrink-0 text-gray-400" />
          Manage users
        </Link>
      </div>

      <div className="border-t border-gray-100 p-1">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut01 className="size-4 shrink-0 text-gray-400" />
          Sign out
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      {typeof window !== "undefined" && createPortal(popover, document.body)}

      <button
        ref={triggerRef}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cx(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 outline-none transition-colors",
          "hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-blue-500",
          open && "bg-gray-50"
        )}
      >
        <Avatar name={name} />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
          <p className="truncate text-xs text-gray-500">{roleLabel}</p>
        </div>
        <ChevronSelectorVertical className="size-4 shrink-0 text-gray-400" />
      </button>
    </div>
  );
}
