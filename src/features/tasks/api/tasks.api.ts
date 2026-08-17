import { supabase } from "@/lib/supabase";
import { weekRange } from "@/lib/date";
import { parseISO } from "date-fns";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";
import type { TaskFilters, TaskStatus, TaskWithRelations } from "../types";

export type UpdatableTaskStatus = Extract<
  TaskStatus,
  "todo" | "in_progress" | "completed"
>;

export const taskKeys = {
  all: ["tasks"] as const,
  list: (filters: TaskFilters) => [...taskKeys.all, "list", filters] as const,
  official: (filters: TaskFilters) =>
    [...taskKeys.all, "official", filters] as const,
  backlog: (filters: TaskFilters) =>
    [...taskKeys.all, "backlog", filters] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
  taxonomy: () => [...taskKeys.all, "taxonomy"] as const,
  filterOptions: () => [...taskKeys.all, "filter-options"] as const,
  weekly: (week: string) => [...taskKeys.all, "weekly", week] as const,
};
const taskSelect =
  "*, category:task_categories(*, task_type:task_types(*)), assignee:profiles!tasks_assigned_to_fkey(*), creator:profiles!tasks_created_by_fkey(*)";

export async function getTasks(
  filters: TaskFilters = {},
  options: { excludeBacklog?: boolean } = {},
) {
  let query = supabase
    .from("tasks")
    .select(taskSelect)
    .order("updated_at", { ascending: false });
  if (options.excludeBacklog) query = query.neq("status", "backlog");
  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters.status && filters.status !== "all")
    query = query.eq("status", filters.status);
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.assigneeId) query = query.eq("assigned_to", filters.assigneeId);
  if (filters.priority && filters.priority !== "all")
    query = query.eq("priority", filters.priority);
  if (filters.complexity && filters.complexity !== "all")
    query = query.eq("complexity", filters.complexity);
  if (filters.deadline === "overdue")
    query = query
      .lt("deadline", new Date().toISOString().slice(0, 10))
      .neq("status", "completed");
  if (filters.deadline === "week") {
    const { start, end } = weekRange();
    query = query.gte("deadline", start).lte("deadline", end);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as TaskWithRelations[];
}
export async function getTask(id: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select(taskSelect)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as TaskWithRelations;
}
export async function createBacklog(values: {
  title: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title: values.title,
      description: values.description || null,
      status: "backlog",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function createTask(values: TablesInsert<"tasks">) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      ...values,
      assigned_date: new Date().toISOString().slice(0, 10),
      status: "todo",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function assignBacklog(id: string, values: TablesUpdate<"tasks">) {
  const { data, error } = await supabase
    .from("tasks")
    .update({ ...values, assigned_date: new Date().toISOString().slice(0, 10) })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function updateTask(id: string, values: TablesUpdate<"tasks">) {
  const { data, error } = await supabase
    .from("tasks")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function updateTaskStatus(id: string, status: UpdatableTaskStatus) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Bạn chưa đăng nhập.");

  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .eq("assigned_to", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
export async function getTaskTaxonomy() {
  const [
    { data: types, error: typeError },
    { data: categories, error: categoryError },
    { data: profiles, error: profileError },
  ] = await Promise.all([
    supabase.from("task_types").select("*").order("sort_order"),
    supabase
      .from("task_categories")
      .select("*, task_type:task_types(*)")
      .order("sort_order"),
    supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("full_name"),
  ]);
  if (typeError) throw typeError;
  if (categoryError) throw categoryError;
  if (profileError) throw profileError;
  return { types, categories, profiles };
}
export async function getTaskFilterOptions() {
  const [
    { data: types, error: typeError },
    { data: categories, error: categoryError },
    { data: profiles, error: profileError },
  ] = await Promise.all([
    supabase
      .from("task_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("task_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .order("full_name"),
  ]);
  if (typeError) throw typeError;
  if (categoryError) throw categoryError;
  if (profileError) throw profileError;
  return { types, categories, profiles };
}
export async function getWeeklyTaskReport(weekStart: string) {
  const [summary, byType] = await Promise.all([
    supabase.rpc("get_task_week_summary", { p_week_start: weekStart }),
    supabase.rpc("get_task_weekly_by_type", { p_week_start: weekStart }),
  ]);
  if (summary.error) throw summary.error;
  if (byType.error) throw byType.error;
  return { summary: summary.data[0] ?? null, byType: byType.data };
}

export async function getWeeklyTasksByType(
  taskTypeId: string,
  weekStart: string,
) {
  const { data: categories, error: categoryError } = await supabase
    .from("task_categories")
    .select("id")
    .eq("task_type_id", taskTypeId);
  if (categoryError) throw categoryError;

  const categoryIds = categories.map((category) => category.id);
  if (categoryIds.length === 0) return [];

  const { start, end } = weekRange(parseISO(weekStart));
  const { data, error } = await supabase
    .from("tasks")
    .select(taskSelect)
    .in("category_id", categoryIds)
    .gte("deadline", start)
    .lte("deadline", end)
    .neq("status", "backlog")
    .order("deadline");
  if (error) throw error;
  return data as unknown as TaskWithRelations[];
}
