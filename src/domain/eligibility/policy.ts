// 자격 정책 (버전드·주입). mock 근사 — 실제 수치·기준일은 청약홈/정책자료로 후속.
// (docs/design/data-phase2c-household-eligibility.md §3)

export interface SubscriptionPolicy {
  version: string;
  asOf: string; // 기준일 (YYYY-MM-DD)
  marriageMaxMonths: number; // 혼인 인정 상한(개월)
  minSubscriptionMonths: number; // 청약통장 최소 가입기간(개월)
  incomeLimitManwon: number; // 부부합산 월평균 소득 상한(만원)
  assetLimitManwon: number; // 자산 상한(만원)
  multiChildMinChildren: number; // 다자녀 특공 최소 미성년 자녀 수
  newbornIncomeLimitManwon: number; // 신생아 특공 소득 상한(완화, 만원)
}

export const DEFAULT_SUBSCRIPTION_POLICY: SubscriptionPolicy = {
  version: "mock-2026.09",
  asOf: "2026-09-01",
  marriageMaxMonths: 84, // 7년
  minSubscriptionMonths: 6,
  incomeLimitManwon: 800, // 월 800만원(mock)
  assetLimitManwon: 34500, // 3.45억(mock)
  multiChildMinChildren: 2, // 미성년 자녀 2명 이상(mock)
  newbornIncomeLimitManwon: 1300, // 신생아 소득 완화(mock)
};
