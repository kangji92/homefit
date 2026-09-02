import { describe, it, expect } from "vitest";
import { homeRepository } from "./index";
import { MOCK_PRESALES } from "@/data/mock/presales";

describe("homeRepository (기존+분양 통합)", () => {
  it("list는 기존 아파트와 분양 단지를 함께 반환한다", async () => {
    const homes = await homeRepository.list();
    expect(homes.some((h) => h.kind === "existing")).toBe(true);
    expect(homes.some((h) => h.kind === "presale")).toBe(true);
  });

  it("getById로 분양 단지를 찾는다", async () => {
    const p = await homeRepository.getById(MOCK_PRESALES[0].id);
    expect(p?.kind).toBe("presale");
    expect(p?.id).toBe(MOCK_PRESALES[0].id);
  });

  it("없는 id는 null", async () => {
    expect(await homeRepository.getById("nope")).toBeNull();
  });
});
