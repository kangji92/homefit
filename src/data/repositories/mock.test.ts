import { describe, it, expect } from "vitest";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { mockComplexRepository, mockRegionRepository } from "./mock";

describe("mockComplexRepository", () => {
  it("list()는 모든 단지를 반환한다", async () => {
    const all = await mockComplexRepository.list();
    expect(all).toHaveLength(MOCK_COMPLEXES.length);
  });

  it("regionId로 필터링한다", async () => {
    const dongtan = await mockComplexRepository.list({ regionId: "dongtan" });
    expect(dongtan.length).toBeGreaterThan(0);
    expect(dongtan.every((c) => c.regionId === "dongtan")).toBe(true);
  });

  it("getById는 존재하면 단지를, 없으면 null을 반환한다", async () => {
    const found = await mockComplexRepository.getById(MOCK_COMPLEXES[0].id);
    expect(found?.id).toBe(MOCK_COMPLEXES[0].id);
    expect(await mockComplexRepository.getById("nope")).toBeNull();
  });
});

describe("mockRegionRepository", () => {
  it("list()는 지역 목록을 반환한다", async () => {
    const regions = await mockRegionRepository.list();
    expect(regions).toHaveLength(MOCK_REGIONS.length);
  });
});
