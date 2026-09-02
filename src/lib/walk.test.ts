import { describe, it, expect } from "vitest";
import {
  WALK_METERS_PER_MIN,
  metersToWalkMinutes,
  walkMinutesToMeters,
} from "./walk";

describe("walk 환산", () => {
  it("1분 = 80m 표준", () => {
    expect(WALK_METERS_PER_MIN).toBe(80);
    expect(walkMinutesToMeters(5)).toBe(400);
    expect(metersToWalkMinutes(400)).toBe(5);
  });

  it("미터 → 분은 반올림한다", () => {
    expect(metersToWalkMinutes(550)).toBe(7); // 6.875 → 7
    expect(metersToWalkMinutes(500)).toBe(6); // 6.25 → 6
  });
});
