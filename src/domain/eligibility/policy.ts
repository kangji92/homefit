// 자격 정책 (버전드·주입). 실제 공식 수치를 인코딩하고 출처·기준일을 노출한다.
// 소득요건은 flat cap이 아니라 도시근로자 월평균소득 × 비율(가구원수·맞벌이별).
// (docs/design/data-phase2c-household-eligibility.md §3)

/** 프로그램별 소득 상한 비율(%) — 자격 상한 = 공공분양 일반공급 기준. */
export interface IncomeRatio {
  single: number; // 외벌이(%)
  dual: number; // 맞벌이(%)
}

export interface SubscriptionPolicy {
  version: string;
  asOf: string; // 적용 기준 시점 (YYYY-MM)
  source: string; // 출처 요약
  marriageMaxMonths: number; // 혼인 인정 상한(개월)
  minSubscriptionMonths: number; // 청약통장 최소 가입기간(개월)
  /** 도시근로자 가구원수별 월평균소득 100%(만원). key=가구원수 */
  urbanIncome100Manwon: Record<number, number>;
  /** 프로그램별 소득 상한 비율 */
  incomeRatio: {
    newlywed: IncomeRatio;
    firstTime: IncomeRatio;
    multiChild: IncomeRatio;
    newborn: IncomeRatio;
  };
  realEstateLimitManwon: number; // 부동산가액 상한(만원)
  carLimitManwon: number; // 자동차가액 상한(만원)
  multiChildMinChildren: number; // 다자녀 특공 최소 미성년 자녀 수
}

// 도시근로자 월평균소득 100% — **청약홈 청약제도안내(2025) 확인값**(만원 반올림).
//   특공 소득기준은 '3인 이하' 브래킷: 1·2·3인 가구 모두 3인 기준(7,533,763원) 적용.
//   ✅ 3인이하 7,533,763 · 4인 8,802,202 · 5인 9,326,985 (2025 공식).
//   ⚠️ 6·7인은 이 안내에 미표기 → 공고 확인(TODO). (이전 3인 817만은 오류 → 753만으로 정정)
const URBAN_INCOME_100_MANWON: Record<number, number> = {
  1: 753, // 3인 이하 브래킷
  2: 753, // 3인 이하 브래킷
  3: 753, // 7,533,763
  4: 880, // 8,802,202
  5: 933, // 9,326,985
  6: 1007, // TODO 공고 확인
  7: 1083, // TODO 공고 확인
};

export const DEFAULT_SUBSCRIPTION_POLICY: SubscriptionPolicy = {
  version: "2025.09",
  asOf: "2025",
  source: "청약홈 청약제도안내(2025)·국토부 신혼부부 특별공급 운용지침(law.go.kr)·통계청 도시근로자 소득",
  marriageMaxMonths: 84, // 혼인 7년
  minSubscriptionMonths: 6,
  urbanIncome100Manwon: URBAN_INCOME_100_MANWON,
  // 공공분양 일반공급 소득 상한(외벌이/맞벌이).
  incomeRatio: {
    newlywed: { single: 130, dual: 140 },
    firstTime: { single: 140, dual: 160 },
    multiChild: { single: 120, dual: 120 },
    newborn: { single: 140, dual: 200 }, // 신생아 완화 큼
  },
  realEstateLimitManwon: 21550, // 부동산 2.155억
  carLimitManwon: 3708, // 자동차 3,708만
  multiChildMinChildren: 2,
};
