import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { canUpdateTaskStatus, type Profile } from "@/lib/permissions";
import {
  taskKeys,
  type UpdatableTaskStatus,
  updateTaskStatus,
} from "../api/tasks.api";
import type { TaskWithRelations } from "../types";
import { TaskStatusBadge } from "./task-badges";

const statusOptions: { value: UpdatableTaskStatus; label: string }[] = [
  { value: "todo", label: "Cần làm" },
  { value: "in_progress", label: "Đang làm" },
  { value: "completed", label: "Hoàn thành" },
];

function toUpdatableStatus(task: TaskWithRelations): UpdatableTaskStatus {
  return task.status === "todo" ||
    task.status === "in_progress" ||
    task.status === "completed"
    ? task.status
    : "todo";
}

export function TaskStatusUpdate({
  task,
  profile,
  onUpdated,
}: {
  task: TaskWithRelations;
  profile: Profile | null | undefined;
  onUpdated?: (status: UpdatableTaskStatus) => void;
}) {
  const client = useQueryClient();
  const [status, setStatus] = useState<UpdatableTaskStatus>(() =>
    toUpdatableStatus(task),
  );
  const mutation = useMutation({
    mutationFn: () => updateTaskStatus(task.id, status),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Đã cập nhật trạng thái task.");
      onUpdated?.(status);
    },
    onError: (error: unknown) =>
      toast.error("Không thể cập nhật trạng thái task", {
        description:
          error instanceof Error
            ? error.message
            : "Vui lòng thử lại hoặc kiểm tra quyền truy cập.",
      }),
  });
  if (!canUpdateTaskStatus(profile, task)) return null;
  return (
    <div className="space-y-2 border-t pt-4">
      <Label htmlFor={`task-status-${task.id}`}>Trạng thái</Label>
      <div className="flex gap-2">
        <Select
          value={status}
          disabled={mutation.isPending}
          onValueChange={(value) => setStatus(value as UpdatableTaskStatus)}
        >
          <SelectTrigger id={`task-status-${task.id}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={status === task.status || mutation.isPending}
        >
          {mutation.isPending ? "Đang cập nhật…" : "Cập nhật"}
        </Button>
      </div>
    </div>
  );
}

export function TaskStatusInline({
  task,
  profile,
}: {
  task: TaskWithRelations;
  profile: Profile | null | undefined;
}) {
  const client = useQueryClient();
  const [status, setStatus] = useState<UpdatableTaskStatus>(() =>
    toUpdatableStatus(task),
  );
  const mutation = useMutation({
    mutationFn: (nextStatus: UpdatableTaskStatus) =>
      updateTaskStatus(task.id, nextStatus),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Đã cập nhật trạng thái task.");
    },
    onError: (error: unknown) => {
      setStatus(toUpdatableStatus(task));
      toast.error("Không thể cập nhật trạng thái task", {
        description:
          error instanceof Error
            ? error.message
            : "Vui lòng thử lại hoặc kiểm tra quyền truy cập.",
      });
    },
  });

  if (!canUpdateTaskStatus(profile, task))
    return <TaskStatusBadge status={task.status} />;

  return (
    <Select
      value={status}
      disabled={mutation.isPending}
      onValueChange={(value) => {
        const nextStatus = value as UpdatableTaskStatus;
        setStatus(nextStatus);
        mutation.mutate(nextStatus);
      }}
    >
      <SelectTrigger
        aria-label="Cập nhật trạng thái task"
        className="h-auto w-auto gap-1.5 border-0 bg-transparent p-0 shadow-none hover:bg-transparent"
      >
        <TaskStatusBadge status={status} />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
