import type {
  TaskComplexity,
  TaskPriority,
  TaskStatus,
} from "@/features/tasks/types";
export const taskStatusMeta: Record<
  TaskStatus,
  { label: string; variant: "gray" | "blue" | "amber" | "green" | "red" }
> = {
  backlog: { label: "Backlog", variant: "gray" },
  todo: { label: "Cần làm", variant: "blue" },
  in_progress: { label: "Đang làm", variant: "amber" },
  completed: { label: "Hoàn thành", variant: "green" },
  cancelled: { label: "Đã hủy", variant: "red" },
};
export const taskPriorityMeta: Record<
  TaskPriority,
  { label: string; variant: "gray" | "blue" | "amber" | "red" }
> = {
  low: { label: "Thấp", variant: "gray" },
  medium: { label: "Trung bình", variant: "blue" },
  high: { label: "Cao", variant: "amber" },
  urgent: { label: "Khẩn", variant: "red" },
};
export const taskComplexityMeta: Record<
  TaskComplexity,
  { label: string; variant: "gray" | "blue" | "amber" }
> = {
  low: { label: "Thấp", variant: "gray" },
  medium: { label: "Trung bình", variant: "blue" },
  high: { label: "Cao", variant: "amber" },
};
