import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
export function PageLoading({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-10 animate-pulse rounded bg-muted" />
      ))}
    </div>
  );
}
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-2 border border-dashed px-6 text-center text-sm text-muted-foreground">
      <Inbox className="h-5 w-5" />
      {children}
    </div>
  );
}
export function ErrorState({
  error,
  retry,
}: {
  error: unknown;
  retry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Không thể tải dữ liệu.";
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 border border-dashed p-6 text-center">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-sm">{message}</p>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
