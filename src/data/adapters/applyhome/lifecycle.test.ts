import { describe, it, expect } from "vitest";
import { deriveLifecyclePhase } from "./adapt";

const dates = {
  recruitDate: "2026-09-04",
  receiptBegin: "2026-09-15",
  receiptEnd: "2026-09-17",
  moveInYm: "202710",
};

describe("deriveLifecyclePhase", () => {
  it("공고 전 → planned", () => {
    expect(deriveLifecyclePhase(dates, "2026-09-01")).toBe("planned");
  });
  it("공고~접수 전 → subscription_scheduled", () => {
    expect(deriveLifecyclePhase(dates, "2026-09-10")).toBe("subscription_scheduled");
  });
  it("접수 기간 → subscription_open", () => {
    expect(deriveLifecyclePhase(dates, "2026-09-16")).toBe("subscription_open");
    expect(deriveLifecyclePhase(dates, "2026-09-17")).toBe("subscription_open");
  });
  it("접수 종료 후~입주 전 → subscription_closed (전매 단계 단정 안 함)", () => {
    expect(deriveLifecyclePhase(dates, "2026-12-01")).toBe("subscription_closed");
  });
  it("입주월 이후 → occupied", () => {
    expect(deriveLifecyclePhase(dates, "2027-10-01")).toBe("occupied");
    expect(deriveLifecyclePhase(dates, "2028-01-01")).toBe("occupied");
  });
  it("날짜 일부 없어도 best-effort", () => {
    expect(deriveLifecyclePhase({ moveInYm: "202001" }, "2026-01-01")).toBe("occupied");
    expect(deriveLifecyclePhase({}, "2026-01-01")).toBe("subscription_closed");
  });
});
