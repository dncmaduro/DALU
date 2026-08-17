import { Fragment, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Megaphone,
  Settings,
  Tags,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/features/auth/components/auth-provider";
import { isAdmin } from "@/lib/permissions";
import { toast } from "sonner";

type NavItem = {
  to:
    | "/"
    | "/tasks"
    | "/backlog"
    | "/task-reports"
    | "/campaigns"
    | "/campaign-reports"
    | "/admin";
  label: string;
  icon: typeof LayoutDashboard;
};
const workItems: NavItem[] = [
  { to: "/tasks", label: "Task", icon: CheckSquare },
  { to: "/backlog", label: "Backlog", icon: ClipboardList },
  { to: "/task-reports", label: "Báo cáo task", icon: BarChart3 },
];
const campaignItems: NavItem[] = [
  { to: "/campaigns", label: "Campaign", icon: Megaphone },
  { to: "/campaign-reports", label: "Báo cáo Campaign", icon: ClipboardList },
];
type AppRoute = NavItem["to"] | "/campaign-history";
type BreadcrumbItem = { label: string; to?: AppRoute };

const homeBreadcrumb: BreadcrumbItem = { label: "Tổng quan", to: "/" };
const breadcrumbItems: Record<string, BreadcrumbItem[]> = {
  "/": [{ label: "Tổng quan" }],
  "/tasks": [homeBreadcrumb, { label: "Task" }],
  "/backlog": [homeBreadcrumb, { label: "Backlog" }],
  "/task-reports": [homeBreadcrumb, { label: "Báo cáo task" }],
  "/campaigns": [homeBreadcrumb, { label: "Campaign" }],
  "/campaign-reports": [
    homeBreadcrumb,
    { label: "Campaign", to: "/campaigns" },
    { label: "Báo cáo Campaign" },
  ],
  "/campaign-history": [
    homeBreadcrumb,
    { label: "Campaign", to: "/campaigns" },
    { label: "Lịch sử Campaign" },
  ],
  "/admin": [homeBreadcrumb, { label: "Loại & phân loại task" }],
};

function getBreadcrumbs(pathname: string) {
  if (pathname.startsWith("/tasks/")) {
    const label = pathname.endsWith("/edit")
      ? "Chỉnh sửa task"
      : "Chi tiết task";
    return [homeBreadcrumb, { label: "Task", to: "/tasks" }, { label }];
  }
  if (pathname.startsWith("/campaigns/"))
    return [
      homeBreadcrumb,
      { label: "Campaign", to: "/campaigns" },
      { label: "Chi tiết campaign" },
    ];

  return breadcrumbItems[pathname] ?? [homeBreadcrumb];
}
function initials(value: string | null | undefined) {
  return (value ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
function isItemActive(pathname: string, item: NavItem) {
  return (
    pathname === item.to ||
    (item.to === "/campaigns" && pathname.startsWith("/campaigns/"))
  );
}
function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { profile } = useAuth();
  const location = useLocation();
  const groups: { label?: string; items: NavItem[] }[] = [
    { items: [{ to: "/", label: "Tổng quan", icon: LayoutDashboard }] },
    { label: "QUẢN LÝ CÔNG VIỆC", items: workItems },
    { label: "CAMPAIGN ADS", items: campaignItems },
  ];
  if (isAdmin(profile))
    groups.push({
      label: "QUẢN TRỊ",
      items: [{ to: "/admin", label: "Loại & phân loại task", icon: Tags }],
    });
  return (
    <nav className="space-y-4 p-2">
      {groups.map((group, index) => (
        <div key={group.label ?? "home"} className={index === 0 ? "" : "pt-1"}>
          {group.label && (
            <p
              className={`mb-1 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground ${collapsed ? "sr-only" : ""}`}
            >
              {group.label}
            </p>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(location.pathname, item);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={`flex h-9 items-center rounded-md text-sm transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-2"} ${active ? "bg-secondary font-medium text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={collapsed ? "sr-only" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const crumbs = getBreadcrumbs(location.pathname);
  const logout = async () => {
    try {
      await signOut();
      await navigate({ to: "/" });
      toast.success("Đã đăng xuất.");
    } catch {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    }
  };
  return (
    <div
      className="min-h-screen lg:grid"
      style={{ gridTemplateColumns: collapsed ? "64px 1fr" : "240px 1fr" }}
    >
      <aside className="hidden border-r bg-card lg:flex lg:flex-col">
        <div className="flex h-14 items-center border-b px-3">
          <span
            className={`font-semibold tracking-tight ${collapsed ? "sr-only" : ""}`}
          >
            DALU Task
          </span>
          <Button
            className="ml-auto"
            variant="ghost"
            size="icon"
            aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
        <SidebarNav collapsed={collapsed} />
      </aside>
      <div className="min-w-0">
        <header className="flex h-14 items-center justify-between border-b bg-card px-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  className="lg:hidden"
                  variant="ghost"
                  size="icon"
                  aria-label="Mở menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="mb-5 text-sm font-semibold">DALU Task</div>
                <SidebarNav
                  collapsed={false}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <nav
              aria-label="Điều hướng phân cấp"
              className="flex min-w-0 items-center gap-2 text-sm"
            >
              {crumbs.map((crumb, index) => {
                const isCurrent = index === crumbs.length - 1;
                return (
                  <Fragment key={`${crumb.label}-${index}`}>
                    {index > 0 && (
                      <span className="shrink-0 text-muted-foreground">/</span>
                    )}
                    {crumb.to && !isCurrent ? (
                      <Link
                        to={crumb.to}
                        className="truncate font-medium hover:text-primary hover:underline"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isCurrent ? "page" : undefined}
                        className={`truncate ${isCurrent ? "text-muted-foreground" : "font-medium"}`}
                      >
                        {crumb.label}
                      </span>
                    )}
                  </Fragment>
                );
              })}
            </nav>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 max-w-56 gap-2"
                aria-label="Mở menu người dùng"
              >
                <Avatar>
                  {initials(profile?.full_name || profile?.email)}
                </Avatar>
                <span className="hidden truncate sm:inline">
                  {profile?.full_name || profile?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {profile?.full_name || profile?.email}
                <span className="mt-0.5 block font-normal">
                  {isAdmin(profile) ? "Quản trị viên" : "Thành viên"}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto max-w-[1680px] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
