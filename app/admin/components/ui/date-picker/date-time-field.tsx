"use client";

import { useState, useRef, useEffect } from "react";
import { getLocalTimeZone, today, CalendarDate } from "@internationalized/date";
import { Calendar as CalendarIcon } from "@untitledui/icons";
import type { DateValue } from "react-aria-components";
import { cx } from "../../utils/cx";
import { Calendar } from "./calendar";

const highlightedDates = [today(getLocalTimeZone())];

interface DateTimeFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  /** Value as "YYYY-MM-DDTHH:mm" string */
  value: string;
  onChange: (value: string) => void;
  isRequired?: boolean;
}

export function DateTimeField({
  label,
  description,
  errorMessage,
  value,
  onChange,
  isRequired,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Parse the string value
  const datePart = value ? value.split("T")[0] : "";
  const timePart = value ? value.split("T")[1] || "00:00" : "00:00";

  const calendarValue = datePart
    ? (() => {
        try {
          const [y, m, d] = datePart.split("-").map(Number);
          return new CalendarDate(y, m, d);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  // Format for display
  const displayText = (() => {
    if (!datePart) return null;
    try {
      const d = new Date(datePart + "T" + timePart);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        + ", "
        + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return null;
    }
  })();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleDateSelect = (d: DateValue) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const newDate = `${d.year}-${pad(d.month)}-${pad(d.day)}`;
    onChange(`${newDate}T${timePart}`);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    if (datePart) {
      onChange(`${datePart}T${newTime}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-secondary">
          {label}
          {isRequired && <span className="text-error-primary ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cx(
          "flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2 text-left shadow-xs ring-1 ring-inset cursor-pointer transition-colors outline-none",
          "hover:ring-brand/50 focus:ring-2 focus:ring-brand",
          errorMessage ? "ring-error" : "ring-border-secondary",
        )}
      >
        <CalendarIcon className="size-4 text-fg-quaternary shrink-0" />
        <span className={cx("text-sm flex-1", displayText ? "text-fg-secondary" : "text-placeholder")}>
          {displayText || "Select date & time"}
        </span>
      </button>

      {description && !errorMessage && (
        <p className="text-xs text-tertiary">{description}</p>
      )}
      {errorMessage && (
        <p className="text-xs text-error-primary">{errorMessage}</p>
      )}

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-xl bg-primary shadow-xl ring-1 ring-secondary_alt">
          <div className="px-5 py-4">
            <Calendar
              value={calendarValue}
              onChange={handleDateSelect}
              highlightedDates={highlightedDates}
            />
          </div>
          <div className="border-t border-secondary px-5 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-tertiary">Time</label>
              <input
                type="time"
                value={timePart}
                onChange={handleTimeChange}
                className="rounded-lg bg-primary px-2 py-1.5 text-sm ring-1 ring-inset ring-border-secondary focus:ring-2 focus:ring-brand outline-none text-fg-secondary"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-solid_hover transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
