# 상태 · 데이터 표준

Zustand(전역·영속) + TanStack Query(비동기 조회) + Repository(교체 가능한 데이터 소스).
도메인 타입·계산은 [domain-model.md](../design/domain-model.md) / [scoring.md](../design/scoring.md).

## 계층

```
UI(features/components)
   │  (인터페이스에만 의존)
   ├─ stores/       Zustand — 우리 조건·후보 (영속 상태)
   ├─ hooks/query   TanStack Query — 단지·지역 조회 캐싱
   └─ domain/       순수 계산 — 적합도·정렬·비교 (상태 없음)
         ↑
   data/repositories/  인터페이스 + mock 구현 (→ Supabase 구현 교체)
   data/mock/          seed 데이터
```

## Zustand

- 스토어: `conditionsStore`(UserConditions·Priorities·Dealbreakers·onboardingCompleted), `candidatesStore`(Candidate[]·RegionInterest[]).
- **`persist` 미들웨어로 localStorage 저장**. 스토어는 작게, 컴포넌트는 **selector**로 필요한 조각만 구독.
- 파생값(FitResult·Comparison)은 **저장하지 않는다**. 조건·후보에서 `useMemo`/selector로 계산.

## Repository

- `data/repositories/`에 **인터페이스 정의**(`ComplexRepository`·`RegionRepository`). MVP는 `mock` 구현.
- **UI·features는 인터페이스에만 의존**한다. mock/Supabase 구현을 직접 import 하지 않는다.
- 인터페이스는 `Promise` 반환(비동기 유지) → Supabase 전환 시 시그니처 무변경.

## TanStack Query

- repository 호출을 Query로 감싸 로딩/에러/캐시를 일관 처리.
- 쿼리 키 규칙: `["complexes", params]`, `["complex", id]`, `["regions"]`.
- 조회 결과는 Query 캐시(메모리), 사용자 입력은 Zustand(영속)로 **역할 분리**.

## 결정성

- 스코어링은 `domain/`의 순수 함수. `Date.now()` 직접 호출 금지 — `ScoringConfig.currentYear` 주입(`scoring.md` §1).
