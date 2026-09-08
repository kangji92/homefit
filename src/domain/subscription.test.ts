import { describe, it, expect } from "vitest";
import { dDay, upcomingSubscriptions } from "./subscription";
import { MOCK_PRESALES } from "@/data/mock/presales";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";

describe("dDay", () => {
  it("남은 일수를 계산한다(과거면 음수)", () => {
    expect(dDay("2026-09-10", "2026-09-02")).toBe(8);
    expect(dDay("2026-09-02", "2026-09-02")).toBe(0);
    expect(dDay("2026-08-30", "2026-09-02")).toBe(-3);
  });
});

describe("upcomingSubscriptions", () => {
  it("분양 단지만 공고일 오름차순으로 반환한다", () => {
    const homes = [...MOCK_COMPLEXES, ...MOCK_PRESALES];
    const list = upcomingSubscriptions(homes, "2026-09-01");
    // 기존 아파트는 제외, presale만
    expect(list.every((x) => x.home.kind === "presale")).toBe(true);
    expect(list.length).toBe(MOCK_PRESALES.length);
    // 오름차순 정렬
    const dates = list.map((x) => x.date);
    expect(dates).toEqual([...dates].sort());
  });
});
