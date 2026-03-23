"use client";

import { getLocalTimeZone, today } from "@internationalized/date";
import { useControlledState } from "@react-stately/utils";
import { Calendar as CalendarIcon } from "@untitledui/icons";
import { useDateFormatter } from "react-aria";
import type { DatePickerProps as AriaDatePickerProps, DateValue } from "react-aria-components";
import {
  DatePicker as AriaDatePicker,
  Button as AriaButton,
  Dialog as AriaDialog,
  Group as AriaGroup,
  Label as AriaLabel,
  Popover as AriaPopover,
  Text as AriaText,
} from "react-aria-components";
import { cx } from "../../utils/cx";
import { Calendar } from "./calendar";

const highlightedDates = [today(getLocalTimeZone())];

interface DateTimeFieldProps extends Omit<AriaDatePickerProps<DateValue>, "children"> {
  label?: string;
  description?: string;
  errorMessage?: string;
}

export function DateTimeField({ label, description, errorMessage, value: valueProp, defaultValue, onChange, ...props }: DateTimeFieldProps) {
  const dateFormatter = useDateFormatter({ month: "short", day: "numeric", year: "numeric" });
  const timeFormatter = useDateFormatter({ hour: "2-digit", minute: "2-digit" });
  const [value, setValue] = useControlledState(valueProp, defaultValue || null, onChange);

  const formattedDate = value ? dateFormatter.format(value.toDate(getLocalTimeZone())) : null;
  const formattedTime = value && "hour" in value ? timeFormatter.format(value.toDate(getLocalTimeZone())) : null;
  const displayText = formattedDate
    ? formattedTime ? `${formattedDate}, ${formattedTime}` : formattedDate
    : null;

  return (
    <AriaDatePicker granularity="minute" hourCycle={24} shouldCloseOnSelect={false} {...props} value={value} onChange={setValue}>
      <div className="flex flex-col gap-1.5">
        {label && <AriaLabel className="text-sm font-medium text-secondary">{label}</AriaLabel>}
        <AriaGroup>
          <AriaButton
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
          </AriaButton>
        </AriaGroup>
        {description && !errorMessage && (
          <AriaText slot="description" className="text-xs text-tertiary">{description}</AriaText>
        )}
        {errorMessage && (
          <p className="text-xs text-error-primary">{errorMessage}</p>
        )}
      </div>
      <AriaPopover
        offset={4}
        placement="bottom start"
        className={({ isEntering, isExiting }) =>
          cx(
            "origin-(--trigger-anchor-point) will-change-transform z-50",
            isEntering && "duration-150 ease-out animate-in fade-in placement-bottom:slide-in-from-top-0.5",
            isExiting && "duration-100 ease-in animate-out fade-out placement-bottom:slide-out-to-top-0.5",
          )
        }
      >
        <AriaDialog className="rounded-xl bg-primary shadow-xl ring ring-secondary_alt">
          <div className="px-5 py-4">
            <Calendar highlightedDates={highlightedDates} />
          </div>
        </AriaDialog>
      </AriaPopover>
    </AriaDatePicker>
  );
}
