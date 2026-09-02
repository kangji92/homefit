# Homefit 적합도 스코어링 설계

7개 평가 축의 **0~100 정규화식**, 파라미터 기본값, 가중합·정렬 규칙을 확정한다.
`src/domain/scoring/`의 source of truth다. 타입은 [domain-model.md](./domain-model.md) 참조.

**불변 원칙**
- 모든 점수는 **결정적 순수 함수**로 계산한다. 동일 입력 → 동일 출력. AI가 점수를 만들지 않는다.
- 모든 축은 **"높을수록 좋음(0~100)"** 으로 정규화하고 `clamp(0, 100)` 한다.
- 시간·연도 등 외부 상태는 `ScoringConfig`로 **주입**한다(`Date.now()` 직접 호출 금지 — 테스트 결정성).

---

## 1. ScoringConfig (파라미터)

```ts
interface ScoringConfig {
  currentYear: number;         // 연식 기준연도
  priceFloorRatio: number;     // 가격 만점 기준 (예산 대비 비율)
  commuteFullRatio: number;    // 통근 만점 기준 (허용시간 대비 비율)
  commuteScoreAtLimit: number; // 허용시간 정확히에서의 점수
  commuteHardCapRatio: number; // 통근 0점 기준 (허용시간 배수)
  newnessZeroAtYears: number;  // 신축 점수 0이 되는 연식(년)
}

const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  currentYear: 2026,
  priceFloorRatio: 0.5,
  commuteFullRatio: 0.5,
  commuteScoreAtLimit: 60,
  commuteHardCapRatio: 2,
  newnessZeroAtYears: 30,
};
```

> 기본값은 감각적 시작점이며 **튜닝 가능**하다. 변경 시 이 문서를 먼저 수정한다.

공통 유틸:
```ts
const clamp = (x: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, x));
const lerp = (x: number, x0: number, x1: number, y0: number, y1: number) =>
  y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); // x0..x1 → y0..y1 선형
```

---

## 2. 축별 정규화식

### 2.1 price (가격) — 예산 대비 저렴할수록 ↑
```
p = complex.price.representative
floor = maxBudget * priceFloorRatio
score = clamp( 100 * (maxBudget - p) / (maxBudget - floor) )
```
- `p <= floor` → 100, `p >= maxBudget` → 0. 그 사이 선형.

### 2.2 commute (출퇴근) — 3구간 선형
모든 사람 중 **가장 긴 통근**이 기준(둘 다 만족해야 좋은 집).
```
worst = max( workplaces.map(w => complex.commuteMinutes[w.id]) )
L     = maxCommuteMinutes
a     = commuteFullRatio * L      // 만점 상한
cap   = commuteHardCapRatio * L   // 0점 하한
S     = commuteScoreAtLimit       // 허용시간에서의 점수

worst <= a          → 100
a  < worst <= L      → lerp(worst, a, L, 100, S)   // 100 → S
L  < worst <= cap    → lerp(worst, L, cap, S, 0)   // S → 0
worst > cap          → 0
```
- 예: `L=45, a=22.5, S=60` → **40분 ≈ 69점** (기존 가혹식은 11점).
- `commuteMinutes`는 각 `Workplace.transport`가 이미 반영된 mock 값이다.

### 2.3 newness (신축) — 연식 선형
```
age   = currentYear - complex.completionYear   // 음수(준공 예정)면 0으로 취급
score = clamp( 100 * (1 - max(age, 0) / newnessZeroAtYears) )
```
- 신축(age 0) → 100, `newnessZeroAtYears`(기본 30년) 이상 → 0.

### 2.4 education / infrastructure / environment / futurePotential — 지표 직접 사용
```
score = clamp( complex.metrics.<key> )   // 이미 0~100 지표
```
- 별도 변환 없이 지표값을 그대로 사용(단, clamp).
- `futurePotential`은 MVP에서 mock seed → UI에 "테스트용 데이터" 고지(domain-model 참조).

---

## 3. 가중합 (totalScore)

```
// 1) 가중치 정규화 (합=1). 모두 0이면 균등(1/7)
sum = Σ priorities[k]
w[k] = sum > 0 ? priorities[k] / sum : 1/7

// 2) 가중합
totalScore = round( Σ_k  w[k] * axisScores[k] )
```
- `axisScores[k]`는 표시용으로 정수 반올림하되, **총점 계산에는 반올림 전 값**을 쓴다.
- `totalScore`는 정수로 반올림.

---

## 4. 절대조건 필터 & FitResult

```ts
function computeFit(
  conditions: UserConditions,
  priorities: Priorities,
  dealbreakers: Dealbreakers,
  complex: Complex,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): FitResult
```
1. `failedDealbreakers` 수집(domain-model §6.1) → `passesDealbreakers`.
2. 각 축 `axisScores` 계산(§2).
3. `totalScore` 계산(§3).
4. **점수는 통과/탈락과 무관하게 계산**한다. 탈락 후보도 점수를 보여주되 UI에서 경고.

---

## 5. 정렬 (sortByFit)

domain-model §6.4의 규칙을 그대로 구현.
```
정렬 우선순위:
  1) passesDealbreakers === true  (통과가 위)
  2) totalScore 내림차순
  (그 다음)
  3) passesDealbreakers === false (탈락)
  4) 탈락 내부도 totalScore 내림차순
```
```ts
function sortByFit(results: FitResult[]): FitResult[] {
  return [...results].sort((x, y) => {
    if (x.passesDealbreakers !== y.passesDealbreakers)
      return x.passesDealbreakers ? -1 : 1;
    return y.totalScore - x.totalScore;
  });
}
```

---

## 6. 비교 (Comparison)

domain-model §7. 두 `FitResult`를 축별/총점으로 비교.
```
diff(k) = A.axisScores[k] - B.axisScores[k]
perAxisWinner[k] = |diff| <= tieThreshold ? "tie" : diff > 0 ? "a" : "b"
overallWinner   = 총점 차이에 같은 규칙 (tieThreshold 기본 2)
```

---

## 7. 워크드 예시 (검증용 — 테스트 기대값)

입력:
- `maxBudget=100000`(만원), `price.representative=80000`
- `maxCommuteMinutes=45`, `worst=40`
- `completionYear=2018` (currentYear 2026 → age 8)
- metrics: education 80, infrastructure 70, environment 65, futurePotential 60
- priorities(원시): price 30, commute 25, education 20, newness 10, infra 5, env 5, future 5 (합 100)

축 점수:
| 축 | 계산 | 값 |
|---|---|---|
| price | 100*(100000-80000)/(100000-50000) | 40.0 |
| commute | lerp(40, 22.5, 45, 100, 60) | ≈68.9 |
| newness | 100*(1-8/30) | ≈73.3 |
| education | 80 | 80 |
| infrastructure | 70 | 70 |
| environment | 65 | 65 |
| futurePotential | 60 | 60 |

가중합:
```
0.30*40 + 0.25*68.9 + 0.20*80 + 0.10*73.3 + 0.05*70 + 0.05*65 + 0.05*60
= 12 + 17.22 + 16 + 7.33 + 3.5 + 3.25 + 3 ≈ 62.3  → totalScore = 62
```

> 이 예시는 `scoring` 단위 테스트의 기대값 기준으로 사용한다.
