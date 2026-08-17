import type { Enums, Tables } from "@/types/database.types";
export type Task = Tables<"tasks">;
export type TaskStatus = Enums<"task_status">;
export type TaskPriority = Enums<"task_priority">;
export type TaskComplexity = Enums<"task_complexity">;
export type TaskWithRelations = Task & {
  category:
    | (Tables<"task_categories"> & { task_type: Tables<"task_types"> | null })
    | null;
  assignee: Tables<"profiles"> | null;
  creator: Tables<"profiles"> | null;
};
export type TaskFilters = {
  search?: string;
  status?: TaskStatus | "all";
  categoryId?: string;
  assigneeId?: string;
  priority?: TaskPriority | "all";
  complexity?: TaskComplexity | "all";
  deadline?: "overdue" | "week" | "none";
  page?: number;
};
