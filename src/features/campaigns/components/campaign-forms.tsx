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
  campaignSchema,
  metricSchema,
  type CampaignValues,
  type MetricValues,
} from "../schemas/campaign.schemas";
import { campaignKeys, saveCampaign, upsertMetric } from "../api/campaigns.api";
import type { CampaignWithAssignee } from "../types";
import { getTaskTaxonomy } from "@/features/tasks/api/tasks.api";
import { taskKeys } from "@/features/tasks/api/tasks.api";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/components/auth-provider";
import { DatePicker } from "@/components/shared/date-picker";
import { FormattedNumberInput } from "@/components/shared/formatted-number-input";

export function CampaignForm({
  campaign,
  done,
}: {
  campaign?: CampaignWithAssignee;
  done: () => void;
}) {
  const { profile } = useAuth();
  const client = useQueryClient();
  const people = useQuery({
    queryKey: taskKeys.taxonomy(),
    queryFn: getTaskTaxonomy,
  });
  const form = useForm<CampaignValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name ?? "",
      description: campaign?.description ?? "",
      start_date: campaign?.start_date ?? "",
      end_date: campaign?.end_date ?? "",
      revenue_kpi: campaign?.revenue_kpi ?? 0,
      crr_kpi: campaign?.crr_kpi ?? 0,
      assigned_to: campaign?.assigned_to ?? "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: CampaignValues) =>
      saveCampaign(
        {
          ...values,
          description: values.description || null,
          created_by: profile?.id,
        },
        campaign?.id,
      ),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success(campaign ? "Đã cập nhật campaign." : "Đã tạo campaign.");
      done();
    },
    onError: (error: Error) =>
      toast.error("Không thể lưu campaign", { description: error.message }),
  });
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <Field
        label="Tên campaign"
        error={form.formState.errors.name?.message}
        className="sm:col-span-2"
      >
        <Input {...form.register("name")} />
      </Field>
      <Field label="Mô tả" className="sm:col-span-2">
        <Textarea {...form.register("description")} />
      </Field>
      <Field
        label="Ngày bắt đầu"
        error={form.formState.errors.start_date?.message}
      >
        <DatePicker
          value={form.watch("start_date")}
          onChange={(value) =>
            form.setValue("start_date", value ?? "", { shouldValidate: true })
          }
        />
      </Field>
      <Field
        label="Ngày kết thúc"
        error={form.formState.errors.end_date?.message}
      >
        <DatePicker
          value={form.watch("end_date")}
          onChange={(value) =>
            form.setValue("end_date", value ?? "", { shouldValidate: true })
          }
        />
      </Field>
      <Field
        label="KPI doanh thu"
        error={form.formState.errors.revenue_kpi?.message}
      >
        <FormattedNumberInput
          value={form.watch("revenue_kpi")}
          onValueChange={(value) =>
            form.setValue("revenue_kpi", value ?? 0, { shouldValidate: true })
          }
        />
      </Field>
      <Field label="KPI CRR (%)" error={form.formState.errors.crr_kpi?.message}>
        <FormattedNumberInput
          value={form.watch("crr_kpi")}
          onValueChange={(value) =>
            form.setValue("crr_kpi", value as CampaignValues["crr_kpi"], {
              shouldValidate: true,
            })
          }
          decimalScale={2}
          suffix="%"
          allowDecimal
          zeroWhenEmptyOnBlur
        />
      </Field>
      <div className="space-y-2 sm:col-span-2">
        <Label>Người phụ trách</Label>
        <Select
          value={form.watch("assigned_to")}
          onValueChange={(value) =>
            form.setValue("assigned_to", value, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn người phụ trách" />
          </SelectTrigger>
          <SelectContent>
            {people.data?.profiles.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {person.full_name || person.email || "Chưa có tên"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.assigned_to && (
          <p className="text-xs text-destructive">
            {form.formState.errors.assigned_to.message}
          </p>
        )}
      </div>
      <div className="col-span-full flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={done}>
          Hủy
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang lưu…" : "Lưu campaign"}
        </Button>
      </div>
    </form>
  );
}

export function MetricForm({
  campaign,
  submitted,
}: {
  campaign: CampaignWithAssignee;
  submitted: (values: MetricValues) => void;
}) {
  const { profile } = useAuth();
  const client = useQueryClient();
  const form = useForm<MetricValues>({
    resolver: zodResolver(metricSchema),
    defaultValues: {
      metric_date: new Date().toISOString().slice(0, 10),
      revenue: 0,
      ad_cost: 0,
      new_contacts: 0,
      assessment: "",
    },
  });
  const mutation = useMutation({
    mutationFn: (values: MetricValues) => {
      if (
        values.metric_date < campaign.start_date ||
        values.metric_date > campaign.end_date
      )
        throw new Error(
          "Ngày cập nhật phải nằm trong thời gian chạy campaign.",
        );
      return upsertMetric(campaign.id, {
        ...values,
        assessment: values.assessment || null,
        created_by: profile?.id,
        updated_by: profile?.id,
      });
    },
    onSuccess: (_data, values) => {
      void client.invalidateQueries({
        queryKey: campaignKeys.metrics(campaign.id),
      });
      void client.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success("Số liệu đã được cập nhật.");
      submitted(values);
    },
    onError: (error: Error) =>
      toast.error("Không thể cập nhật số liệu", { description: error.message }),
  });
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <Field
        label="Ngày cập nhật"
        error={form.formState.errors.metric_date?.message}
      >
        <DatePicker
          value={form.watch("metric_date")}
          min={campaign.start_date}
          max={campaign.end_date}
          onChange={(value) =>
            form.setValue("metric_date", value ?? "", { shouldValidate: true })
          }
        />
      </Field>
      <Field label="Doanh thu" error={form.formState.errors.revenue?.message}>
        <FormattedNumberInput
          value={form.watch("revenue")}
          onValueChange={(value) =>
            form.setValue("revenue", value ?? 0, { shouldValidate: true })
          }
        />
      </Field>
      <Field
        label="Chi phí ads"
        error={form.formState.errors.ad_cost?.message}
      >
        <FormattedNumberInput
          value={form.watch("ad_cost")}
          onValueChange={(value) =>
            form.setValue("ad_cost", value ?? 0, {
              shouldValidate: true,
            })
          }
        />
      </Field>
      <Field
        label="Contact mới"
        error={form.formState.errors.new_contacts?.message}
      >
        <FormattedNumberInput
          value={form.watch("new_contacts")}
          onValueChange={(value) =>
            form.setValue("new_contacts", value ?? 0, { shouldValidate: true })
          }
        />
      </Field>
      <Field label="Đánh giá" className="sm:col-span-2">
        <Textarea {...form.register("assessment")} />
      </Field>
      <div className="col-span-full flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Đang lưu…" : "Lưu số liệu"}
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
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
