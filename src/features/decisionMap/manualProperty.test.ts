import { describe, it, expect } from "vitest";
import { buildManualProperty } from "./manualProperty";

describe("buildManualProperty", () => {
  it("수기 입력을 기존 Home(existing villa)로 변환 + listing 출처 + 재개발 연결", () => {
    const h = buildManualProperty({
      id: "m1", displayName: "비산동 A빌라", housingType: "villa",
      askingPriceManwon: 93000, exclusiveAreaM2: 59.5, landShareM2: 33,
      redevelopmentAreaId: "dev-anyang-stadium-east",
      previousAssetAppraisalManwon: 70000,
      desiredMemberSaleEstimateId: "east-84",
      sourceType: "broker", sourceLabel: "현장 중개사", verifiedAt: "2026-09-14",
    });
    expect(h.kind).toBe("existing");
    expect(h.housingType).toBe("villa");
    expect(h.price.sale?.representative).toBe(93000);
    expect(h.listing?.askingPrice?.manwon).toBe(93000);
    expect(h.listing?.sourceType).toBe("broker");
    expect(h.redevelopment?.areaId).toBe("dev-anyang-stadium-east");
    // 사업 연결만으로 "구역 내부 확인"을 단정하지 않는다 → 미확인(undefined). 자동 true 금지.
    expect(h.redevelopment?.inside).toBeUndefined();
    expect(h.redevelopment?.previousAssetAppraisal?.manwon).toBe(70000);
    expect(h.redevelopment?.desiredMemberSaleEstimateId).toBe("east-84");
    expect(h.sizesPyeong[0]).toBeCloseTo(18, 0); // 59.5㎡ ≈ 18평
  });

  it("재개발 미연결이면 redevelopment undefined", () => {
    const h = buildManualProperty({ id: "m2", displayName: "일반 빌라", housingType: "villa", sourceType: "user_input" });
    expect(h.redevelopment).toBeUndefined();
    expect(h.listing?.sourceType).toBe("user_input");
  });
});
