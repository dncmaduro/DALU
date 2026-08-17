import { supabase } from "@/lib/supabase";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";
import type {
  CampaignFilters,
  CampaignReportFilters,
  CampaignWithAssignee,
  Metric,
} from "../types";
export const campaignKeys = {
  all: ["campaigns"] as const,
  list: (filters: CampaignFilters) =>
    [...campaignKeys.all, "list", filters] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
  metrics: (id: string) => [...campaignKeys.all, "metrics", id] as const,
  reports: (filters?: CampaignReportFilters) =>
    filters
      ? ([...campaignKeys.all, "reports", filters] as const)
      : ([...campaignKeys.all, "reports"] as const),
};
export async function getCampaigns(filters: CampaignFilters = {}) {
  let query = supabase
    .from("campaigns")
    .select("*, assignee:profiles!campaigns_assigned_to_fkey(*)")
    .order("updated_at", { ascending: false });
  if (filters.assigneeId) query = query.eq("assigned_to", filters.assigneeId);
  if (filters.start) query = query.gte("start_date", filters.start);
  if (filters.end) query = query.lte("end_date", filters.end);
  const { data, error } = await query;
  if (error) throw error;
  return data as unknown as CampaignWithAssignee[];
}
export async function getCampaign(id: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, assignee:profiles!campaigns_assigned_to_fkey(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as CampaignWithAssignee;
}
export async function saveCampaign(
  values: TablesInsert<"campaigns">,
  id?: string,
) {
  const query = id
    ? supabase
        .from("campaigns")
        .update(values as TablesUpdate<"campaigns">)
        .eq("id", id)
    : supabase.from("campaigns").insert(values);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}
export async function deleteCampaign(id: string) {
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) throw error;
}
export async function getMetrics(campaignId: string) {
  const { data, error } = await supabase
    .from("campaign_daily_metrics")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("metric_date");
  if (error) throw error;
  return data;
}
export async function upsertMetric(
  campaignId: string,
  values: Omit<TablesInsert<"campaign_daily_metrics">, "campaign_id">,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Bạn chưa đăng nhập.");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("assigned_to")
    .eq("id", campaignId)
    .single();
  if (campaignError) throw campaignError;
  if (campaign.assigned_to !== user.id)
    throw new Error("Chỉ người phụ trách campaign mới được cập nhật số liệu.");

  const { data, error } = await supabase
    .from("campaign_daily_metrics")
    .upsert(
      { ...values, campaign_id: campaignId },
      { onConflict: "campaign_id,metric_date" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function generateReport(campaignId: string, metricDate: string) {
  const { data, error } = await supabase.rpc("generate_campaign_report", {
    p_campaign_id: campaignId,
    p_metric_date: metricDate,
  });
  if (error) throw error;
  return data;
}
export async function getReports(filters: CampaignReportFilters = {}) {
  let query = supabase
    .from("campaign_reports")
    .select(
      "*, campaign:campaigns(name), generator:profiles!campaign_reports_generated_by_fkey(full_name,email)",
    )
    .order("generated_at", { ascending: false });
  if (filters.campaignId) query = query.eq("campaign_id", filters.campaignId);
  if (filters.from) query = query.gte("report_date", filters.from);
  if (filters.to) query = query.lte("report_date", filters.to);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}
export type { Metric };
