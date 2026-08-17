import { useState } from "react";
import { parseDate } from "@internationalized/date";
import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toDateInput } from "@/lib/date";
import { cn } from "@/lib/utils";

export function WeekPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const start = parseISO(value);
  const end = addDays(start, 6);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("justify-center font-normal", className)}
        >
          <CalendarDays className="h-4 w-4" />
          {format(start, "dd/MM/yyyy")} – {format(end, "dd/MM/yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className="w-auto max-w-[calc(100vw-2rem)] bg-popover p-3"
      >
        <Calendar
          value={parseDate(value)}
          onChange={(date) => {
            onChange(
              toDateInput(
                startOfWeek(parseISO(date.toString()), { weekStartsOn: 1 }),
              ),
            );
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
