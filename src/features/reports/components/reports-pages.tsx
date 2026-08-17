import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
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
  getWeeklyTaskReport,
  getWeeklyTasksByType,
  taskKeys,
} from "@/features/tasks/api/tasks.api";
import {
  TaskPriorityBadge,
  TaskStatusBadge,
} from "@/features/tasks/components/task-badges";
import {
  getReports,
  campaignKeys,
  getMetrics,
  getCampaigns,
} from "@/features/campaigns/api/campaigns.api";
import {
  formatDate,
  formatNumber,
  formatPercent,
  formatVnd,
} from "@/lib/format";
import { startOfBusinessWeek, toDateInput } from "@/lib/date";
import { WeekPicker } from "@/components/shared/week-picker";
import { DatePicker } from "@/components/shared/date-picker";
import { addWeeks, parseISO } from "date-fns";
import type { Json } from "@/types/database.types";
import type { CampaignReportFilters } from "@/features/campaigns/types";

export function TaskReportPage() {
  const [week, setWeek] = useState(toDateInput(startOfBusinessWeek()));
  const [selectedType, setSelectedType] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: taskKeys.weekly(week),
    queryFn: () => getWeeklyTaskReport(week),
  });
  const taskListQuery = useQuery({
    queryKey: ["tasks", "weekly-by-type", week, selectedType?.id],
    queryFn: () => getWeeklyTasksByType(selectedType!.id, week),
    enabled: selectedType !== null,
  });

  const changeWeek = (nextWeek: string) => {
    setWeek(nextWeek);
    setSelectedType(null);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Báo cáo task</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              changeWeek(toDateInput(addWeeks(parseISO(week), -1)))
            }
          >
            ← Tuần trước
          </Button>
          <WeekPicker
            className="w-48"
            value={week}
            onChange={changeWeek}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              changeWeek(toDateInput(addWeeks(parseISO(week), 1)))
            }
          >
            Tuần sau →
          </Button>
        </div>
      </div>
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric
              label="Tổng task"
              value={query.data.summary?.total_tasks ?? 0}
            />
            <Metric
              label="Đã hoàn thành"
              value={query.data.summary?.completed_tasks ?? 0}
            />
            <Metric
              label="Tỷ lệ hoàn thành"
              value={formatPercent(query.data.summary?.completion_rate)}
            />
          </div>
          <div className="h-80 rounded-md border bg-card p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">Số task theo loại</h2>
              <p className="text-xs text-muted-foreground">
                Bấm vào cột để xem task
              </p>
            </div>
            {query.data.byType.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Không có task thuộc phạm vi tuần này.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={query.data.byType}
                  onClick={(state) => {
                    if (state.activeIndex === null || state.activeIndex === undefined)
                      return;
                    const index = Number(state.activeIndex);
                    const item = query.data.byType[index];
                    if (!item) return;
                    setSelectedType({
                      id: item.task_type_id,
                      name: item.task_type_name,
                    });
                  }}
                >
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="task_type_name" tick={{ fontSize: 12 }} />
                  <YAxis
                    allowDecimals={false}
                    tickFormatter={(value) => formatNumber(Number(value))}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      formatNumber(Number(value)),
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="completed_tasks"
                    name="Task hoàn thành"
                    barSize={80}
                    fill="#059669"
                    radius={[2, 2, 0, 0]}
                    cursor="pointer"
                  />
                  <Bar
                    dataKey="total_tasks"
                    name="Task được giao"
                    barSize={80}
                    fill="#2b6d97"
                    radius={[2, 2, 0, 0]}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {selectedType && (
            <div className="rounded-md border bg-card">
              <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
                <div>
                  <h2 className="font-semibold">
                    Task loại: {selectedType.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Deadline nằm trong tuần đã chọn
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedType(null)}
                >
                  Đóng
                </Button>
              </div>
              {taskListQuery.isPending ? (
                <div className="p-4">
                  <PageLoading />
                </div>
              ) : taskListQuery.isError ? (
                <div className="p-4">
                  <ErrorState
                    error={taskListQuery.error}
                    retry={() => void taskListQuery.refetch()}
                  />
                </div>
              ) : taskListQuery.data.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  Không có task phù hợp.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Phụ trách</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ưu tiên</TableHead>
                      <TableHead>Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskListQuery.data.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <button
                            className="max-w-64 truncate text-left font-medium hover:underline"
                            onClick={() =>
                              void navigate({
                                to: "/tasks/$taskId",
                                params: { taskId: task.id },
                              })
                            }
                          >
                            {task.title}
                          </button>
                        </TableCell>
                        <TableCell>{task.category?.name ?? "—"}</TableCell>
                        <TableCell>
                          {task.assignee?.full_name ?? task.assignee?.email ?? "—"}
                        </TableCell>
                        <TableCell>
                          <TaskStatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>
                          <TaskPriorityBadge priority={task.priority} />
                        </TableCell>
                        <TableCell>{formatDate(task.deadline)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

type ReportRow = Awaited<ReturnType<typeof getReports>>[number];
type CampaignReportMetrics = {
  revenueToday?: number;
  adCostToday?: number;
  newContactsToday?: number;
  crrToday?: number;
  revenueCumulative?: number;
  adCostCumulative?: number;
  contactsCumulative?: number;
  crrTotal?: number;
  dailyKpiProgress?: number;
  assessment?: string;
};

function readCampaignReportMetrics(value: Json): CampaignReportMetrics {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const data = value as Record<string, Json | undefined>;
  const numberAt = (key: string) =>
    typeof data[key] === "number" ? data[key] : undefined;
  const textAt = (key: string) =>
    typeof data[key] === "string" ? data[key] : undefined;

  return {
    revenueToday: numberAt("revenue_today"),
    adCostToday: numberAt("ad_cost_today"),
    newContactsToday: numberAt("new_contacts_today"),
    crrToday: numberAt("crr_today"),
    revenueCumulative: numberAt("revenue_cumulative"),
    adCostCumulative: numberAt("ad_cost_cumulative"),
    contactsCumulative: numberAt("contacts_cumulative"),
    crrTotal: numberAt("crr_total"),
    dailyKpiProgress: numberAt("daily_kpi_progress_percent"),
    assessment: textAt("assessment") ?? textAt("note"),
  };
}

const reportVnd = (value: number | undefined) =>
  value === undefined ? "—" : formatVnd(value);
const reportNumber = (value: number | undefined) =>
  value === undefined ? "—" : formatNumber(value);
const reportPercent = (value: number | undefined) =>
  value === undefined ? "—" : formatPercent(value);

export function CampaignReportsPage({
  filters,
  onFilters,
}: {
  filters: CampaignReportFilters;
  onFilters: (filters: CampaignReportFilters) => void;
}) {
  const query = useQuery({
    queryKey: campaignKeys.reports(filters),
    queryFn: () => getReports(filters),
  });
  const campaigns = useQuery({
    queryKey: campaignKeys.list({}),
    queryFn: () => getCampaigns(),
  });
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const hasFilters = Boolean(filters.campaignId || filters.from || filters.to);
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Báo cáo Campaign</h1>
      <div className="flex flex-wrap gap-2 border-y py-3">
        <CampaignReportFilter
          campaigns={campaigns.data ?? []}
          disabled={campaigns.isPending}
          value={filters.campaignId}
          onChange={(campaignId) => onFilters({ ...filters, campaignId })}
        />
        <DatePicker
          className="w-44"
          value={filters.from}
          placeholder="Từ ngày báo cáo"
          max={filters.to}
          onChange={(from) => onFilters({ ...filters, from })}
        />
        <DatePicker
          className="w-44"
          value={filters.to}
          placeholder="Đến ngày báo cáo"
          min={filters.from}
          onChange={(to) => onFilters({ ...filters, to })}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => onFilters({})}>
            Xóa bộ lọc
          </Button>
        )}
      </div>
      {query.isPending ? (
        <PageLoading />
      ) : query.isError ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.data.length === 0 ? (
        <EmptyState>Chưa có báo cáo campaign nào được tạo.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <Table className="min-w-[1500px]">
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Ngày báo cáo</TableHead>
                <TableHead>Doanh thu ngày</TableHead>
                <TableHead>Chi phí ads ngày</TableHead>
                <TableHead>Contact ngày</TableHead>
                <TableHead>CRR ngày</TableHead>
                <TableHead>Doanh thu lũy kế</TableHead>
                <TableHead>Chi phí lũy kế</TableHead>
                <TableHead>CRR tổng</TableHead>
                <TableHead>Contact lũy kế</TableHead>
                <TableHead>% đạt KPI ngày</TableHead>
                <TableHead>Đánh giá</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data.map((report) => {
                const metrics = readCampaignReportMetrics(report.snapshot_data);
                return (
                  <TableRow key={report.id}>
                    <TableCell>{report.campaign?.name ?? "—"}</TableCell>
                    <TableCell>{formatDate(report.report_date)}</TableCell>
                    <TableCell>{reportVnd(metrics.revenueToday)}</TableCell>
                    <TableCell>{reportVnd(metrics.adCostToday)}</TableCell>
                    <TableCell>{reportNumber(metrics.newContactsToday)}</TableCell>
                    <TableCell>{reportPercent(metrics.crrToday)}</TableCell>
                    <TableCell>{reportVnd(metrics.revenueCumulative)}</TableCell>
                    <TableCell>{reportVnd(metrics.adCostCumulative)}</TableCell>
                    <TableCell>{reportPercent(metrics.crrTotal)}</TableCell>
                    <TableCell>{reportNumber(metrics.contactsCumulative)}</TableCell>
                    <TableCell>{reportPercent(metrics.dailyKpiProgress)}</TableCell>
                    <TableCell className="max-w-64 truncate">
                      {metrics.assessment || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelected(report)}
                      >
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          {selected && <ReportSnapshot report={selected} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CampaignReportFilter({
  campaigns,
  disabled,
  value,
  onChange,
}: {
  campaigns: Awaited<ReturnType<typeof getCampaigns>>;
  disabled: boolean;
  value?: string;
  onChange: (campaignId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = campaigns.find((campaign) => campaign.id === value);
  const filtered = campaigns.filter((campaign) =>
    campaign.name.toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")),
  );
  const choose = (campaignId?: string) => {
    onChange(campaignId);
    setSearch("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-56 justify-start font-normal"
          disabled={disabled}
        >
          <span className="mr-1 text-muted-foreground">Campaign:</span>
          <span className="truncate">{selected?.name ?? "Tất cả"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <Input
          autoFocus
          value={search}
          placeholder="Tìm campaign..."
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="mt-2 max-h-56 overflow-y-auto">
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
            onClick={() => choose()}
          >
            Tất cả
          </button>
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Không tìm thấy campaign.
            </p>
          ) : (
            filtered.map((campaign) => (
              <button
                type="button"
                key={campaign.id}
                className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => choose(campaign.id)}
              >
                {campaign.name}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
function ReportSnapshot({ report }: { report: ReportRow }) {
  const metrics = readCampaignReportMetrics(report.snapshot_data);
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Báo cáo {report.campaign?.name ?? "campaign"} ·{" "}
          {formatDate(report.report_date)}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-x-6 text-sm sm:grid-cols-2">
        <ReportValue label="Doanh thu ngày" value={reportVnd(metrics.revenueToday)} />
        <ReportValue label="Chi phí ads ngày" value={reportVnd(metrics.adCostToday)} />
        <ReportValue label="Contact ngày" value={reportNumber(metrics.newContactsToday)} />
        <ReportValue label="CRR ngày" value={reportPercent(metrics.crrToday)} />
        <ReportValue label="Doanh thu lũy kế" value={reportVnd(metrics.revenueCumulative)} />
        <ReportValue label="Chi phí lũy kế" value={reportVnd(metrics.adCostCumulative)} />
        <ReportValue label="CRR tổng" value={reportPercent(metrics.crrTotal)} />
        <ReportValue label="Contact lũy kế" value={reportNumber(metrics.contactsCumulative)} />
        <ReportValue label="% đạt KPI ngày" value={reportPercent(metrics.dailyKpiProgress)} />
        <ReportValue label="Đánh giá" value={metrics.assessment || "—"} />
      </div>
    </>
  );
}
function ReportValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

export function CampaignHistoryPage() {
  const campaigns = useQuery({
    queryKey: campaignKeys.list({}),
    queryFn: () => getCampaigns(),
  });
  const [campaignId, setCampaignId] = useState("");
  const metrics = useQuery({
    queryKey: campaignKeys.metrics(campaignId),
    queryFn: () => getMetrics(campaignId),
    enabled: Boolean(campaignId),
  });
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Lịch sử Campaign</h1>
      <select
        className="h-9 rounded-md border bg-card px-3 text-sm"
        value={campaignId}
        onChange={(event) => setCampaignId(event.target.value)}
      >
        <option value="">Chọn campaign</option>
        {campaigns.data?.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.name}
          </option>
        ))}
      </select>
      {metrics.isPending && campaignId ? (
        <PageLoading rows={3} />
      ) : (
        metrics.data && (
          <div className="grid gap-4 xl:grid-cols-3">
            <MetricChart
              title="Doanh thu theo ngày"
              data={metrics.data}
              field="revenue"
              formatter={formatVnd}
            />
            <MetricChart
              title="Chi phí ads theo ngày"
              data={metrics.data}
              field="ad_cost"
              formatter={formatVnd}
            />
            <MetricChart
              title="Contact mới theo ngày"
              data={metrics.data}
              field="new_contacts"
              formatter={(value) => String(value)}
            />
          </div>
        )
      )}
    </section>
  );
}
function MetricChart({
  title,
  data,
  field,
  formatter,
}: {
  title: string;
  data: Awaited<ReturnType<typeof getMetrics>>;
  field: "revenue" | "ad_cost" | "new_contacts";
  formatter: (value: number) => string;
}) {
  return (
    <div className="h-72 rounded-md border bg-card p-4">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="metric_date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
          />
          <YAxis tickFormatter={formatter} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={field}
            stroke="#2b6d97"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
