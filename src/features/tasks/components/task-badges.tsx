import { Badge } from "@/components/ui/badge";
import {
  taskComplexityMeta,
  taskPriorityMeta,
  taskStatusMeta,
} from "../utils/status";
import type { TaskComplexity, TaskPriority, TaskStatus } from "../types";
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const item = taskStatusMeta[status];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
export function TaskPriorityBadge({
  priority,
}: {
  priority: TaskPriority | null;
}) {
  if (!priority) return <span className="text-muted-foreground">—</span>;
  const item = taskPriorityMeta[priority];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
export function TaskComplexityBadge({
  complexity,
}: {
  complexity: TaskComplexity | null;
}) {
  if (!complexity) return <span className="text-muted-foreground">—</span>;
  const item = taskComplexityMeta[complexity];
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
