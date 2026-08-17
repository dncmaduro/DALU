import type { Tables } from "@/types/database.types";
export type Profile = Tables<"profiles">;
type TaskPermissionSubject = Pick<
  Tables<"tasks">,
  "assigned_to" | "created_by" | "status"
>;

export const isAdmin = (profile: Profile | null | undefined) =>
  profile?.role === "admin";

export const canFullyEditTask = (
  profile: Profile | null | undefined,
  _task: TaskPermissionSubject,
) => isAdmin(profile);

export const canUpdateTaskStatus = (
  profile: Profile | null | undefined,
  task: TaskPermissionSubject,
) =>
  task.status !== "backlog" &&
  profile?.id === task.assigned_to;

export const canEditBacklog = (
  profile: Profile | null | undefined,
  task: TaskPermissionSubject,
) =>
  task.status === "backlog" &&
  (isAdmin(profile) || profile?.id === task.created_by);

export const canDeleteTask = (
  profile: Profile | null | undefined,
  _task: TaskPermissionSubject,
) => isAdmin(profile);

export const canAssignBacklog = isAdmin;
export const canManageCampaigns = isAdmin;
export const canManageTaxonomy = isAdmin;
export const canChangeAssignee = isAdmin;
export const canEditCampaignMetric = (
  profile: Profile | null | undefined,
  assignedTo: string,
) => profile?.id === assignedTo;
export const canGenerateCampaignReport = canEditCampaignMetric;
