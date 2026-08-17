import { describe, expect, it } from "vitest";
import {
  canAssignBacklog,
  canChangeAssignee,
  canDeleteTask,
  canEditBacklog,
  canEditCampaignMetric,
  canFullyEditTask,
  canUpdateTaskStatus,
  isAdmin,
} from "./permissions";
import type { Profile } from "./permissions";
const admin: Profile = { id: 'a', role: 'admin', is_active: true, email: null, full_name: null, created_at: '', updated_at: '' }
const member: Profile = { ...admin, id: 'm', role: 'member' }
const assignedTask = { assigned_to: "m", created_by: "other", status: "todo" as const };
const createdBacklog = { assigned_to: null, created_by: "m", status: "backlog" as const };

describe("permission helpers", () => {
  it("recognizes administrators", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(member)).toBe(false);
  });
  it("limits assignment changes to admins", () => {
    expect(canAssignBacklog(admin)).toBe(true);
    expect(canChangeAssignee(member)).toBe(false);
  });
  it("applies task permissions by role, assignment, and backlog creator", () => {
    expect(canFullyEditTask(admin, assignedTask)).toBe(true);
    expect(canFullyEditTask(member, assignedTask)).toBe(false);
    expect(canUpdateTaskStatus(member, assignedTask)).toBe(true);
    expect(canUpdateTaskStatus(admin, { ...assignedTask, assigned_to: "m" })).toBe(false);
    expect(canUpdateTaskStatus(member, createdBacklog)).toBe(false);
    expect(canEditBacklog(member, createdBacklog)).toBe(true);
    expect(canEditBacklog(member, { ...createdBacklog, created_by: "other" })).toBe(false);
    expect(canDeleteTask(admin, assignedTask)).toBe(true);
    expect(canDeleteTask(member, assignedTask)).toBe(false);
  });
  it("allows only the campaign owner to enter metric", () => {
    expect(canEditCampaignMetric(member, "m")).toBe(true);
    expect(canEditCampaignMetric(member, "other")).toBe(false);
    expect(canEditCampaignMetric(admin, "other")).toBe(false);
  });
});
