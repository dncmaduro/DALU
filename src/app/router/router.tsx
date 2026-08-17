import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/app/layouts/app-shell";
import { LoginPage } from "@/features/auth/components/login-page";
import {
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/features/auth/components/password-recovery-pages";
import { useAuth } from "@/features/auth/components/auth-provider";
import { PageLoading, ErrorState } from "@/components/shared/states";
import {
  TaskDetailPage,
  TaskPage,
} from "@/features/tasks/components/task-page";
import {
  CampaignDetailPage,
  CampaignPage,
} from "@/features/campaigns/components/campaign-page";
import {
  CampaignHistoryPage,
  CampaignReportsPage,
  TaskReportPage,
} from "@/features/reports/components/reports-pages";
import { AdminPage } from "@/features/admin/components/admin-page";
import type {
  CampaignFilters,
  CampaignReportFilters,
} from "@/features/campaigns/types";
import type { TaskFilters } from "@/features/tasks/types";
import { isAdmin } from "@/lib/permissions";
import { useQuery } from "@tanstack/react-query";
import { getTasks, taskKeys } from "@/features/tasks/api/tasks.api";
import {
  campaignKeys,
  getCampaigns,
} from "@/features/campaigns/api/campaigns.api";
import { formatDate, formatVnd } from "@/lib/format";

type RouterContext = { queryClient: QueryClient };
const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});
const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});
const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
});
const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tasks",
  validateSearch: (search: Record<string, unknown>): TaskFilters => ({
    search: typeof search.search === "string" ? search.search : undefined,
    status:
      typeof search.status === "string"
        ? (search.status as TaskFilters["status"])
        : undefined,
    categoryId:
      typeof search.categoryId === "string" ? search.categoryId : undefined,
    assigneeId:
      typeof search.assigneeId === "string" ? search.assigneeId : undefined,
    priority:
      typeof search.priority === "string"
        ? (search.priority as TaskFilters["priority"])
        : undefined,
    complexity:
      typeof search.complexity === "string"
        ? (search.complexity as TaskFilters["complexity"])
        : undefined,
    deadline:
      typeof search.deadline === "string"
        ? (search.deadline as TaskFilters["deadline"])
        : undefined,
  }),
  component: TasksScreen,
});
const backlogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/backlog",
  component: BacklogScreen,
});
const taskDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tasks/$taskId",
  component: TaskDetailScreen,
});
const taskEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tasks/$taskId/edit",
  component: TaskEditScreen,
});
const taskReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/task-reports",
  component: TaskReportPage,
});
const campaignsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/campaigns",
  validateSearch: (search: Record<string, unknown>): CampaignFilters => ({
    assigneeId:
      typeof search.assigneeId === "string" ? search.assigneeId : undefined,
  }),
  component: CampaignScreen,
});
const campaignDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/campaigns/$campaignId",
  component: CampaignDetailScreen,
});
const campaignReportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/campaign-reports",
  validateSearch: (search: Record<string, unknown>): CampaignReportFilters => ({
    campaignId:
      typeof search.campaignId === "string" ? search.campaignId : undefined,
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
  }),
  component: CampaignReportsScreen,
});
const campaignHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/campaign-history",
  component: CampaignHistoryPage,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminScreen,
});
const routeTree = rootRoute.addChildren([
  indexRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  tasksRoute,
  backlogRoute,
  taskDetailRoute,
  taskEditRoute,
  taskReportsRoute,
  campaignsRoute,
  campaignDetailRoute,
  campaignReportsRoute,
  campaignHistoryRoute,
  adminRoute,
]);
export const router = createRouter({
  routeTree,
  context: { queryClient: undefined! },
});
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
function RootComponent() {
  const { session, profile, loading, error, refreshProfile } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <main className="p-6">
        <PageLoading />
      </main>
    );
  if (error)
    return (
      <main className="p-6">
        <ErrorState error={error} retry={() => void refreshProfile()} />
      </main>
    );
  if (
    location.pathname === "/forgot-password" ||
    location.pathname === "/reset-password"
  )
    return <Outlet />;
  if (!session) return <LoginPage />;
  if (!profile?.is_active)
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <div className="max-w-md rounded-md border bg-card p-6 text-center">
          <h1 className="font-semibold">Tài khoản không hoạt động</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Liên hệ quản trị viên để được hỗ trợ.
          </p>
        </div>
      </main>
    );
  return <AppShell />;
}
function DashboardPage() {
  const tasks = useQuery({
    queryKey: taskKeys.list({}),
    queryFn: () => getTasks(),
  });
  const campaigns = useQuery({
    queryKey: campaignKeys.list({}),
    queryFn: () => getCampaigns(),
  });
  const today = new Date().toISOString().slice(0, 10);
  const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3 } as const;
  const attentionTasks = (tasks.data ?? [])
    .filter(
      (task) =>
        task.status !== "backlog" &&
        task.status !== "completed" &&
        task.status !== "cancelled" &&
        (task.deadline === today ||
          (task.deadline !== null && task.deadline < today) ||
          task.status === "in_progress"),
    )
    .sort((left, right) => {
      const urgency = (task: NonNullable<typeof tasks.data>[number]) =>
        task.deadline && task.deadline < today
          ? 0
          : task.deadline === today
            ? 1
            : 2;
      const urgencyDifference = urgency(left) - urgency(right);
      if (urgencyDifference) return urgencyDifference;
      const priorityDifference =
        priorityRank[left.priority ?? "low"] - priorityRank[right.priority ?? "low"];
      if (priorityDifference) return priorityDifference;
      return (left.deadline ?? "9999-12-31").localeCompare(
        right.deadline ?? "9999-12-31",
      );
    })
    .slice(0, 3);
  return (
    <section className="space-y-5">
      <h1 className="text-xl font-semibold">Tổng quan</h1>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr]">
        <section className="overflow-hidden rounded-md border bg-card">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
            <h2 className="font-semibold">Công việc cần chú ý</h2>
            <span className="text-xs text-muted-foreground">
              Dữ liệu hiện tại
            </span>
          </div>
          <div className="divide-y">
            {tasks.isPending ? (
              <p className="p-4 text-sm text-muted-foreground">
                Đang tải công việc…
              </p>
            ) : attentionTasks.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Không có task cần chú ý tại thời điểm này.
              </p>
            ) : (
              attentionTasks.map((task) => {
                const label =
                  task.deadline && task.deadline < today
                    ? "Quá hạn"
                    : task.deadline === today
                      ? "Deadline hôm nay"
                      : "Đang thực hiện";
                return (
                  <div className="flex items-start justify-between gap-4 p-4" key={task.id}>
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {label}
                        {task.deadline ? ` · ${formatDate(task.deadline)}` : ""}
                      </p>
                    </div>
                    <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                      {task.priority === "urgent"
                        ? "Khẩn"
                        : task.priority === "high"
                          ? "Cao"
                          : task.priority === "medium"
                            ? "Trung bình"
                            : "Thấp"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
        <section className="overflow-hidden rounded-md border bg-card">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
            <h2 className="font-semibold">Campaign gần đây</h2>
          </div>
          <div className="divide-y">
            {campaigns.isPending ? (
              <p className="p-4 text-sm text-muted-foreground">
                Đang tải campaign…
              </p>
            ) : campaigns.data?.length ? (
              campaigns.data.slice(0, 4).map((campaign) => (
                <div className="p-4" key={campaign.id}>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {campaign.assignee?.full_name ||
                      campaign.assignee?.email ||
                      "Chưa có người phụ trách"}{" "}
                    · {formatDate(campaign.end_date)}
                  </p>
                  <p className="mt-2 text-sm">
                    KPI doanh thu: {formatVnd(campaign.revenue_kpi)}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-muted-foreground">
                Chưa có campaign nào.
              </p>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
function TasksScreen() {
  const search = tasksRoute.useSearch();
  const navigate = useNavigate();
  return (
    <TaskPage
      filters={search}
      onFilters={(next) =>
        void navigate({ to: "/tasks", search: next, replace: true })
      }
    />
  );
}
function BacklogScreen() {
  return (
    <TaskPage
      filters={{ status: "backlog" }}
      onFilters={() => undefined}
      backlogOnly
    />
  );
}
function TaskDetailScreen() {
  const { taskId } = taskDetailRoute.useParams();
  return <TaskDetailPage taskId={taskId} />;
}
function TaskEditScreen() {
  const { taskId } = taskEditRoute.useParams();
  return <TaskDetailPage taskId={taskId} mode="edit" />;
}
function CampaignScreen() {
  const search = campaignsRoute.useSearch();
  const navigate = useNavigate();
  return (
    <CampaignPage
      filters={search}
      onFilters={(next) =>
        void navigate({ to: "/campaigns", search: next, replace: true })
      }
    />
  );
}
function CampaignDetailScreen() {
  const { campaignId } = campaignDetailRoute.useParams();
  return <CampaignDetailPage campaignId={campaignId} />;
}
function CampaignReportsScreen() {
  const search = campaignReportsRoute.useSearch();
  const navigate = useNavigate();
  return (
    <CampaignReportsPage
      filters={search}
      onFilters={(next) =>
        void navigate({ to: "/campaign-reports", search: next, replace: true })
      }
    />
  );
}
function AdminScreen() {
  const { profile } = useAuth();
  return isAdmin(profile) ? (
    <AdminPage />
  ) : (
    <section>
      <h1 className="text-xl font-semibold">Không có quyền truy cập</h1>
    </section>
  );
}
