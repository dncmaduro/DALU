import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const formatDate = (value: string | Date | null | undefined) =>
  value ? format(new Date(value), "dd/MM/yyyy", { locale: vi }) : "—";
export const formatDateTime = (value: string | Date | null | undefined) =>
  value ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: vi }) : "—";
export const formatVnd = (value: number | null | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
export const formatNumber = (
  value: number | null | undefined,
  maximumFractionDigits = 0,
) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(value ?? 0);
export const formatPercent = (value: number | null | undefined) =>
  new Intl.NumberFormat("vi-VN", {
    style: "percent",
    maximumFractionDigits: 2,
  }).format((value ?? 0) > 1 ? (value ?? 0) / 100 : (value ?? 0));
