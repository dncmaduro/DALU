import { describe, expect, it } from "vitest";
import { metricSchema } from "./campaign.schemas";

describe("metric schema", () => {
  it("rejects invalid metric values", () => {
    expect(
      metricSchema.safeParse({
        metric_date: "2026-08-07",
        revenue: -1,
        ad_cost: 0,
        new_contacts: 0,
      }).success,
    ).toBe(false);
    expect(
      metricSchema.safeParse({
        metric_date: "2026-08-07",
        revenue: 0,
        ad_cost: 0,
        new_contacts: 1.5,
      }).success,
    ).toBe(false);
  });

  it("accepts non-negative daily metrics", () => {
    expect(
      metricSchema.safeParse({
        metric_date: "2026-08-07",
        revenue: 100000,
        ad_cost: 12500,
        new_contacts: 4,
        assessment: "Hiệu quả tốt",
      }).success,
    ).toBe(true);
  });
});
