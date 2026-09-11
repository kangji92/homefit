// 전략 자동 생성 (순수·rule-based·강한 필터링). 조건+Listing에서 가능한 전략만.
// targetRef 없는 추상 대기 전략은 생성하지 않는다. (housing-strategy.md §6)

import { computeFit } from "../scoring";
import { DEFAULT_SCORING_CONFIG, type ScoringConfig } from "../scoring/config";
import { priceBandFor, maxBudgetFor } from "../price";
import { availableAcquisitionPaths } from "../presale";
import { screenSubscriptionEligibility } from "../eligibility/screen";
import { filterHomesByRegion, tenureToHousingStatus } from "../currentHousing";
import type {
  Area,
  CurrentHousing,
  Dealbreakers,
  Home,
  HouseholdProfile,
  HousingStrategy,
  PresaleHome,
  Priorities,
  RegionPreferences,
  UserConditions,
} from "../types";

/** rent step이 "새 전세 후보 미선정"이 아니라 현재 전세 유지임을 나타내는 마커. */
export const RENT_RETAIN_NOTE = "현재 전세 유지";
import { DEFAULT_STRATEGY_CONFIG, type StrategyConfig } from "./config";
import { horizonForYear } from "./timing";

export interface StrategyInput {
  conditions: UserConditions;
  priorities: Priorities;
  dealbreakers: Dealbreakers;
  profile: HouseholdProfile;
  homes: Home[];
  areas: Area[];
  currentYear: number;
  /** 현재 주거 맥락(출발점) — 지역 hard 필터·전세 유지·자격 prefill에 사용. */
  currentHousing?: CurrentHousing;
  /** 지역 선호(preferred=soft, excluded=hard). */
  regionPrefs?: RegionPreferences;
  config?: StrategyConfig;
  scoringConfig?: ScoringConfig;
}

/** kind별 상한만큼 HomeFit 상위로 자른다(노이즈 방지). */
function rankTop<T extends Home>(
  homes: T[],
  input: StrategyInput,
  n: number,
): T[] {
  const cfg = input.scoringConfig ?? DEFAULT_SCORING_CONFIG;
  return [...homes]
    .map((h) => ({
      h,
      score: computeFit(input.conditions, input.priorities, input.dealbreakers, h, cfg)
        .totalScore,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.h);
}

export function generateStrategies(input: StrategyInput): HousingStrategy[] {
  const cfg = input.config ?? DEFAULT_STRATEGY_CONFIG;
  const { conditions, currentYear, currentHousing } = input;

  // 현재 주거의 tenure로 자격 housingStatus를 prefill(미입력일 때만) — 자격 계층 연결.
  const profile: HouseholdProfile =
    currentHousing && input.profile.housingStatus === undefined
      ? { ...input.profile, housingStatus: tenureToHousingStatus(currentHousing.tenure) }
      : input.profile;

  // 지역 hard 제약(excluded·stay_current_area)으로 집 목록을 먼저 좁힌다.
  const homes = filterHomesByRegion(input.homes, {
    current: currentHousing,
    prefs: input.regionPrefs,
  });
  const existing = homes.filter((h) => h.kind === "existing");
  const presales = homes.filter((h): h is PresaleHome => h.kind === "presale");
  const out: HousingStrategy[] = [];

  // 현재 전세를 유지할 수 있는가(전세 거주 + 떠날 의향 아님) → rent step 해소.
  const canRetainJeonse =
    currentHousing?.tenure === "jeonse" &&
    currentHousing.movePreference !== "want_to_leave";

  // ── buy_existing: 예산 내 기존주택, HomeFit 상위 N ──
  const budget = maxBudgetFor(conditions);
  const affordable = existing.filter((h) => {
    const band = priceBandFor(h.price, conditions.dealType);
    return band && band.representative <= budget;
  });
  for (const h of rankTop(affordable, input, cfg.maxPerKind)) {
    out.push({
      id: `buy-${h.id}`,
      kind: "buy_existing",
      label: `${h.name} 매수`,
      targetRef: { kind: "existing", id: h.id },
      steps: [
        {
          kind: "buy",
          ref: { kind: "existing", id: h.id },
          acquisitionPath: "existing_trade",
          timing: { horizon: "now" },
        },
      ],
    });
  }

  // ── 청약 계열: 자격 스크리닝이 fail이면 생성 안 함 ──
  // hasHome을 직접 해석하지 않는다. 자격 계층(screen)이 공급유형별로 판정:
  //   fail → 제외 / unknown·pass → 생성(상태는 decision에서 needs_review/정상).
  if (screenSubscriptionEligibility(profile).status !== "fail") {
    // apply_presale: 접수 중(subscription_open)
    const openPresales = presales.filter(
      (h) => h.lifecycle?.phase === "subscription_open",
    );
    for (const h of rankTop(openPresales, input, cfg.maxPerKind)) {
      out.push({
        id: `apply-${h.id}`,
        kind: "apply_presale",
        label: `${h.name} 청약`,
        targetRef: { kind: "presale", id: h.id },
        steps: [
          {
            kind: "apply",
            ref: { kind: "presale", id: h.id },
            acquisitionPath: "subscription",
            timing: {
              horizon: "now",
              note: h.subscription?.scheduleNote,
            },
          },
          {
            kind: "move_in",
            ref: { kind: "presale", id: h.id },
            timing: {
              horizon: horizonForYear(h.moveInYear, currentYear),
              targetYear: h.moveInYear,
            },
          },
        ],
      });
    }

    // rent_then_apply: 예정(planned/subscription_scheduled)
    const scheduledPresales = presales.filter(
      (h) =>
        h.lifecycle?.phase === "planned" ||
        h.lifecycle?.phase === "subscription_scheduled",
    );
    for (const h of rankTop(scheduledPresales, input, cfg.maxPerKind)) {
      // 현재 전세 유지 가능하면 rent step을 현재 집으로 해소(미선정 아님).
      const rentStep = canRetainJeonse
        ? {
            kind: "rent" as const,
            ref: currentHousing?.homeRef,
            timing: { horizon: "now" as const },
            note: RENT_RETAIN_NOTE,
          }
        : { kind: "rent" as const, timing: { horizon: "now" as const }, note: "현재/새 전세 거주" };
      out.push({
        id: `rent-apply-${h.id}`,
        kind: "rent_then_apply",
        label: `${canRetainJeonse ? "현재 전세 유지" : "전세 거주"} → ${h.name} 청약`,
        targetRef: { kind: "presale", id: h.id },
        steps: [
          rentStep,
          {
            kind: "apply",
            ref: { kind: "presale", id: h.id },
            acquisitionPath: "subscription",
            timing: {
              horizon: "short",
              targetYear: h.lifecycle?.phaseSince
                ? Number(h.lifecycle.phaseSince.slice(0, 4))
                : undefined,
              note: h.subscription?.scheduleNote,
            },
          },
          {
            kind: "move_in",
            ref: { kind: "presale", id: h.id },
            timing: {
              horizon: horizonForYear(h.moveInYear, currentYear),
              targetYear: h.moveInYear,
            },
          },
        ],
      });
    }
  }

  // ── buy_presale_right: 전매 가능(transferable + tradable)만 ──
  const tradablePresales = presales.filter((h) =>
    availableAcquisitionPaths(h).includes("resale"),
  );
  for (const h of rankTop(tradablePresales, input, cfg.maxPerKind)) {
    out.push({
      id: `resale-${h.id}`,
      kind: "buy_presale_right",
      label: `${h.name} 분양권 매수`,
      targetRef: { kind: "presale", id: h.id },
      steps: [
        {
          kind: "buy",
          ref: { kind: "presale", id: h.id },
          acquisitionPath: "resale",
          timing: { horizon: "now" },
        },
        {
          kind: "move_in",
          ref: { kind: "presale", id: h.id },
          timing: {
            horizon: horizonForYear(h.moveInYear, currentYear),
            targetYear: h.moveInYear,
          },
        },
      ],
    });
  }

  return out;
}
