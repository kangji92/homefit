// 온보딩 검증·매핑·재개 로직 (docs/design/onboarding.md).
// 순수 모듈 — React/RHF에 의존하지 않는다. domain 타입만 사용.

import { z } from "zod";
import { WORK_AREA_IDS, getWorkArea } from "@/data/workAreas";
import type {
  ChildPlan,
  DealType,
  Dealbreakers,
  MoveInTiming,
  Priorities,
  PriorityKey,
  Transport,
  UserConditions,
  Workplace,
} from "@/domain/types";

// ===== 폼 값 타입 (스토어 스키마를 폼에 맞게 평탄화) =====
export interface OnboardingFormValues {
  dealType: DealType;
  maxSalePrice: number;
  maxJeonseDeposit: number;
  availableFunds: number;
  workplaceAId: string;
  workplaceBId: string;
  transportA: Transport;
  transportB: Transport;
  maxCommuteMinutes: number;
  desiredSizeMin: number;
  desiredSizeMax: number;
  childPlan: ChildPlan;
  moveInTiming: MoveInTiming;
  priorities: Priorities;
  dealbreakers: {
    maxPrice?: number;
    minSizePyeong?: number;
    maxStationDistanceM?: number;
    maxBuildingAgeYears?: number;
    minHouseholds?: number;
    requireSchoolNearby?: boolean;
  };
}

// ===== 선택지 메타 =====
export const TRANSPORT_OPTIONS: { value: Transport; label: string }[] = [
  { value: "transit", label: "대중교통" },
  { value: "car", label: "자동차" },
  { value: "either", label: "상관없음" },
];

export const CHILD_PLAN_OPTIONS: { value: ChildPlan; label: string }[] = [
  { value: "yes", label: "있음" },
  { value: "no", label: "없음" },
  { value: "undecided", label: "미정" },
];

export const DEAL_TYPE_OPTIONS: { value: DealType; label: string }[] = [
  { value: "sale", label: "매매" },
  { value: "jeonse", label: "전세" },
];

export const MOVE_IN_OPTIONS: { value: MoveInTiming; label: string }[] = [
  { value: "asap", label: "가능한 빨리" },
  { value: "within1y", label: "1년 내" },
  { value: "within2y", label: "2년 내" },
  { value: "flexible", label: "유연함" },
];

export const PRIORITY_META: { key: PriorityKey; label: string; note?: string }[] =
  [
    { key: "price", label: "가격" },
    { key: "commute", label: "출퇴근" },
    { key: "education", label: "교육·육아" },
    { key: "newness", label: "신축" },
    { key: "infrastructure", label: "생활 인프라" },
    { key: "environment", label: "주거환경" },
    { key: "futurePotential", label: "미래가치", note: "현재 테스트용 데이터" },
  ];

export const STEP_TITLES = [
  "예산",
  "직장·통근",
  "평형·가족",
  "우선순위",
  "절대조건",
] as const;

// ===== 슬라이더 레벨 표현 =====
export function priorityLevel(v: number): "낮음" | "보통" | "높음" {
  if (v <= 33) return "낮음";
  if (v <= 66) return "보통";
  return "높음";
}

// ===== 스텝별 zod 스키마 =====
const transport = z.enum(["transit", "car", "either"]);
const childPlan = z.enum(["yes", "no", "undecided"]);
const moveInTiming = z.enum(["asap", "within1y", "within2y", "flexible"]);
const areaId = z
  .string()
  .refine((v) => WORK_AREA_IDS.includes(v), { message: "근무지역을 선택하세요" });
const priority = z.number().min(0).max(100);
const positiveOptional = z.number().positive("0보다 커야 해요").optional();

export const budgetSchema = z
  .object({
    dealType: z.enum(["sale", "jeonse"]),
    maxSalePrice: z.number().min(0),
    maxJeonseDeposit: z.number().min(0),
    availableFunds: z.number().min(0, "0 이상이어야 해요"),
  })
  .superRefine((v, ctx) => {
    // 활성 거래유형의 예산만 > 0 을 요구한다
    if (v.dealType === "sale" && !(v.maxSalePrice > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxSalePrice"],
        message: "매매 예산은 0보다 커야 해요",
      });
    }
    if (v.dealType === "jeonse" && !(v.maxJeonseDeposit > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxJeonseDeposit"],
        message: "전세 보증금은 0보다 커야 해요",
      });
    }
  });

export const commuteSchema = z.object({
  workplaceAId: areaId,
  workplaceBId: areaId,
  transportA: transport,
  transportB: transport,
  maxCommuteMinutes: z
    .number()
    .int()
    .min(10, "10분 이상이어야 해요")
    .max(180, "180분 이하로 입력하세요"),
});

export const householdSchema = z
  .object({
    desiredSizeMin: z.number().positive("0보다 커야 해요"),
    desiredSizeMax: z.number().positive("0보다 커야 해요"),
    childPlan,
    moveInTiming,
  })
  .refine((v) => v.desiredSizeMax >= v.desiredSizeMin, {
    message: "최대 평형은 최소 평형 이상이어야 해요",
    path: ["desiredSizeMax"],
  });

export const prioritySchema = z.object({
  priorities: z.object({
    price: priority,
    commute: priority,
    education: priority,
    newness: priority,
    infrastructure: priority,
    environment: priority,
    futurePotential: priority,
  }),
});

export const dealbreakerSchema = z.object({
  dealbreakers: z.object({
    maxPrice: positiveOptional,
    minSizePyeong: positiveOptional,
    maxStationDistanceM: positiveOptional,
    maxBuildingAgeYears: positiveOptional,
    minHouseholds: positiveOptional,
    requireSchoolNearby: z.boolean().optional(),
  }),
});

export const STEP_SCHEMAS = [
  budgetSchema,
  commuteSchema,
  householdSchema,
  prioritySchema,
  dealbreakerSchema,
] as const;

export const STEP_COUNT = STEP_SCHEMAS.length;
export const LAST_STEP = STEP_COUNT - 1;

// ===== 검증 헬퍼 =====
export function isStepComplete(step: number, values: OnboardingFormValues): boolean {
  return STEP_SCHEMAS[step].safeParse(values).success;
}

/** 앞에서부터 처음으로 검증 실패하는 스텝. 모두 통과면 마지막 스텝. */
export function firstIncompleteStep(values: OnboardingFormValues): number {
  for (let i = 0; i < STEP_COUNT; i++) {
    if (!isStepComplete(i, values)) return i;
  }
  return LAST_STEP;
}

/**
 * 재개 스텝 보정 (docs/design/onboarding.md §4):
 * 저장 step이 무효거나 앞 스텝 필수값이 누락이면 가장 앞의 미완료 스텝으로.
 */
export function resolveResumeStep(
  savedStep: number,
  values: OnboardingFormValues,
): number {
  const saved = Number.isFinite(savedStep) ? savedStep : 0;
  const target = Math.min(saved, firstIncompleteStep(values));
  return Math.max(0, Math.min(target, LAST_STEP));
}

export function validateAllSteps(values: OnboardingFormValues): {
  success: boolean;
  firstInvalidStep?: number;
} {
  for (let i = 0; i < STEP_COUNT; i++) {
    if (!STEP_SCHEMAS[i].safeParse(values).success) {
      return { success: false, firstInvalidStep: i };
    }
  }
  return { success: true };
}

// ===== 스토어 <-> 폼 매핑 =====
function makeWorkplace(id: string, transport: Transport): Workplace {
  const area = getWorkArea(id);
  return {
    id: area?.id ?? "",
    label: area?.label ?? "",
    lat: area?.lat ?? 0,
    lng: area?.lng ?? 0,
    transport,
  };
}

export function buildWorkplaces(v: OnboardingFormValues): Workplace[] {
  return [
    makeWorkplace(v.workplaceAId, v.transportA),
    makeWorkplace(v.workplaceBId, v.transportB),
  ];
}

export function formToConditions(v: OnboardingFormValues): UserConditions {
  return {
    dealType: v.dealType,
    maxSalePrice: v.maxSalePrice,
    maxJeonseDeposit: v.maxJeonseDeposit,
    availableFunds: v.availableFunds,
    workplaces: buildWorkplaces(v),
    maxCommuteMinutes: v.maxCommuteMinutes,
    desiredSize: { min: v.desiredSizeMin, max: v.desiredSizeMax },
    childPlan: v.childPlan,
    moveInTiming: v.moveInTiming,
  };
}

export function cleanDealbreakers(
  d: OnboardingFormValues["dealbreakers"],
): Dealbreakers {
  const out: Dealbreakers = {};
  const numKeys = [
    "maxPrice",
    "minSizePyeong",
    "maxStationDistanceM",
    "maxBuildingAgeYears",
    "minHouseholds",
  ] as const;
  for (const k of numKeys) {
    const val = d[k];
    if (typeof val === "number" && Number.isFinite(val)) out[k] = val;
  }
  if (d.requireSchoolNearby) out.requireSchoolNearby = true;
  return out;
}

export function storeToFormValues(
  conditions: UserConditions,
  priorities: Priorities,
  dealbreakers: Dealbreakers,
): OnboardingFormValues {
  const [a, b] = conditions.workplaces;
  return {
    dealType: conditions.dealType,
    maxSalePrice: conditions.maxSalePrice,
    maxJeonseDeposit: conditions.maxJeonseDeposit,
    availableFunds: conditions.availableFunds,
    workplaceAId: a?.id ?? "",
    workplaceBId: b?.id ?? "",
    transportA: a?.transport ?? "transit",
    transportB: b?.transport ?? "transit",
    maxCommuteMinutes: conditions.maxCommuteMinutes,
    desiredSizeMin: conditions.desiredSize.min,
    desiredSizeMax: conditions.desiredSize.max,
    childPlan: conditions.childPlan,
    moveInTiming: conditions.moveInTiming,
    priorities: { ...priorities },
    dealbreakers: { ...dealbreakers },
  };
}
