import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
const emailSchema = z.object({
  email: z.string().email("Nhập địa chỉ email hợp lệ."),
});
const passwordSchema = z
  .object({
    password: z.string().min(8, "Mật khẩu mới cần tối thiểu 8 ký tự."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Xác nhận mật khẩu chưa khớp.",
  });
export function ForgotPasswordPage() {
  const [busy, setBusy] = useState(false);
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const submit = async ({ email }: z.infer<typeof emailSchema>) => {
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error("Không thể gửi liên kết đặt lại mật khẩu.");
    toast.success("Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra email.");
  };
  return (
    <AuthSurface title="Quên mật khẩu">
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Email</Label>
          <Input
            id="recovery-email"
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <Button className="w-full" disabled={busy}>
          {busy ? "Đang gửi…" : "Gửi liên kết đặt lại mật khẩu"}
        </Button>
      </form>
      <Link
        className="mt-4 block text-center text-sm text-primary hover:underline"
        to="/"
      >
        Quay lại đăng nhập
      </Link>
    </AuthSurface>
  );
}
export function ResetPasswordPage() {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });
  const submit = async ({ password }: z.infer<typeof passwordSchema>) => {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error)
      return toast.error(
        "Không thể cập nhật mật khẩu. Liên kết có thể đã hết hạn.",
      );
    toast.success("Đã cập nhật mật khẩu.");
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  };
  return (
    <AuthSurface title="Đặt lại mật khẩu">
      <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <div className="space-y-2">
          <Label htmlFor="new-password">Mật khẩu mới</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            {...form.register("confirmPassword")}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>
        <Button className="w-full" disabled={busy}>
          {busy ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
        </Button>
      </form>
    </AuthSurface>
  );
}
function AuthSurface({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-6 text-lg font-semibold">{title}</h1>
        {children}
      </section>
    </main>
  );
}
