import { supabase } from "@/lib/supabase";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";
export const adminKeys = { taxonomy: ["admin", "taxonomy"] as const };
export async function saveTaskType(
  values: TablesInsert<"task_types">,
  id?: string,
) {
  const query = id
    ? supabase
        .from("task_types")
        .update(values as TablesUpdate<"task_types">)
        .eq("id", id)
    : supabase.from("task_types").insert(values);
  const { error } = await query;
  if (error) throw error;
}
export async function saveTaskCategory(
  values: TablesInsert<"task_categories">,
  id?: string,
) {
  const query = id
    ? supabase
        .from("task_categories")
        .update(values as TablesUpdate<"task_categories">)
        .eq("id", id)
    : supabase.from("task_categories").insert(values);
  const { error } = await query;
  if (error) throw error;
}
export async function deleteTaskType(id: string) {
  const { error } = await supabase.from("task_types").delete().eq("id", id);
  if (error) throw error;
}
export async function deleteTaskCategory(id: string) {
  const { error } = await supabase
    .from("task_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
