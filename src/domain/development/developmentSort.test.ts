import { describe, it, expect } from "vitest";
import { sortDevelopmentsByProgress } from "./developmentSort";
import type { DevelopmentArea } from "./types";

const area = (id: string, stage: DevelopmentArea["stage"], certainty: DevelopmentArea["certainty"]): DevelopmentArea => ({
  id, name: id, developmentType: "redevelopment", stage, certainty,
  geometry: { kind: "point", at: { lat: 37.4, lng: 126.9 } },
});

describe("sortDevelopmentsByProgress", () => {
  it("확정성(confirmed 먼저) → 단계 진행(완료/진행 먼저) 순으로 정렬한다", () => {
    const input = [
      area("uncertain-planned", "planned", "uncertain"),
      area("confirmed-planned", "planned", "confirmed"),
      area("confirmed-inprogress", "in_progress", "confirmed"),
      area("likely-approved", "approved", "likely"),
    ];
    const sorted = sortDevelopmentsByProgress(input).map((d) => d.id);
    expect(sorted).toEqual([
      "confirmed-inprogress", // confirmed + 가장 진행
      "confirmed-planned", // confirmed
      "likely-approved", // likely
      "uncertain-planned", // uncertain 마지막
    ]);
  });

  it("원본 배열을 변형하지 않는다", () => {
    const input = [area("b", "planned", "confirmed"), area("a", "in_progress", "confirmed")];
    const before = input.map((d) => d.id);
    sortDevelopmentsByProgress(input);
    expect(input.map((d) => d.id)).toEqual(before);
  });
});
