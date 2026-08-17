import { z } from "zod";
export const campaignSchema = z
  .object({
    name: z.string().trim().min(1, "Nhập tên campaign.").max(240),
    description: z.string().trim().max(4000).optional(),
    start_date: z.string().min(1, "Chọn ngày bắt đầu."),
    end_date: z.string().min(1, "Chọn ngày kết thúc."),
    revenue_kpi: z.number().min(0, "KPI doanh thu phải từ 0."),
    crr_kpi: z
      .number({ error: "Nhập KPI CRR." })
      .min(0, "KPI CRR phải từ 0."),
    assigned_to: z.string().uuid("Chọn người phụ trách."),
  })
  .refine((data) => data.end_date >= data.start_date, {
    path: ["end_date"],
    message: "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.",
  });
export const metricSchema = z.object({
  metric_date: z.string().min(1, "Chọn ngày cập nhật."),
  revenue: z.number().min(0, "Doanh thu phải từ 0."),
  ad_cost: z.number().min(0, "Chi phí ads phải từ 0."),
  new_contacts: z
    .number()
    .int("Contact mới phải là số nguyên.")
    .min(0, "Contact mới phải từ 0."),
  assessment: z.string().trim().max(2000).optional(),
});
export type CampaignValues = z.infer<typeof campaignSchema>;
export type MetricValues = z.infer<typeof metricSchema>;
