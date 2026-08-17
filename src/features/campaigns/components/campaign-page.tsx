import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table";
import { BarChart3, Pencil, Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  campaignKeys,
  generateReport,
  getCampaigns,
  getMetrics,
} from "../api/campaigns.api";
import type { CampaignFilters, CampaignWithAssignee } from "../types";
import { CampaignForm, MetricForm } from "./campaign-forms";
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatVnd,
} from "@/lib/format";
import { useAuth } from "@/features/auth/components/auth-provider";
import { canEditCampaignMetric, canManageCampaigns } from "@/lib/permissions";
import type { MetricValues } from "../schemas/campaign.schemas";
import { toast } from "sonner";
import { TablePagination } from "@/components/shared/table-pagination";
import { getTaskFilterOptions, taskKeys } from "@/features/tasks/api/tasks.api";

export function CampaignPage({
  filters,
  onFilters,
}: {
  filters: CampaignFilters;
  onFilters: (filters: CampaignFilters) => void;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const { profile } = useAuth();
  const [editing, setEditing] = useState<CampaignWithAssignee | null>(null);
  const [creating, setCreating] = useState(false);
  const [metricCampaign, setMetricCampaign] =
    useState<CampaignWithAssignee | null>(null);
  const [reportPrompt, setReportPrompt] = useState<{
    campaign: CampaignWithAssignee;
    values: MetricValues;
  } | null>(null);
  const navigate = useNavigate();
  const client = useQueryClient();
  const reportMutation = useMutation({
    mutationFn: ({ campaign, values }: NonNullable<typeof reportPrompt>) =>
      generateReport(campaign.id, values.metric_date),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: campaignKeys.reports() });
      setReportPrompt(null);
      toast.success("Đã tạo báo cáo campaign.");
      void navigate({ to: "/campaign-reports" });
    },
    onError: (error: Error) =>
      toast.error("Không thể tạo báo cáo", { description: error.message }),
  });
  const query = useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: () => getCampaigns(filters),
  });
  const people = useQuery({
    queryKey: taskKeys.filterOptions(),
    queryFn: getTaskFilterOptions,
  });
  const columns = useMemo<ColumnDef<CampaignWithAssignee>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Tên camp",
        cell: ({ row }) => (
          <button
            className="font-medium hover:underline"
            onClick={() =>
              void navigate({
                to: "/campaigns/$campaignId",
                params: { campaignId: row.original.id },
              })
            }
          >
            {row.original.name}
          </button>
        ),
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
        accessorKey: "start_date",
        header: "Bắt đầu",
        cell: ({ row }) => formatDate(row.original.start_date),
      },
      {
        accessorKey: "end_date",
        header: "Kết thúc",
        cell: ({ row }) => formatDate(row.original.end_date),
      },
      {
        accessorKey: "revenue_kpi",
        header: "KPI doanh thu",
        cell: ({ row }) => formatVnd(row.original.revenue_kpi),
      },
      {
        accessorKey: "crr_kpi",
        header: "KPI CRR",
        cell: ({ row }) => formatPercent(row.original.crr_kpi),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            {canEditCampaignMetric(profile, row.original.assigned_to) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMetricCampaign(row.original)}
              >
                Nhập số liệu
              </Button>
            )}
            {canManageCampaigns(profile) && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sửa campaign"
                title="Sửa campaign"
                onClick={() => setEditing(row.original)}
              >
                <Pencil className="h-4 w-4" />
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
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Campaign Ads</h1>
        {canManageCampaigns(profile) && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Tạo campaign
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-y py-3">
        <Select
          value={filters.assigneeId ?? "all"}
          disabled={people.isPending}
          onValueChange={(assigneeId) =>
            onFilters({
              ...filters,
              assigneeId: assigneeId === "all" ? undefined : assigneeId,
            })
          }
        >
          <SelectTrigger className="w-52">
            <span className="text-muted-foreground">Phụ trách:</span>
            <SelectValue
              placeholder={people.isPending ? "Đang tải..." : "Tất cả"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {people.data?.profiles.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.full_name || person.email || "Chưa có tên"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filters.assigneeId && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onFilters({})}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : table.getRowModel().rows.length === 0 ? (
        <EmptyState>
          Chưa có campaign nào phù hợp với bộ lọc hiện tại.
        </EmptyState>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
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
      <Dialog
        open={creating || Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Chỉnh sửa campaign" : "Tạo campaign"}
            </DialogTitle>
          </DialogHeader>
          <CampaignForm
            campaign={editing ?? undefined}
            done={() => {
              setCreating(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(metricCampaign)}
        onOpenChange={(open) => !open && setMetricCampaign(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập số liệu hằng ngày</DialogTitle>
          </DialogHeader>
          {metricCampaign && (
            <MetricForm
              campaign={metricCampaign}
              submitted={(values) => {
                setMetricCampaign(null);
                setReportPrompt({ campaign: metricCampaign, values });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(reportPrompt)}
        onOpenChange={(open) => !open && setReportPrompt(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Số liệu đã được cập nhật</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có muốn tạo báo cáo cho ngày này không?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportPrompt(null)}>
              Để sau
            </Button>
            <Button
              disabled={reportMutation.isPending}
              onClick={() =>
                reportPrompt && reportMutation.mutate(reportPrompt)
              }
            >
              <BarChart3 className="h-4 w-4" />
              {reportMutation.isPending ? "Đang tạo…" : "Tạo báo cáo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [metricOpen, setMetricOpen] = useState(false);
  const [reportPrompt, setReportPrompt] = useState<MetricValues | null>(null);
  const reportMutation = useMutation({
    mutationFn: (values: MetricValues) =>
      generateReport(campaignId, values.metric_date),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: campaignKeys.reports() });
      setReportPrompt(null);
      toast.success("Đã tạo báo cáo campaign.");
      void navigate({ to: "/campaign-reports" });
    },
    onError: (error: Error) =>
      toast.error("Không thể tạo báo cáo", { description: error.message }),
  });
  const campaign = useQuery({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: () =>
      getCampaigns().then((rows) => {
        const row = rows.find((item) => item.id === campaignId);
        if (!row) throw new Error("Không tìm thấy campaign.");
        return row;
      }),
  });
  const metrics = useQuery({
    queryKey: campaignKeys.metrics(campaignId),
    queryFn: () => getMetrics(campaignId),
    enabled: Boolean(campaign.data),
  });
  if (campaign.isPending || metrics.isPending) return <PageLoading />;
  if (campaign.isError || metrics.isError || !campaign.data)
    return (
      <ErrorState
        error={campaign.error ?? metrics.error}
        retry={() => {
          void campaign.refetch();
          void metrics.refetch();
        }}
      />
    );
  const cumulative = metrics.data.reduce(
    (total, metric) => ({
      revenue: total.revenue + metric.revenue,
      adCost: total.adCost + metric.ad_cost,
      contacts: total.contacts + metric.new_contacts,
    }),
    { revenue: 0, adCost: 0, contacts: 0 },
  );
  const cumulativeCrr = cumulative.revenue
    ? (cumulative.adCost / cumulative.revenue) * 100
    : 0;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{campaign.data.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phụ trách:{" "}
            {campaign.data.assignee?.full_name ||
              campaign.data.assignee?.email ||
              "—"}{" "}
            · {formatDate(campaign.data.start_date)} —{" "}
            {formatDate(campaign.data.end_date)}
          </p>
        </div>
        {canEditCampaignMetric(profile, campaign.data.assigned_to) && (
          <Button onClick={() => setMetricOpen(true)}>Nhập số liệu</Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CumulativeMetric
          label="Doanh thu lũy kế"
          value={formatVnd(cumulative.revenue)}
        />
        <CumulativeMetric
          label="Chi phí ads lũy kế"
          value={formatVnd(cumulative.adCost)}
        />
        <CumulativeMetric label="CRR tổng" value={formatPercent(cumulativeCrr)} />
        <CumulativeMetric
          label="Contact lũy kế"
          value={formatNumber(cumulative.contacts)}
        />
      </div>
      <CampaignHistory metrics={metrics.data} />
      <Dialog open={metricOpen} onOpenChange={setMetricOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nhập số liệu hằng ngày</DialogTitle>
          </DialogHeader>
          <MetricForm
            campaign={campaign.data}
            submitted={(values) => {
              setMetricOpen(false);
              setReportPrompt(values);
            }}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(reportPrompt)}
        onOpenChange={(open) => !open && setReportPrompt(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Số liệu đã được cập nhật</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có muốn tạo báo cáo cho ngày này không?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReportPrompt(null)}>
              Để sau
            </Button>
            <Button
              disabled={reportMutation.isPending}
              onClick={() => reportPrompt && reportMutation.mutate(reportPrompt)}
            >
              <BarChart3 className="h-4 w-4" />
              {reportMutation.isPending ? "Đang tạo…" : "Tạo báo cáo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
function CumulativeMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
function CampaignHistory({
  metrics,
}: {
  metrics: Awaited<ReturnType<typeof getMetrics>>;
}) {
  return (
    <div className="rounded-md border bg-card p-4">
      <h2 className="mb-3 font-semibold">Lịch sử số liệu</h2>
      {metrics.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có số liệu hằng ngày.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ngày</TableHead>
              <TableHead>Doanh thu</TableHead>
              <TableHead>Chi phí ads</TableHead>
              <TableHead>Contact mới</TableHead>
              <TableHead>Đánh giá</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((metric) => (
              <TableRow key={metric.id}>
                <TableCell>{formatDate(metric.metric_date)}</TableCell>
                <TableCell>{formatVnd(metric.revenue)}</TableCell>
                <TableCell>{formatVnd(metric.ad_cost)}</TableCell>
                <TableCell>{formatNumber(metric.new_contacts)}</TableCell>
                <TableCell>{metric.assessment || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
