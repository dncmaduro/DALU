import { useState } from "react";
import { MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getTaskTaxonomy, taskKeys } from "@/features/tasks/api/tasks.api";
import type { Tables } from "@/types/database.types";
import { useAuth } from "@/features/auth/components/auth-provider";
import {
  deleteTaskCategory,
  deleteTaskType,
  saveTaskCategory,
  saveTaskType,
} from "../api/taxonomy.api";
import { toast } from "sonner";

type Editor =
  | { kind: "type"; value?: Tables<"task_types"> }
  | { kind: "category"; value?: Tables<"task_categories"> };
type DeleteTarget = { kind: "type" | "category"; id: string; name: string };
export function AdminPage() {
  const { profile } = useAuth();
  const client = useQueryClient();
  const taxonomy = useQuery({
    queryKey: taskKeys.taxonomy(),
    queryFn: getTaskTaxonomy,
  });
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const invalidate = () =>
    void client.invalidateQueries({ queryKey: taskKeys.taxonomy() });
  const save = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      if (!editor) return;
      const values = new FormData(form);
      const name = String(values.get("name") ?? "").trim();
      const description =
        String(values.get("description") ?? "").trim() || null;
      if (!name) throw new Error("Nhập tên.");
      if (editor.kind === "type")
        return saveTaskType(
          {
            name,
            description,
            is_active: editor.value?.is_active ?? true,
            created_by: editor.value ? undefined : profile?.id,
          },
          editor.value?.id,
        );
      const taskTypeId = String(values.get("task_type_id") ?? "");
      if (!taskTypeId) throw new Error("Chọn loại task.");
      return saveTaskCategory(
        {
          name,
          description,
          task_type_id: taskTypeId,
          is_active: editor.value?.is_active ?? true,
          created_by: editor.value ? undefined : profile?.id,
        },
        editor.value?.id,
      );
    },
    onSuccess: () => {
      invalidate();
      setEditor(null);
      toast.success("Đã lưu thay đổi.");
    },
    onError: (error: Error) =>
      toast.error("Không thể lưu", { description: error.message }),
  });
  const toggle = useMutation({
    mutationFn: ({
      kind,
      value,
    }:
      | { kind: "type"; value: Tables<"task_types"> }
      | { kind: "category"; value: Tables<"task_categories"> }) =>
      kind === "type"
        ? saveTaskType(
            {
              name: value.name,
              description: value.description,
              is_active: !value.is_active,
            },
            value.id,
          )
        : saveTaskCategory(
            {
              name: value.name,
              description: value.description,
              task_type_id: value.task_type_id,
              is_active: !value.is_active,
            },
            value.id,
          ),
    onSuccess: () => {
      invalidate();
      toast.success("Đã cập nhật trạng thái.");
    },
    onError: (error: Error) =>
      toast.error("Không thể cập nhật trạng thái", {
        description: error.message,
      }),
  });
  const remove = useMutation({
    mutationFn: ({ kind, id }: DeleteTarget) =>
      kind === "type" ? deleteTaskType(id) : deleteTaskCategory(id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success("Đã xóa.");
    },
    onError: (error: Error) =>
      toast.error("Không thể xóa dữ liệu đang được sử dụng.", {
        description: error.message,
      }),
  });
  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Quản trị</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Loại và phân loại task.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditor({ kind: "type" })}>
            Tạo loại
          </Button>
          <Button onClick={() => setEditor({ kind: "category" })}>
            Tạo phân loại
          </Button>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <TaxonomyTable
          title="Loại task"
          rows={taxonomy.data?.types ?? []}
          render={(value) => (
            <>
              <TableCell>{value.name}</TableCell>
              <TableCell>
                <Status active={value.is_active} />
              </TableCell>
              <TableCell className="text-right">
                <Actions
                  onEdit={() => setEditor({ kind: "type", value })}
                  onToggle={() => toggle.mutate({ kind: "type", value })}
                  onDelete={() =>
                    setDeleteTarget({
                      kind: "type",
                      id: value.id,
                      name: value.name,
                    })
                  }
                  active={value.is_active}
                />
              </TableCell>
            </>
          )}
          headers={["Tên", "Trạng thái", ""]}
        />
        <TaxonomyTable
          title="Phân loại"
          rows={taxonomy.data?.categories ?? []}
          render={(value) => (
            <>
              <TableCell>{value.name}</TableCell>
              <TableCell>{value.task_type?.name ?? "—"}</TableCell>
              <TableCell>
                <Status active={value.is_active} />
              </TableCell>
              <TableCell className="text-right">
                <Actions
                  onEdit={() => setEditor({ kind: "category", value })}
                  onToggle={() => toggle.mutate({ kind: "category", value })}
                  onDelete={() =>
                    setDeleteTarget({
                      kind: "category",
                      id: value.id,
                      name: value.name,
                    })
                  }
                  active={value.is_active}
                />
              </TableCell>
            </>
          )}
          headers={["Tên", "Loại", "Trạng thái", ""]}
        />
      </div>
      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => !open && setEditor(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editor?.value ? "Chỉnh sửa" : "Tạo mới"}{" "}
              {editor?.kind === "type" ? "loại task" : "phân loại"}
            </DialogTitle>
          </DialogHeader>
          {editor && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                save.mutate(event.currentTarget);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="taxonomy-name">Tên</Label>
                <Input
                  id="taxonomy-name"
                  name="name"
                  defaultValue={editor.value?.name ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxonomy-description">Mô tả</Label>
                <Input
                  id="taxonomy-description"
                  name="description"
                  defaultValue={editor.value?.description ?? ""}
                />
              </div>
              {editor.kind === "category" && (
                <div className="space-y-2">
                  <Label>Loại task</Label>
                  <Select
                    name="task_type_id"
                    defaultValue={editor.value?.task_type_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại task" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxonomy.data?.types.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditor(null)}
                >
                  Hủy
                </Button>
                <Button disabled={save.isPending}>
                  {save.isPending ? "Đang lưu…" : "Lưu"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Xóa {deleteTarget?.kind === "type" ? "loại task" : "phân loại"}
            </DialogTitle>
            <DialogDescription>
              Xóa {deleteTarget?.name ? `“${deleteTarget.name}”` : "mục này"}?
              Thao tác không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleteTarget && remove.mutate(deleteTarget)}
            >
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function Status({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "green" : "gray"}>
      {active ? "Đang hoạt động" : "Đã tắt"}
    </Badge>
  );
}
function Actions({
  active,
  onEdit,
  onToggle,
  onDelete,
}: {
  active: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Thao tác">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onToggle}>
          <Power className="mr-2 h-4 w-4" />
          {active ? "Tắt hoạt động" : "Bật hoạt động"}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function TaxonomyTable<T extends { id: string }>({
  title,
  rows,
  headers,
  render,
}: {
  title: string;
  rows: T[];
  headers: string[];
  render: (value: T) => React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-md border bg-card">
      <div className="border-b bg-muted/30 px-4 py-3 font-semibold">
        {title}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length ? (
            rows.map((row) => <TableRow key={row.id}>{render(row)}</TableRow>)
          ) : (
            <TableRow>
              <TableCell
                colSpan={headers.length}
                className="py-8 text-center text-muted-foreground"
              >
                Chưa có dữ liệu.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}
