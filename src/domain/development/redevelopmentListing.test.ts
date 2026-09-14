import { describe, it, expect } from "vitest";
import { makeComplex } from "@/domain/__fixtures__";
import type { Home } from "@/domain/types";
import type { DevelopmentArea } from "./types";
import { listingPricePremium, redevelopmentListingSummary } from "./redevelopmentListing";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });

describe("listingPricePremium", () => {
  it("호가·실거래 있으면 프리미엄(계산값) 산출", () => {
    const p = listingPricePremium({ askingPrice: won(92000), recentTransactionPrice: won(78000) });
    expect(p?.amount.manwon).toBe(14000);
    expect(p?.amount.valueProvenance).toBe("computed");
    expect(p?.ratio).toBeCloseTo(14000 / 78000, 5);
  });
  it("한쪽이라도 없으면 undefined(임의 계산 안 함)", () => {
    expect(listingPricePremium({ askingPrice: won(92000) })).toBeUndefined();
    expect(listingPricePremium(undefined)).toBeUndefined();
  });
});

describe("redevelopmentListingSummary", () => {
  const area: DevelopmentArea = {
    id: "dev-east", name: "동측 재개발", developmentType: "redevelopment",
    stage: "in_progress", detailStage: "implementation", certainty: "confirmed",
    geometry: { kind: "polygon", rings: [[]] },
  };

  it("listing/redevelopment 없으면 undefined", () => {
    expect(redevelopmentListingSummary(makeComplex({ id: "a" }) as Home)).toBeUndefined();
  });

  it("재개발 빌라 요약: 프리미엄 계산 + inside + 사업 연계, 미상은 그대로 통과", () => {
    const home = {
      ...makeComplex({ id: "villa1" }),
      housingType: "villa",
      listing: { askingPrice: won(92000), recentTransactionPrice: won(78000), landShareM2: 33 },
      redevelopment: { areaId: "dev-east", inside: true }, // occupancyRightStatus·분담금 미지정
    } as Home;
    const s = redevelopmentListingSummary(home, area)!;
    expect(s.inside).toBe(true);
    expect(s.premium?.amount.manwon).toBe(14000);
    expect(s.occupancyRightStatus).toBe("unknown"); // 미지정 → unknown
    expect(s.estimatedContribution).toBeUndefined(); // 정보 없음(추정 안 함)
    expect(s.area?.name).toBe("동측 재개발");
    expect(s.landShareM2).toBe(33);
  });
});
