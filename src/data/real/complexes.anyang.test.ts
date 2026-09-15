import { describe, it, expect } from "vitest";
import { REAL_COMPLEXES, getRealComplex } from "./complexes.anyang";
import { homeRepository } from "@/data/repositories";

describe("REAL_COMPLEXES (안양권 실단지)", () => {
  it("공개 확인값 기반 실단지 3곳을 담는다(자이 퍼스니티·푸르지오더샵·어반포레)", () => {
    const names = REAL_COMPLEXES.map((c) => c.name);
    expect(names).toContain("안양역 푸르지오 더샵");
    expect(names).toContain("안양 어반포레 자연& e편한세상");
    expect(names).toContain("평촌자이 퍼스니티");
  });

  it("정적 사실(세대수·연식) 확인값 + 평촌자이는 입주예정(presale)", () => {
    const prugio = getRealComplex("anyang-prugio-thesharp");
    expect(prugio?.kind).toBe("existing");
    expect((prugio as { households?: number }).households).toBe(2736);
    const xi = getRealComplex("pyeongchon-xi-personality");
    expect(xi?.kind).toBe("presale"); // 2027 입주예정 → 분양권
  });

  it("homeRepository가 실단지를 mock 목록에 병합해 노출한다", async () => {
    const all = await homeRepository.list();
    expect(all.some((h) => h.id === "anyang-prugio-thesharp")).toBe(true);
    // 지역 필터(anyang)에도 포함
    const anyang = await homeRepository.list({ regionId: "anyang" });
    expect(anyang.some((h) => h.id === "anyang-urbanfore-epfs")).toBe(true);
    // getById로도 조회
    const one = await homeRepository.getById("pyeongchon-xi-personality");
    expect(one?.name).toBe("평촌자이 퍼스니티");
  });
});
