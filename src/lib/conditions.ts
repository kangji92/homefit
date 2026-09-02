import type { UserConditions } from "@/domain/types";
import { maxBudgetFor } from "@/domain/price";

/** 스코어링에 필요한 조건이 채워졌는지 (조건 미완성 상태 판정). */
export function isConditionsReady(c: UserConditions): boolean {
  return (
    maxBudgetFor(c) > 0 &&
    c.maxCommuteMinutes > 0 &&
    c.workplaces.length >= 2 &&
    c.workplaces.every((w) => w.id.length > 0) &&
    c.desiredSize.min > 0 &&
    c.desiredSize.max >= c.desiredSize.min
  );
}
