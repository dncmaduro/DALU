import { z } from "zod";

const estimatedHoursSchema = z
  .number({ error: "Nhập số giờ dự kiến." })
  .positive("Số giờ dự kiến phải lớn hơn 0.");

export const backlogSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Nhập tiêu đề backlog.")
    .max(240, "Tiêu đề tối đa 240 ký tự."),
  description: z
    .string()
    .trim()
    .max(4000, "Mô tả tối đa 4.000 ký tự.")
    .optional(),
});
export const assignmentSchema = z.object({
  category_id: z.string().uuid("Chọn phân loại."),
  deadline: z.string().min(1, "Chọn deadline."),
  complexity: z.enum(["low", "medium", "high"], {
    message: "Chọn độ phức tạp.",
  }),
  priority: z.enum(["low", "medium", "high", "urgent"], {
    message: "Chọn độ ưu tiên.",
  }),
  assigned_to: z.string().uuid("Chọn người phụ trách."),
  estimated_hours: estimatedHoursSchema,
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]),
});
export const taskCreateSchema = assignmentSchema.omit({ status: true }).extend({
  title: z
    .string()
    .trim()
    .min(1, "Nhập tiêu đề task.")
    .max(240, "Tiêu đề tối đa 240 ký tự."),
  description: z
    .string()
    .trim()
    .max(4000, "Mô tả tối đa 4.000 ký tự.")
    .optional(),
});
export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1, "Nhập tiêu đề."),
  description: z
    .string()
    .trim()
    .max(4000, "Mô tả tối đa 4.000 ký tự.")
    .optional(),
  category_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  deadline: z.string().nullable().optional(),
  complexity: z.enum(["low", "medium", "high"]).nullable().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).nullable().optional(),
  estimated_hours: estimatedHoursSchema.nullable().optional(),
  status: z.enum(["todo", "in_progress", "completed", "cancelled"]),
});
export type BacklogValues = z.infer<typeof backlogSchema>;
export type AssignmentValues = z.infer<typeof assignmentSchema>;
export type TaskCreateValues = z.infer<typeof taskCreateSchema>;
export type TaskUpdateValues = z.infer<typeof taskUpdateSchema>;
