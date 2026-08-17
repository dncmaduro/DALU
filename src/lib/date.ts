import {
  addDays,
  format,
  isWithinInterval,
  parseISO,
  startOfWeek,
} from "date-fns";
export const businessTimezone = "Asia/Bangkok";
export const toDateInput = (value: Date) => format(value, "yyyy-MM-dd");
export const startOfBusinessWeek = (value = new Date()) =>
  startOfWeek(value, { weekStartsOn: 1 });
export const weekRange = (value = new Date()) => {
  const start = startOfBusinessWeek(value);
  return { start: toDateInput(start), end: toDateInput(addDays(start, 6)) };
};
export const isDateInRange = (date: string, start: string, end: string) =>
  isWithinInterval(parseISO(date), {
    start: parseISO(start),
    end: parseISO(end),
  });
