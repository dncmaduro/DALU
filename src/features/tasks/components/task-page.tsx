import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Eye, Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EmptyState,
  ErrorState,
  PageLoading,
} from "@/components/shared/states";
import type { TaskFilters, TaskWithRelations } from "../types";
import {
  TaskComplexityBadge,
  TaskPriorityBadge,
  TaskStatusBadge,
} from "./task-badges";
import {
  AssignBacklogForm,
  BacklogEditForm,
  BacklogForm,
  TaskCreateForm,
  TaskEditForm,
} from "./task-forms";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { TablePagination } from "@/components/shared/table-pagination";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  canAssignBacklog,
  canDeleteTask,
  canEditBacklog,
  canFullyEditTask,
} from "@/lib/permissions";
import { TaskStatusInline, TaskStatusUpdate } from "./task-status-update";
import {
  deleteTask,
  getTask,
  getTaskFilterOptions,
  getTasks,
  taskKeys,
} from "../api/tasks.api";
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TaskPage({
  filters,
  onFilters,
  backlogOnly = false,
}: {
  filters: TaskFilters;
  onFilters: (next: TaskFilters) => void;
  backlogOnly?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [assigning, setAssigning] = useState<TaskWithRelations | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const { profile } = useAuth();
  const navigate = useNavigate();
  const effectiveFilters = {
    ...filters,
    status: backlogOnly ? ("backlog" as const) : filters.status,
  };
  const query = useQuery({
    queryKey: backlogOnly
      ? taskKeys.backlog(effectiveFilters)
      : taskKeys.official(effectiveFilters),
    queryFn: () => getTasks(effectiveFilters, { excludeBacklog: !backlogOnly }),
  });
  const filterOptions = useQuery({
    queryKey: taskKeys.filterOptions(),
    queryFn: getTaskFilterOptions,
  });
  const columns = useMemo<ColumnDef<TaskWithRelations>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="max-w-64 truncate text-left font-medium hover:underline"
            onClick={() =>
              void navigate({
                to: "/tasks/$taskId",
                params: { taskId: row.original.id },
              })
            }
          >
            {row.original.title}
          </button>
        ),
      },
      {
        id: "category",
        header: "Phân loại",
        cell: ({ row }) => row.original.category?.name ?? "—",
      },
      {
        id: "assignee",
        header: "Phụ trách",
        cell: ({ row }) =>
          row.original.assignee?.full_name ||
          row.original.assignee?.email ||
          "—",
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <TaskStatusInline task={row.original} profile={profile} />
        ),
      },
      {
        accessorKey: "priority",
        header: "Ưu tiên",
        cell: ({ row }) => (
          <TaskPriorityBadge priority={row.original.priority} />
        ),
      },
      {
        accessorKey: "complexity",
        header: "Độ phức tạp",
        cell: ({ row }) => (
          <TaskComplexityBadge complexity={row.original.complexity} />
        ),
      },
      {
        accessorKey: "assigned_date",
        header: "Ngày giao",
        cell: ({ row }) => formatDate(row.original.assigned_date),
      },
      {
        accessorKey: "deadline",
        header: "Deadline",
        cell: ({ row }) => formatDate(row.original.deadline),
      },
      {
        accessorKey: "estimated_hours",
        header: "Giờ",
        cell: ({ row }) =>
          row.original.estimated_hours === null
            ? "—"
            : formatNumber(row.original.estimated_hours, 2),
      },
      {
        accessorKey: "updated_at",
        header: "Cập nhật",
        cell: ({ row }) => formatDateTime(row.original.updated_at),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Xem task"
              title="Xem task"
              onClick={() =>
                void navigate({
                  to: "/tasks/$taskId",
                  params: { taskId: row.original.id },
                })
              }
            >
              <Eye className="h-4 w-4" />
            </Button>
            {row.original.status === "backlog" && canAssignBacklog(profile) && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-500 bg-amber-500 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
                onClick={() => setAssigning(row.original)}
              >
                Giao
              </Button>
            )}
          </div>
        ),
      },
    ],
    [navigate, profile],
  );
  const table = useReactTable({
    data: query.data ?? [],
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            {backlogOnly ? "Backlog" : "Task"}
          </h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          {backlogOnly ? "Tạo backlog" : "Tạo task"}
        </Button>
      </div>
      <TaskToolbar
        filters={filters}
        onFilters={onFilters}
        taxonomy={filterOptions.data}
        lookupLoading={filterOptions.isPending}
        backlogOnly={backlogOnly}
      />
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : table.getRowModel().rows.length === 0 ? (
        <EmptyState>Chưa có task nào phù hợp với bộ lọc hiện tại.</EmptyState>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => {
                    const sortDirection = header.column.getIsSorted();
                    const canSort = header.column.getCanSort();
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            className="flex items-center gap-1 text-left hover:text-foreground"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {sortDirection === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : sortDirection === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : null}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination table={table} />
        </div>
      )}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{backlogOnly ? "Tạo backlog" : "Tạo task"}</DialogTitle>
          </DialogHeader>
          {backlogOnly ? (
            <BacklogForm done={() => setCreateOpen(false)} />
          ) : (
            <TaskCreateForm done={() => setCreateOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(assigning)}
        onOpenChange={(open) => !open && setAssigning(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Giao backlog</DialogTitle>
          </DialogHeader>
          {assigning && (
            <AssignBacklogForm
              task={assigning}
              done={() => setAssigning(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
function TaskToolbar({
  filters,
  onFilters,
  taxonomy,
  lookupLoading,
  backlogOnly,
}: {
  filters: TaskFilters;
  onFilters: (filters: TaskFilters) => void;
  taxonomy: Awaited<ReturnType<typeof getTaskFilterOptions>> | undefined;
  lookupLoading: boolean;
  backlogOnly: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-y py-3">
      <Input
        className="w-64 shrink-0"
        placeholder="Tìm task theo tiêu đề..."
        value={filters.search ?? ""}
        onChange={(event) =>
          onFilters({ ...filters, search: event.target.value || undefined })
        }
      />
      {!backlogOnly && (
        <Select
          value={filters.status ?? "all"}
          onValueChange={(status) =>
            onFilters({ ...filters, status: status as TaskFilters["status"] })
          }
        >
          <SelectTrigger className="w-48 shrink-0">
            <span className="shrink-0 whitespace-nowrap text-muted-foreground">
              Trạng thái:
            </span>
            <SelectValue className="min-w-0 flex-1 truncate text-right" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="todo">Cần làm</SelectItem>
            <SelectItem value="in_progress">Đang làm</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      )}
      <Select
        value={filters.categoryId ?? "all"}
        disabled={lookupLoading}
        onValueChange={(categoryId) =>
          onFilters({
            ...filters,
            categoryId: categoryId === "all" ? undefined : categoryId,
          })
        }
      >
        <SelectTrigger className="w-52 shrink-0">
          <span className="shrink-0 whitespace-nowrap text-muted-foreground">
            Phân loại:
          </span>
          <SelectValue className="min-w-0 flex-1 truncate text-right" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {lookupLoading ? "Đang tải..." : "Tất cả"}
          </SelectItem>
          {taxonomy?.categories
            .filter((category) => category.is_active)
            .map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.priority ?? "all"}
        onValueChange={(priority) =>
          onFilters({
            ...filters,
            priority: priority as TaskFilters["priority"],
          })
        }
      >
        <SelectTrigger className="w-44 shrink-0">
          <span className="shrink-0 whitespace-nowrap text-muted-foreground">
            Ưu tiên:
          </span>
          <SelectValue className="min-w-0 flex-1 truncate text-right" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="low">Thấp</SelectItem>
          <SelectItem value="medium">Trung bình</SelectItem>
          <SelectItem value="high">Cao</SelectItem>
          <SelectItem value="urgent">Khẩn</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.complexity ?? "all"}
        onValueChange={(complexity) =>
          onFilters({
            ...filters,
            complexity: complexity as TaskFilters["complexity"],
          })
        }
      >
        <SelectTrigger className="w-52 shrink-0">
          <span className="shrink-0 whitespace-nowrap text-muted-foreground">
            Độ phức tạp:
          </span>
          <SelectValue className="min-w-0 flex-1 truncate text-right" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="low">Thấp</SelectItem>
          <SelectItem value="medium">Trung bình</SelectItem>
          <SelectItem value="high">Cao</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.assigneeId ?? "all"}
        disabled={lookupLoading}
        onValueChange={(assigneeId) =>
          onFilters({
            ...filters,
            assigneeId: assigneeId === "all" ? undefined : assigneeId,
          })
        }
      >
        <SelectTrigger className="w-56 shrink-0">
          <span className="shrink-0 whitespace-nowrap text-muted-foreground">
            Phụ trách:
          </span>
          <SelectValue className="min-w-0 flex-1 truncate text-right" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {lookupLoading ? "Đang tải..." : "Tất cả"}
          </SelectItem>
          {taxonomy?.profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.full_name || profile.email || "Chưa có tên"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.deadline ?? "none"}
        onValueChange={(deadline) =>
          onFilters({
            ...filters,
            deadline: deadline as TaskFilters["deadline"],
          })
        }
      >
        <SelectTrigger className="w-48 shrink-0">
          <span className="shrink-0 whitespace-nowrap text-muted-foreground">
            Deadline:
          </span>
          <SelectValue className="min-w-0 flex-1 truncate text-right" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Tất cả</SelectItem>
          <SelectItem value="overdue">Quá hạn</SelectItem>
          <SelectItem value="week">Trong tuần</SelectItem>
        </SelectContent>
      </Select>
      {Object.entries(filters).some(
        ([key, value]) =>
          key !== "status" ||
          (!backlogOnly && value !== "all" && value !== undefined),
      ) && (
        <Button variant="ghost" size="sm" onClick={() => onFilters({})}>
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}
export function TaskDetailPage({
  taskId,
  mode = "view",
}: {
  taskId: string;
  mode?: "view" | "edit";
}) {
  const query = useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => getTask(taskId),
  });
  if (query.isPending) return <PageLoading />;
  if (query.isError || !query.data)
    return (
      <ErrorState error={query.error} retry={() => void query.refetch()} />
    );
  if (mode === "edit") return <TaskEditPage task={query.data} />;
  return <TaskDetail task={query.data} />;
}

function TaskEditPage({ task }: { task: TaskWithRelations }) {
  const navigate = useNavigate();
  const returnToDetail = () =>
    void navigate({
      to: "/tasks/$taskId",
      params: { taskId: task.id },
    });
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {task.status === "backlog" ? "Chỉnh sửa backlog" : "Chỉnh sửa task"}
        </h1>
        <Button variant="outline" onClick={returnToDetail}>
          Quay lại
        </Button>
      </div>
      {task.status === "backlog" ? (
        <BacklogEditForm task={task} done={returnToDetail} />
      ) : (
        <TaskEditForm task={task} done={returnToDetail} />
      )}
    </section>
  );
}

function TaskDetail({ task }: { task: TaskWithRelations }) {
  const { profile } = useAuth();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState(task.status);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deletion = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: taskKeys.all });
      setDeleteOpen(false);
      toast.success("Đã xóa task.");
      void navigate({ to: task.status === "backlog" ? "/backlog" : "/tasks" });
    },
    onError: (error: unknown) =>
      toast.error("Không thể xóa task", {
        description:
          error instanceof Error
            ? error.message
            : "Vui lòng thử lại hoặc kiểm tra quyền truy cập.",
      }),
  });
  return (
    <section className="space-y-4">
      <div className="rounded-md border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <Button
            variant="outline"
            onClick={() =>
              void navigate({ to: task.status === "backlog" ? "/backlog" : "/tasks" })
            }
          >
            Quay lại
          </Button>
        </div>
        <div className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Detail label="Trạng thái">
            <TaskStatusBadge status={status} />
          </Detail>
          <Detail label="Ưu tiên">
            <TaskPriorityBadge priority={task.priority} />
          </Detail>
          <Detail label="Phân loại">{task.category?.name ?? "—"}</Detail>
          <Detail label="Loại task">
            {task.category?.task_type?.name ?? "—"}
          </Detail>
          <Detail label="Người phụ trách">
            {task.assignee?.full_name || task.assignee?.email || "—"}
          </Detail>
          <Detail label="Người tạo">
            {task.creator?.full_name || task.creator?.email || "—"}
          </Detail>
          <Detail label="Ngày giao">{formatDate(task.assigned_date)}</Detail>
          <Detail label="Deadline">{formatDate(task.deadline)}</Detail>
          <Detail label="Giờ dự kiến">
            {task.estimated_hours === null
              ? "—"
              : formatNumber(task.estimated_hours, 2)}
          </Detail>
          <Detail label="Hoàn thành">{formatDateTime(task.completed_at)}</Detail>
          <Detail label="Mô tả" className="sm:col-span-2">
            {task.description || "Không có mô tả."}
          </Detail>
        </div>
        {task.status !== "backlog" && (
          <TaskStatusUpdate
            task={task}
            profile={profile}
            onUpdated={setStatus}
          />
        )}
        <div className="mt-5 flex justify-end gap-2">
        {task.status === "backlog" && canAssignBacklog(profile) && (
          <Button
            className="bg-amber-500 text-amber-950 hover:bg-amber-600 hover:text-amber-950"
            onClick={() => setAssignOpen(true)}
          >
            Giao
          </Button>
        )}
        {task.status === "backlog"
          ? canEditBacklog(profile, task) && (
              <Button
                onClick={() =>
                  void navigate({
                    to: "/tasks/$taskId/edit",
                    params: { taskId: task.id },
                  })
                }
              >
                Chỉnh sửa
              </Button>
            )
          : canFullyEditTask(profile, task) && (
              <Button
                onClick={() =>
                  void navigate({
                    to: "/tasks/$taskId/edit",
                    params: { taskId: task.id },
                  })
                }
              >
                Chỉnh sửa
              </Button>
            )}
        {canDeleteTask(profile, task) && (
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Xóa
            </Button>
            <AlertDialogContent>
              <AlertDialogTitle>Xóa task “{task.title}”?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancelButton disabled={deletion.isPending}>
                  Hủy
                </AlertDialogCancelButton>
                <AlertDialogActionButton
                  disabled={deletion.isPending}
                  onClick={(event) => {
                    event.preventDefault();
                    deletion.mutate();
                  }}
                >
                  {deletion.isPending ? "Đang xóa…" : "Xóa task"}
                </AlertDialogActionButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        </div>
      </div>
      {task.status === "backlog" && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Giao backlog</DialogTitle>
            </DialogHeader>
            <AssignBacklogForm
              task={task}
              done={() => {
                void client.invalidateQueries({ queryKey: taskKeys.detail(task.id) });
                setAssignOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="mb-1 text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
