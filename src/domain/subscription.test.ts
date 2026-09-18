import { describe, it, expect } from "vitest";
import { dDay, upcomingSubscriptions, subscriptionNotices } from "./subscription";
import { MOCK_PRESALES } from "@/data/mock/presales";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import type { PresaleHome } from "./types";

const presale = (id: string, announcementDate: string): PresaleHome =>
  ({ kind: "presale", id, name: id, regionId: "x", price: {}, sizesPyeong: [], commuteMinutes: {}, metrics: { education: 0, infrastructure: 0, environment: 0, futurePotential: 0 }, moveInYear: 2029, subscription: { announcementDate } }) as PresaleHome;

describe("subscriptionNotices", () => {
  it("±windowdays 내 공고만 종류별로(예정/오늘/신규) 최신순", () => {
    const homes = [
      presale("far-future", "2026-11-01"), // D+44 → window 밖(21일)
      presale("soon", "2026-09-25"), // D+7 → scheduled
      presale("today", "2026-09-18"), // 오늘
      presale("recent", "2026-09-10"), // -8 → new
      presale("old", "2026-07-01"), // window 밖
    ];
    const n = subscriptionNotices(homes, "2026-09-18");
    expect(n.map((x) => x.home.id)).toEqual(["soon", "today", "recent"]); // 최신순, window 내
    expect(n.find((x) => x.home.id === "soon")?.kind).toBe("scheduled");
    expect(n.find((x) => x.home.id === "today")?.kind).toBe("today");
    expect(n.find((x) => x.home.id === "recent")?.kind).toBe("new");
  });
});

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
