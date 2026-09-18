import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { DEFAULT_SUBSCRIPTION_POLICY as P } from "@/domain/eligibility/policy";

// 도시근로자 월평균소득 100%(만원) — 정확화된 정책값 재사용. 특공은 '3인 이하' 브래킷.
const INCOME_ROWS = [
  { size: "3인 이하", v: P.urbanIncome100Manwon[3] },
  { size: "4인", v: P.urbanIncome100Manwon[4] },
  { size: "5인", v: P.urbanIncome100Manwon[5] },
];

// 특별공급 소득기준(민영) — 청약홈 청약제도안내(2025) 확인분. 미확인은 '공고 확인'.
const SPECIAL_INCOME = [
  { name: "신혼부부", tiers: "우선 100%↓(외벌이)·120%↓(맞벌이) / 일반 140·160%↓ / 추첨 140·160% 초과" },
  { name: "생애최초", tiers: "우선 130%↓ / 일반 160%↓ / 추첨 160% 초과" },
  { name: "신생아", tiers: "우선 130%↓ / 일반 160%↓" },
  { name: "다자녀", tiers: "소득 120%↓ (세부 공고 확인)" },
  { name: "노부모부양", tiers: "무주택 세대주 · 소득기준 공고 확인" },
];

/** 청약 자격 안내 — 청약홈 청약제도안내(2025) 요약(참고용). 정확·최신 값은 청약홈/공고 확인. */
export function SubscriptionGuideFeature() {
  return (
    <PageContainer className="max-w-2xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">청약 자격 안내</h1>
        <p className="text-muted-foreground text-sm">
          청약홈 청약제도안내(2025) 요약이에요. 참고용이며, 정확·최신 값은 청약홈·입주자모집공고로 확인하세요.
        </p>
      </header>

      {/* 1순위 · 청약통장 */}
      <section className="bg-surface border-border rounded-xl border p-4" aria-label="청약 순위·통장">
        <h2 className="font-semibold">청약 1순위 · 청약통장</h2>
        <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
          <li>· 투기과열지구·청약과열지역: 가입 후 <b>24개월(2년)</b> 경과</li>
          <li>· 위축지역: 가입 후 1개월 경과</li>
          <li>· 그 외 수도권: 가입 후 1년(수도권 외 6개월) 경과</li>
          <li>· 납입인정금액이 지역별 예치금 이상</li>
        </ul>
        <p className="text-muted-foreground mt-2 text-[11px]">
          ※ 규제지역 여부는 단지 공고 기준. 청약통장 최소 가입기간 {P.minSubscriptionMonths}개월(정책).
        </p>
      </section>

      {/* 특별공급 소득기준 */}
      <section className="bg-surface border-border rounded-xl border p-4" aria-label="특별공급 소득기준">
        <h2 className="font-semibold">특별공급 소득기준</h2>
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          도시근로자 월평균소득 × 유형별 비율. 특공은 ‘3인 이하’ 브래킷(1·2·3인 동일).
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-border border-b text-left text-xs">
                <th className="py-1">가구원수</th>
                <th className="py-1 text-right">월평균소득 100%(만원)</th>
              </tr>
            </thead>
            <tbody>
              {INCOME_ROWS.map((r) => (
                <tr key={r.size} className="border-border border-b">
                  <td className="py-1">{r.size}</td>
                  <td className="py-1 text-right font-medium">{r.v.toLocaleString("ko-KR")}만</td>
                </tr>
              ))}
              <tr>
                <td className="text-muted-foreground py-1 text-xs" colSpan={2}>6인 이상은 공고 확인</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {SPECIAL_INCOME.map((s) => (
            <li key={s.name} className="border-border rounded-lg border p-2">
              <span className="font-semibold">{s.name}</span>
              <span className="text-muted-foreground mt-0.5 block text-xs">{s.tiers}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 자산기준 */}
      <section className="bg-surface border-border rounded-xl border p-4" aria-label="자산기준">
        <h2 className="font-semibold">자산기준(공공·특공)</h2>
        <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
          <li>· 부동산(건물+토지): {(P.realEstateLimitManwon / 10000).toFixed(3).replace(/0+$/, "")}억 이하</li>
          <li>· 자동차가액: 프로그램별 상이 — 공고 확인</li>
        </ul>
      </section>

      <p className="text-muted-foreground text-[11px]">
        {P.source} 기준(적용 {P.asOf} · 정책 {P.version}). 최신·정확 값은{" "}
        <Link href="https://www.applyhome.co.kr" className="text-primary font-medium">청약홈</Link> 및 입주자모집공고로 확인하세요.
      </p>
    </PageContainer>
  );
}
