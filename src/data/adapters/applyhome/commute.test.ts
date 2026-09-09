import { describe, it, expect } from "vitest";
import { WORK_AREAS } from "@/data/workAreas";
import {
  commuteFromAddress,
  estimateCommuteMinutes,
  sigunguCentroid,
} from "./commute";

describe("sigunguCentroid", () => {
  it("주소에서 시/군을 뽑아 좌표를 찾는다", () => {
    expect(sigunguCentroid("경기도 시흥시 은행동 289-31번지")).toEqual({
      lat: 37.38,
      lng: 126.8,
    });
    expect(sigunguCentroid("경기도 성남시 수정구 창곡동")?.lat).toBe(37.42);
  });
  it("표에 없거나 주소 없으면 undefined", () => {
    expect(sigunguCentroid("강원도 어딘가군 xx")).toBeUndefined();
    expect(sigunguCentroid(undefined)).toBeUndefined();
  });
});

describe("estimateCommuteMinutes", () => {
  it("모든 WorkArea에 대해 10~120분 범위의 값을 낸다", () => {
    const c = estimateCommuteMinutes({ lat: 37.38, lng: 126.8 }, WORK_AREAS);
    for (const wa of WORK_AREAS) {
      expect(c[wa.id]).toBeGreaterThanOrEqual(10);
      expect(c[wa.id]).toBeLessThanOrEqual(120);
    }
  });
  it("가까운 곳이 먼 곳보다 통근이 짧다", () => {
    // 성남(판교 인접)은 판교 통근이 여의도보다 짧다
    const c = estimateCommuteMinutes({ lat: 37.42, lng: 127.13 }, WORK_AREAS);
    expect(c.pangyo).toBeLessThan(c.yeouido);
  });
});

describe("commuteFromAddress", () => {
  it("주소 → 통근 분(7개 WorkArea 전부)", () => {
    const c = commuteFromAddress("경기도 부천시 상동", WORK_AREAS);
    expect(Object.keys(c ?? {}).sort()).toEqual(
      WORK_AREAS.map((w) => w.id).sort(),
    );
  });
  it("시군구 미상이면 undefined", () => {
    expect(commuteFromAddress("주소불명", WORK_AREAS)).toBeUndefined();
  });
});
