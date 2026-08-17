import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  assignBacklog,
  createBacklog,
  createTask,
  getTaskTaxonomy,
  taskKeys,
  updateTask,
} from "../api/tasks.api";
import {
  assignmentSchema,
  backlogSchema,
  taskCreateSchema,
  taskUpdateSchema,
  type AssignmentValues,
  type BacklogValues,
  type TaskCreateValues,
  type TaskUpdateValues,
} from "../schemas/task.schemas";
import type { TaskWithRelations } from "../types";
import { toast } from "sonner";
import { PageLoading } from "@/components/shared/states";
import { DatePicker } from "@/components/shared/date-picker";
import { useAuth } from "@/features/auth/components/auth-provider";
import { canEditBacklog, canFullyEditTask } from "@/lib/permissions";
import { FormattedNumberInput } from "@/components/shared/formatted-number-input";

export function BacklogForm({ done }: { done: () => void }) {
  const client = useQueryClient();
  const form = useForm<BacklogValues>({
    resolver: zodResolver(backlogSchema),
    defaultValues: { title: "", description: "" },
  });
  const mutation = useMutation({
    mutationFn: createBacklog,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Đã tạo backlog.");
      done();
    },
    onError: (error: Error) =>
      toast.error("Không thể tạo backlog", { description: error.message }),
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <div className="space-y-2">
        <Label htmlFor="backlog-title">Tiêu đề</Label>
        <Input id="backlog-title" {...form.register("title")} />
        {form.formState.errors.title && (
          <p className="text-xs text-destructive">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="backlog-description">Mô tả</Label>
        <Textarea id="backlog-description" {...form.register("description")} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={done}>
          Hủy
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang tạo…" : "Tạo backlog"}
        </Button>
      </div>
    </form>
  );
}

export function BacklogEditForm({
  task,
  done,
}: {
  task: TaskWithRelations;
  done: () => void;
}) {
  const { profile } = useAuth();
  const client = useQueryClient();
  const form = useForm<BacklogValues>({
    resolver: zodResolver(backlogSchema),
    defaultValues: { title: task.title, description: task.description ?? "" },
  });
  useEffect(() => {
    form.reset({ title: task.title, description: task.description ?? "" });
  }, [form, task]);
  const mutation = useMutation({
    mutationFn: (values: BacklogValues) =>
      updateTask(task.id, {
        title: values.title,
        description: values.description || null,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Đã cập nhật backlog.");
      done();
    },
    onError: (error: Error) =>
      toast.error("Không thể cập nhật backlog", { description: error.message }),
  });
  if (!canEditBacklog(profile, task)) return null;
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <Field label="Tiêu đề" error={form.formState.errors.title?.message}>
        <Input {...form.register("title")} />
      </Field>
      <Field label="Mô tả" error={form.formState.errors.description?.message}>
        <Textarea {...form.register("description")} />
      </Field>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={done}>
          Hủy
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}

export function AssignBacklogForm({
  task,
  done,
}: {
  task: TaskWithRelations;
  done: () => void;
}) {
  const client = useQueryClient();
  const taxonomy = useQuery({
    queryKey: taskKeys.taxonomy(),
    queryFn: getTaskTaxonomy,
  });
  const form = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      category_id: "",
      deadline: "",
      complexity: "medium",
      priority: "medium",
      assigned_to: "",
      estimated_hours: 1,
      status: "todo",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: AssignmentValues) => assignBacklog(task.id, values),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Đã giao backlog thành task.");
      done();
    },
    onError: (error: Error) =>
      toast.error("Không thể giao backlog", { description: error.message }),
  });
  if (taxonomy.isPending) return <PageLoading rows={4} />;
  if (taxonomy.isError)
    return <p className="text-sm text-destructive">Không thể tải danh mục.</p>;
  const { categories, profiles } = taxonomy.data;
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <ControlledSelect
        label="Phân loại"
        value={form.watch("category_id")}
        onChange={(value) =>
          form.setValue("category_id", value, { shouldValidate: true })
        }
        error={form.formState.errors.category_id?.message}
      >
        {categories
          .filter((item) => item.is_active)
          .map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
      </ControlledSelect>
      <ControlledSelect
        label="Người phụ trách"
        value={form.watch("assigned_to")}
        onChange={(value) =>
          form.setValue("assigned_to", value, { shouldValidate: true })
        }
        error={form.formState.errors.assigned_to?.message}
      >
        {profiles.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.full_name || item.email || "Chưa có tên"}
          </SelectItem>
        ))}
      </ControlledSelect>
      <Field label="Deadline" error={form.formState.errors.deadline?.message}>
        <DatePicker
          value={form.watch("deadline")}
          onChange={(value) =>
            form.setValue("deadline", value ?? "", { shouldValidate: true })
          }
        />
      </Field>
      <Field
        label="Số giờ dự kiến"
        error={form.formState.errors.estimated_hours?.message}
      >
        <FormattedNumberInput
          value={form.watch("estimated_hours")}
          onValueChange={(value) =>
            form.setValue("estimated_hours", value as AssignmentValues["estimated_hours"], {
              shouldValidate: true,
            })
          }
          decimalScale={2}
          allowDecimal
          zeroWhenEmptyOnBlur
        />
      </Field>
      <ControlledSelect
        label="Độ phức tạp"
        value={form.watch("complexity")}
        onChange={(value) =>
          form.setValue("complexity", value as AssignmentValues["complexity"])
        }
      >
        <SelectItem value="low">Thấp</SelectItem>
        <SelectItem value="medium">Trung bình</SelectItem>
        <SelectItem value="high">Cao</SelectItem>
      </ControlledSelect>
      <ControlledSelect
        label="Độ ưu tiên"
        value={form.watch("priority")}
        onChange={(value) =>
          form.setValue("priority", value as AssignmentValues["priority"])
        }
      >
        <SelectItem value="low">Thấp</SelectItem>
        <SelectItem value="medium">Trung bình</SelectItem>
        <SelectItem value="high">Cao</SelectItem>
        <SelectItem value="urgent">Khẩn</SelectItem>
      </ControlledSelect>
      <div className="col-span-full flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={done}>
          Hủy
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang lưu…" : "Giao task"}
        </Button>
      </div>
    </form>
  );
}

export function TaskCreateForm({ done }: { done: () => void }) {
  const client = useQueryClient();
  const taxonomy = useQuery({
    queryKey: taskKeys.taxonomy(),
    queryFn: getTaskTaxonomy,
  });
  const form = useForm<TaskCreateValues>({
    resolver: zodResolver(taskCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: "",
      deadline: "",
      complexity: "medium",
      priority: "medium",
      assigned_to: "",
      estimated_hours: 1,
    },
  });
  const mutation = useMutation({
    mutationFn: (values: TaskCreateValues) =>
      createTask({ ...values, description: values.description || null }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Đã tạo task.");
      done();
    },
    onError: (error: Error) =>
      toast.error("Không thể tạo task", { description: error.message }),
  });
  if (taxonomy.isPending) return <PageLoading rows={4} />;
  if (taxonomy.isError)
    return <p className="text-sm text-destructive">Không thể tải danh mục.</p>;
  const { categories, profiles } = taxonomy.data;
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <Field
        label="Tiêu đề"
        error={form.formState.errors.title?.message}
        className="sm:col-span-2"
      >
        <Input {...form.register("title")} />
      </Field>
      <Field label="Mô tả" className="sm:col-span-2">
        <Textarea {...form.register("description")} />
      </Field>
      <ControlledSelect
        label="Phân loại"
        value={form.watch("category_id")}
        onChange={(value) =>
          form.setValue("category_id", value, { shouldValidate: true })
        }
        error={form.formState.errors.category_id?.message}
      >
        {categories
          .filter((item) => item.is_active)
          .map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
      </ControlledSelect>
      <ControlledSelect
        label="Người phụ trách"
        value={form.watch("assigned_to")}
        onChange={(value) =>
          form.setValue("assigned_to", value, { shouldValidate: true })
        }
        error={form.formState.errors.assigned_to?.message}
      >
        {profiles.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.full_name || item.email || "Chưa có tên"}
          </SelectItem>
        ))}
      </ControlledSelect>
      <Field label="Deadline" error={form.formState.errors.deadline?.message}>
        <DatePicker
          value={form.watch("deadline")}
          onChange={(value) =>
            form.setValue("deadline", value ?? "", { shouldValidate: true })
          }
        />
      </Field>
      <Field
        label="Số giờ dự kiến"
        error={form.formState.errors.estimated_hours?.message}
      >
        <FormattedNumberInput
          value={form.watch("estimated_hours")}
          onValueChange={(value) =>
            form.setValue("estimated_hours", value as TaskCreateValues["estimated_hours"], {
              shouldValidate: true,
            })
          }
          decimalScale={2}
          allowDecimal
          zeroWhenEmptyOnBlur
        />
      </Field>
      <ControlledSelect
        label="Độ phức tạp"
        value={form.watch("complexity")}
        onChange={(value) =>
          form.setValue("complexity", value as TaskCreateValues["complexity"])
        }
      >
        <SelectItem value="low">Thấp</SelectItem>
        <SelectItem value="medium">Trung bình</SelectItem>
        <SelectItem value="high">Cao</SelectItem>
      </ControlledSelect>
      <ControlledSelect
        label="Độ ưu tiên"
        value={form.watch("priority")}
        onChange={(value) =>
          form.setValue("priority", value as TaskCreateValues["priority"])
        }
      >
        <SelectItem value="low">Thấp</SelectItem>
        <SelectItem value="medium">Trung bình</SelectItem>
        <SelectItem value="high">Cao</SelectItem>
        <SelectItem value="urgent">Khẩn</SelectItem>
      </ControlledSelect>
      <div className="col-span-full flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={done}>
          Hủy
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang tạo…" : "Tạo task"}
        </Button>
      </div>
    </form>
  );
}

export function TaskEditForm({
  task,
  done,
}: {
  task: TaskWithRelations;
  done: () => void;
}) {
  const { profile } = useAuth();
  const client = useQueryClient();
  const taxonomy = useQuery({
    queryKey: taskKeys.taxonomy(),
    queryFn: getTaskTaxonomy,
  });
  const form = useForm<TaskUpdateValues>({
    resolver: zodResolver(taskUpdateSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      category_id: task.category_id,
      assigned_to: task.assigned_to,
      deadline: task.deadline,
      complexity: task.complexity,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      status: task.status === "backlog" ? "todo" : task.status,
    },
  });
  useEffect(() => {
    form.reset({
      title: task.title,
      description: task.description ?? "",
      category_id: task.category_id,
      assigned_to: task.assigned_to,
      deadline: task.deadline,
      complexity: task.complexity,
      priority: task.priority,
      estimated_hours: task.estimated_hours,
      status: task.status === "backlog" ? "todo" : task.status,
    });
  }, [task, form]);
  const mutation = useMutation({
    mutationFn: async ({ status: _status, ...values }: TaskUpdateValues) => {
      const payload = { ...values, description: values.description || null };
      return updateTask(task.id, payload);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      toast.success("Đã cập nhật task.");
      done();
    },
    onError: (error: Error) =>
      toast.error("Không thể cập nhật task", { description: error.message }),
  });
  if (taxonomy.isPending) return <PageLoading rows={4} />;
  if (taxonomy.isError)
    return <p className="text-sm text-destructive">Không thể tải danh mục.</p>;
  const { categories, profiles } = taxonomy.data;
  if (!canFullyEditTask(profile, task)) return null;
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <Field
        label="Tiêu đề"
        error={form.formState.errors.title?.message}
        className="sm:col-span-2"
      >
        <Input {...form.register("title")} />
      </Field>
      <Field label="Mô tả" className="sm:col-span-2">
        <Textarea {...form.register("description")} />
      </Field>
      <ControlledSelect
        label="Phân loại"
        value={form.watch("category_id") ?? "none"}
        onChange={(value) =>
          form.setValue("category_id", value === "none" ? null : value)
        }
      >
        <SelectItem value="none">Chưa phân loại</SelectItem>
        {categories
          .filter((item) => item.is_active)
          .map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
      </ControlledSelect>
      <ControlledSelect
        label="Người phụ trách"
        value={form.watch("assigned_to") ?? "none"}
        onChange={(value) =>
          form.setValue("assigned_to", value === "none" ? null : value, {
            shouldValidate: true,
          })
        }
      >
        <SelectItem value="none">Chưa giao</SelectItem>
        {profiles.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.full_name || item.email || "Chưa có tên"}
          </SelectItem>
        ))}
      </ControlledSelect>
      <Field label="Deadline">
        <DatePicker
          value={form.watch("deadline")}
          onChange={(value) =>
            form.setValue("deadline", value ?? null, { shouldValidate: true })
          }
        />
      </Field>
      <ControlledSelect
        label="Độ ưu tiên"
        value={form.watch("priority") ?? "none"}
        onChange={(value) =>
          form.setValue(
            "priority",
            value === "none" ? null : (value as TaskUpdateValues["priority"]),
          )
        }
      >
        <SelectItem value="none">Chưa chọn</SelectItem>
        <SelectItem value="low">Thấp</SelectItem>
        <SelectItem value="medium">Trung bình</SelectItem>
        <SelectItem value="high">Cao</SelectItem>
        <SelectItem value="urgent">Khẩn</SelectItem>
      </ControlledSelect>
      <ControlledSelect
        label="Độ phức tạp"
        value={form.watch("complexity") ?? "none"}
        onChange={(value) =>
          form.setValue(
            "complexity",
            value === "none" ? null : (value as TaskUpdateValues["complexity"]),
          )
        }
      >
        <SelectItem value="none">Chưa chọn</SelectItem>
        <SelectItem value="low">Thấp</SelectItem>
        <SelectItem value="medium">Trung bình</SelectItem>
        <SelectItem value="high">Cao</SelectItem>
      </ControlledSelect>
      <Field label="Số giờ dự kiến">
        <FormattedNumberInput
          value={form.watch("estimated_hours")}
          onValueChange={(value) =>
            form.setValue("estimated_hours", value ?? null, {
              shouldValidate: true,
            })
          }
          decimalScale={2}
          allowDecimal
          zeroWhenEmptyOnBlur
        />
      </Field>
      <div className="col-span-full flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={done}>
          Hủy
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
function ControlledSelect({
  label,
  value,
  onChange,
  error,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Chọn ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
