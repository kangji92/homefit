// ⚠️ MOCK — 재개발 비용 시뮬 시나리오 seed. 실제 종전자산평가액/조합원분양가/비례율이
// 아니라 가상 값이다. 매수가·비교기준가는 매물 listing에서, 나머지는 가상 기본값.
// (docs/design 개발레이어 cost §8)

import type { Home, Money } from "@/domain/types";
import { sourced, type RedevelopmentScenario } from "@/domain/development";

const won = (manwon: number): Money => ({ manwon, valueProvenance: "sourced" });

/** 동측 재개발 빌라 기준 3개 시나리오(보수/기준/낙관). 전부 mock. */
export function mockRedevelopmentScenarios(home: Home): RedevelopmentScenario[] {
  const purchase = home.listing?.askingPrice?.manwon ?? 90000; // 매물 호가
  const comparison = home.listing?.recentTransactionPrice?.manwon ?? 60000; // 비교기준(가상)
  const appraisal = 60000; // 종전자산평가액(가상 6억)
  const memberSale = 100000; // 조합원분양가(가상 10억)

  const mk = (id: string, label: string, rate: number): RedevelopmentScenario => ({
    id,
    label,
    inputs: {
      purchasePrice: sourced(won(purchase), "mock", { sourceLabel: "매물 호가(mock)" }),
      comparisonPropertyValue: sourced(won(comparison), "mock", { sourceLabel: "비교기준(mock)" }),
      previousAssetAppraisal: sourced(won(appraisal), "mock", { sourceLabel: "종전자산(가상)" }),
      proportionalRate: sourced(rate, "mock"),
      memberSalePrice: sourced(won(memberSale), "mock", { sourceLabel: "조합원분양가(가상)" }),
    },
    note: "mock 값 — 실제 사업 수치 아님",
  });

  return [mk("conservative", "보수적", 0.9), mk("base", "기준", 1.0), mk("optimistic", "낙관적", 1.1)];
}
