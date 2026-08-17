import type { Tables } from "@/types/database.types";
export type Campaign = Tables<"campaigns">;
export type Metric = Tables<"campaign_daily_metrics">;
export type CampaignWithAssignee = Campaign & {
  assignee: Tables<"profiles"> | null;
};
export type CampaignFilters = {
  assigneeId?: string;
  start?: string;
  end?: string;
};

export type CampaignReportFilters = {
  campaignId?: string;
  from?: string;
  to?: string;
};
