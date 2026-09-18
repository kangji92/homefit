import { describe, it, expect } from "vitest";
import { REAL_PRESALES_GWANGMYEONG } from "./presales.gwangmyeong";
import { homeRepository } from "@/data/repositories";
import { upcomingSubscriptions } from "@/domain/subscription";

describe("광명 실분양(공개 확인값)", () => {
  it("철산역자이(확정 분양가) + 시티프라디움(분양가 미정)을 담는다", () => {
    const xi = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-cheolsan-xi");
    expect(xi?.kind).toBe("presale");
    expect(xi?.price.sale?.representative).toBe(150000);
    expect(xi?.households).toBe(2045);
    // 분양가 미확정 매물은 임의 추정 없이 sale 비움
    const city = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-city-pradium");
    expect(city?.price.sale).toBeUndefined();
  });

  it("청약 공고 조건(조정대상지역·무주택 등)을 담되 정확 수치는 미확인(공고 확인)", () => {
    const city = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-city-pradium");
    const c = city?.subscription?.conditions;
    expect(c?.regulatedArea).toBe("adjustment");
    expect(c?.homelessRequired).toBe(true);
    // 전매제한·실거주 정확 개월은 임의 추정 금지 → undefined
    expect(c?.resaleRestrictionMonths).toBeUndefined();
    // 무순위는 청약통장 불필요
    const heritage = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-cheolsan-heritage-unranked");
    expect(heritage?.subscription?.conditions?.subscriptionAccount?.required).toBe(false);
  });

  it("무순위 청약(철산자이 더 헤리티지)도 type=unranked로 담고 청약 일정에 포함된다", () => {
    const heritage = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-cheolsan-heritage-unranked");
    expect(heritage?.subscription?.type).toBe("unranked");
    expect(heritage?.subscription?.announcementDate).toBe("2026-09-22");
    expect(heritage?.price.sale?.representative).toBe(75700);
  });

  it("homeRepository에 병합되고, 시티프라디움·무순위 모두 '다가오는 청약'에 뜬다", async () => {
    const all = await homeRepository.list();
    expect(all.some((h) => h.id === "presale-gwangmyeong-cheolsan-xi")).toBe(true);
    // 모집공고일이 있어 청약 목록에 포함(일반 + 무순위)
    const subs = upcomingSubscriptions(all, "2026-09-18");
    expect(subs.some((s) => s.home.id === "presale-gwangmyeong-city-pradium")).toBe(true);
    expect(subs.some((s) => s.home.id === "presale-gwangmyeong-cheolsan-heritage-unranked")).toBe(true);
  });

  it("지역 필터(gwangmyeong)로도 조회된다", async () => {
    const gm = await homeRepository.list({ regionId: "gwangmyeong" });
    expect(gm.length).toBeGreaterThanOrEqual(2);
    expect(gm.every((h) => h.regionId === "gwangmyeong")).toBe(true);
  });
});
