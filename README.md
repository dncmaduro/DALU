# DALU Task

Ứng dụng quản trị nội bộ cho Task và KPI Campaign Ads, xây dựng bằng React, Vite, TypeScript, Supabase, TanStack Query/Router/Table, React Hook Form, Zod, Tailwind và các primitive shadcn-style.

## Chạy dự án

1. Cài Node.js 22+ và Yarn Classic (1.22+).
2. Sao chép `.env.example` thành `.env.local`.
3. Điền `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (anon key, không dùng service role key).
4. Chạy `yarn install` và `yarn dev`.

Ứng dụng development chạy tại `http://localhost:4476`.

Các lệnh kiểm tra:

```bash
yarn typecheck
yarn lint
yarn test
yarn build
```

## Supabase

Project dùng `src/types/database.types.ts` làm nguồn type cho toàn bộ bảng, enum và RPC. Client chỉ đọc hai biến môi trường Vite, không hardcode credential.

RLS phải cho phép đúng các hành vi sau: đọc profile/task/campaign/report theo chính sách nghiệp vụ; member tạo backlog và cập nhật task không đổi assignee; admin giao backlog và quản lý taxonomy/campaign; chỉ assignee hoặc admin upsert metric và gọi `generate_campaign_report`.

RPC cần có:

- `get_task_week_summary(p_week_start, p_as_of_date?)`
- `get_task_weekly_by_type(p_week_start, p_as_of_date?)`
- `generate_campaign_report(p_campaign_id, p_metric_date)`

## Cấu trúc

- `src/features/auth`: session và đăng nhập
- `src/features/tasks`: API, schema, bảng task/backlog, báo cáo tuần
- `src/features/campaigns`: campaign, metric và preview báo cáo
- `src/features/reports`: report snapshot và lịch sử biểu đồ
- `src/app`: router và app shell
- `src/lib`: Supabase, format ngày/tiền/tỷ lệ, permission và query client
