import { describe, it, expect, vi, afterEach } from "vitest";

// PoC 오버레이 배선 검증: NEXT_PUBLIC_POC_REAL_PRICES=1 이면 mock repo가
// 실거래 기반 가격(pocPriceOverride)을 읽기 경로에 반영한다.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("mock repo PoC 가격 오버레이", () => {
  it("플래그 off(기본)면 mock 가격 그대로", async () => {
    vi.stubEnv("NEXT_PUBLIC_POC_REAL_PRICES", "0");
    vi.resetModules();
    const { mockComplexRepository } = await import("./mock");
    const c = await mockComplexRepository.getById("misa-central");
    expect(c?.price.sale?.representative).toBe(85000); // mock 시드
  });

  it("플래그 on이면 실거래 대표가로 덮어쓴다", async () => {
    vi.stubEnv("NEXT_PUBLIC_POC_REAL_PRICES", "1");
    vi.resetModules();
    const { mockComplexRepository } = await import("./mock");
    const c = await mockComplexRepository.getById("misa-central");
    expect(c?.price.sale?.representative).toBe(136500); // 실거래 13.65억
    expect(c?.price.jeonse?.representative).toBe(78000);
  });
});
