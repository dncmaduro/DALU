import { useState } from "react";
import { parseDate, type DateValue } from "@internationalized/date";
import { format, parseISO } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const toCalendarDate = (value?: string | null) => {
  if (!value) return undefined;
  try {
    return parseDate(value);
  } catch {
    return undefined;
  }
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Chọn ngày",
  min,
  max,
  className,
}: {
  value?: string | null;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = toCalendarDate(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start font-normal",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarDays className="h-4 w-4" />
          {selected ? format(parseISO(selected.toString()), "dd/MM/yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto max-w-[calc(100vw-2rem)] bg-popover p-3"
      >
        <Calendar
          value={selected}
          minValue={toCalendarDate(min)}
          maxValue={toCalendarDate(max)}
          onChange={(date: DateValue) => {
            onChange(date.toString());
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
