import { describe, it, expect } from "vitest";
import { REAL_PRESALES_GWANGMYEONG } from "./presales.gwangmyeong";
import { homeRepository } from "@/data/repositories";
import { upcomingSubscriptions } from "@/domain/subscription";

describe("광명 실분양(공개 확인값)", () => {
  it("시티프라디움(분양가 미정)·철헤 무순위를 담는다", () => {
    const city = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-city-pradium");
    expect(city?.kind).toBe("presale");
    // 분양가 미확정 매물은 임의 추정 없이 sale 비움
    expect(city?.price.sale).toBeUndefined();
  });

  it("[정정] 광명=비규제 → 전매 1년(12개월)·재당첨 미적용·통장 12개월(법정 룰). 실거주는 공고 확인", () => {
    const city = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-city-pradium");
    const c = city?.subscription?.conditions;
    expect(c?.regulatedArea).toBe("none"); // 조정대상 아님(청약홈 공고 기준)
    expect(c?.resaleRestrictionMonths).toBe(12); // 과밀억제 1년
    expect(c?.rewinLimit).toBe(false);
    expect(c?.subscriptionAccount?.minMonths).toBe(12);
    expect(c?.mandatoryResidenceMonths).toBeUndefined();
    // 무순위는 청약통장 불필요(별도)
    const heritage = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-cheolsan-heritage-unranked");
    expect(heritage?.subscription?.conditions?.subscriptionAccount?.required).toBe(false);
  });

  it("무순위 청약(철헤)도 type=unranked로 담고 청약 일정에 포함된다", () => {
    const heritage = REAL_PRESALES_GWANGMYEONG.find((p) => p.id === "presale-gwangmyeong-cheolsan-heritage-unranked");
    expect(heritage?.subscription?.type).toBe("unranked");
    expect(heritage?.subscription?.announcementDate).toBe("2026-09-22");
    expect(heritage?.price.sale?.representative).toBe(75700);
  });

  it("homeRepository에 병합되고, 시티프라디움·무순위가 '다가오는 청약'에 뜬다", async () => {
    const all = await homeRepository.list();
    const subs = upcomingSubscriptions(all, "2026-09-18");
    expect(subs.some((s) => s.home.id === "presale-gwangmyeong-city-pradium")).toBe(true);
    expect(subs.some((s) => s.home.id === "presale-gwangmyeong-cheolsan-heritage-unranked")).toBe(true);
  });

  it("청약홈 openAPI 스냅샷(APPLYHOME_PRESALES)도 분양 목록에 병합된다", async () => {
    const all = await homeRepository.list();
    // openAPI 스냅샷은 실 분양가·평형을 가진 presale — 최소 하나 이상 병합.
    expect(all.filter((h) => h.kind === "presale").length).toBeGreaterThan(REAL_PRESALES_GWANGMYEONG.length);
  });
});
