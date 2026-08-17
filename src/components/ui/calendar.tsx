import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Calendar as CalendarPrimitive,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarHeading,
  Button,
  I18nProvider,
  type DateValue,
} from "react-aria-components";
import { cn } from "@/lib/utils";

type CalendarProps = {
  value?: DateValue | null;
  minValue?: DateValue;
  maxValue?: DateValue;
  onChange: (value: DateValue) => void;
};

export function Calendar({
  value,
  minValue,
  maxValue,
  onChange,
}: CalendarProps) {
  return (
    <I18nProvider locale="vi-VN">
      <CalendarPrimitive
        aria-label="Chọn ngày"
        className="w-72 text-sm"
        value={value ?? undefined}
        minValue={minValue}
        maxValue={maxValue}
        firstDayOfWeek="mon"
        onChange={onChange}
      >
        <header className="flex items-center justify-between px-1 pb-3">
          <Button
            slot="previous"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Tháng trước</span>
          </Button>
          <CalendarHeading className="font-medium capitalize" />
          <Button
            slot="next"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Tháng sau</span>
          </Button>
        </header>
        <CalendarGrid className="w-full border-separate border-spacing-x-0 border-spacing-y-1">
          <CalendarGridHeader>
            {(day) => (
              <CalendarHeaderCell className="h-8 text-center text-xs font-normal text-muted-foreground">
                {day}
              </CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => (
              <CalendarCell
                date={date}
                className={({ isSelected, isToday }) =>
                  cn(
                    "relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-[disabled]:cursor-not-allowed data-[disabled]:text-muted-foreground data-[disabled]:opacity-40 data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-40",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary",
                    isToday && !isSelected && "after:absolute after:bottom-1 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary",
                  )
                }
              />
            )}
          </CalendarGridBody>
        </CalendarGrid>
      </CalendarPrimitive>
    </I18nProvider>
  );
}
