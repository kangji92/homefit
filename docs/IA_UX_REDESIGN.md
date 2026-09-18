# Homefit IA/UX Redesign

> Status: proposal  
> Scope: mobile-first IA/UX migration plan. No code changes implied by this document.  
> Source of truth: `docs/product-vision.md`, then this document for IA/UX structure.

## 1. Current IA Problems

Homefit's domain direction is already Decision View oriented, but the current mobile IA can still be read as a common property recommendation app.

Current bottom navigation:

```txt
홈 / 탐색 / 후보 / 우리 조건
```

This creates six product risks.

1. **The primary mental model is still property-first.**  
   `탐색`, `후보`, and `비교` currently suggest a familiar flow: search listings, save favorites, compare apartments, then pick one. This weakens the intended question: "What should our family do now?"

2. **Decision View is too concentrated in Home/Strategy.**  
   `HomeFeature` and `StrategyFeature` already express strategy decisions, but other tabs fall back to listing/search/favorite language. Users may interpret Homefit as "enter conditions, get scored properties."

3. **Candidate state looks like a destination, not evidence.**  
   `CandidatesFeature` treats saved homes/regions as a core tab. For Homefit, candidates should support decisions. They are not the product's top-level outcome.

4. **Compare is currently asset-first.**  
   `CompareFeature` compares two saved homes using `computeFit`/`compareFit`. That remains useful, but it should be a lower-level Asset Compare under the higher-level Strategy Compare.

5. **Conditions/Profile are separated by code concerns, not user intent.**  
   `conditionsStore`, `householdStore`, and `livingContextStore` are correctly separated in domain/state, but UX should make them feel like one settings journey: current situation, desired conditions, eligibility details, and regional constraints.

6. **Fit score can dominate the interpretation.**  
   Components such as recommendation/candidate cards can make the app look score-led. Fit should explain why an option is relevant and which strategy it supports, not act as the final answer.

## 2. Product UX Principle

Homefit is not:

> "우리 가족에게 맞는 집을 추천하는 앱"

Homefit is:

> "우리 가족이 지금 매수할지, 전세를 유지할지, 청약을 기다릴지, 분양권/개발예정지를 검토할지 결정하도록 돕는 앱"

The UX should keep the user in this journey:

```txt
조건 설정
  -> 결정 선택지 생성
  -> 탐색으로 근거/후보 보강
  -> 전략 비교
  -> 이번 선택/다음 행동
```

Design rules:

- Put **Decision Strategy** before property cards.
- Do not expose `StrategyKind` as a fixed menu or category list. The visible strategy set and order should come from `buildStrategyBoard` results and each item's `decision.status`, timing, risk, and actionability for the current user.
- Show **why this option matters** before showing a numeric score.
- Treat assets internally as **evidence/candidates for strategies**, not as final categories.
- Use "evidence" as an internal modeling word. User-facing copy should prefer natural Korean such as `후보`, `검토 이유`, `선택지`, `이 집을 검토할 이유`, `비교 근거`, or `확인할 점`.
- Do not force a property, region, presale, or development area into exactly one acquisition path.
- Reuse existing strategy calculation logic. UI migration must not duplicate `generateStrategies`, `computeStrategyDecision`, `buildStrategyBoard`, `computeFit`, or eligibility logic.
- Preserve domain separations in code while connecting them in UX.

## 3. Target IA

Target bottom navigation:

```txt
결정 / 탐색 / 비교 / 조건
```

Recommended route mapping:

```txt
/                 -> 결정 (Decision Hub)
/explore          -> 탐색 (Candidate/Review Reason Discovery)
/compare          -> 비교 (Strategy Compare first, Asset Compare second)
/conditions       -> 조건 (Unified settings entry)
```

Supporting routes remain available through contextual links:

```txt
/onboarding       -> first-run conditions/profile/living-context flow
/profile          -> eligibility/profile detail, linked from 조건 and decision blockers
/strategy         -> temporary compatibility route or redirected into /
/candidates       -> temporary compatibility route or folded into 탐색/비교
/complex/[id]     -> asset detail
/area/[id]        -> area detail
```

### IA Intent

| Target tab | Primary question | Main implementation assets |
| --- | --- | --- |
| 결정 | "우리 가족은 지금 무엇을 선택해야 하나?" | `HomeFeature`, `StrategyHomeSection`, `StrategyFeature`, `buildStrategyBoard` |
| 탐색 | "결정에 필요한 후보/근거를 더 찾을까?" | `ExploreFeature`, `searchListings`, `CandidateToggleButton`, repositories |
| 비교 | "전략끼리 무엇이 다르고, 내부 후보는 어떻게 다른가?" | `StrategyCompareTable`, `TradeoffSummary`, `DecisionMapView`, existing `CompareFeature` as Asset Compare |
| 조건 | "우리 조건/현재상황/자격 정보가 충분한가?" | `OnboardingFeature`, `ConditionsFeature`, `ProfileFeature`, stores |

## 4. Screen Responsibilities

### 4.1 결정

Role:

- Act as the app's first screen and Decision Hub.
- Present the top available Decision Strategies: 지금 매수, 전세 유지/전세 후 청약, 청약, 분양권 매수, 개발예정지 검토 where applicable.
- Explain each strategy through status, reason, constraints, risk, timing, cash needs, and next action.
- Surface missing inputs only when they affect a decision.

Must not:

- Become a generic dashboard of cards.
- Lead with "추천 단지 TOP N" as the main object.
- Rank all homes as if Homefit's final output is an apartment leaderboard.

Quick menu (상단 아이콘 퀵메뉴):

- 결정 홈 헤더 밑에 아이콘 퀵메뉴 한 줄을 둔다. **하단 탭(결정/탐색/비교/조건)과 중복되지 않게**,
  스크롤 아래에 묻히던 하위 기능만 노출한다.
- 항목: 청약(`/explore?kind=presale`) · 정비사업(`/explore?kind=development`) ·
  현장매물(`/strategy?view=map`) · 개발예정지(`/explore?kind=area`).
- 탐색 탭은 `?kind=` 쿼리로 초기 탭을 선택한다(‌`?view=map`과 동일 패턴).
- 구현: `src/features/home/HomeQuickMenu.tsx`.

개발 호재(탐색):

- "개발예정지 + 정비사업"을 **"개발 호재" 한 탭 + 카테고리 chip**(정비·철도·신도시)으로 통합.
  chip은 툴팁 + "가격 예측·투자 추천 아님 · 판단 보조" 고지.
- 정비사업/개발예정지는 **지역 적합도(위치·교통·학군)** 만 점수, 개발 성과(세대·분양가)는 정보.
  철도는 정보만. (설계: `docs/design/development-catalyst.md`)

Reuse:

- `src/features/home/HomeFeature.tsx`
- `src/features/strategy/StrategyHomeSection.tsx`
- `src/features/strategy/StrategyFeature.tsx`
- `src/features/strategy/strategyView.ts`
- `src/domain/strategy/*`

Migration notes:

- `/` should keep using `buildStrategyBoard`.
- The current recommendation list in `HomeFeature` should be visually demoted to "근거/후보".
- `/strategy` can either redirect to `/` or remain as an internal expanded decision view until migration is complete.

### 4.2 탐색

Role:

- Help users find or add evidence for decisions.
- Search homes, presales, areas, and development-related assets.
- Show which strategies an asset could support.
- Allow saving/marking candidates without making "찜" the main product concept.

Must not:

- Present itself as a complete real estate search portal.
- Treat filters as the product's primary value.
- Classify each asset into only one strategy.

Reuse:

- `src/features/explore/ExploreFeature.tsx`
- `src/features/explore/search.ts`
- `src/features/candidates/CandidateToggleButton.tsx`
- `src/stores/candidatesStore.ts`
- `useHomes`, `useAreas`, `useDevelopments`, `useDevelopmentProperties`

Needed UX shift:

- Rename copy from "매물 검색" semantics to "결정 후보/근거 찾기".
- On each result card, add "이 후보가 도울 수 있는 결정" such as:
  - 지금 매수 후보
  - 전세 후 청약을 비교할 이유
  - 분양권 매수를 검토할 이유
  - 개발예정지/지역에서 확인할 점
- This should be derived from existing domain helpers where possible, not manually hardcoded per card.

### 4.3 비교

Role:

- Make Strategy Compare the default.
- Support Asset Compare as a drill-down inside or below a strategy comparison.
- Compare strategies by decision axes: timing, cash needed now, affordability, eligibility, transfer risk, current-home delta, and unknowns.

Must not:

- Default to "단지 A vs 단지 B" as the whole comparison experience.
- Merge HomeFit, eligibility, transfer risk, timing, and affordability into one final score.
- Recompute strategy decisions in UI-only code.

Reuse:

- `src/features/strategy/TradeoffSummary`
- `src/features/strategy/StrategyCompareTable`
- `src/features/decisionMap/DecisionMapView`
- `src/features/compare/CompareFeature.tsx` as Asset Compare
- `src/domain/scoring/compare.ts` only for asset-level Fit comparison

Target structure:

```txt
비교
  Strategy Compare
    - buildStrategyBoard 결과 중 현재 사용자에게 의미 있는 전략
    - decision.status/actionability 기준으로 노출·우선순위 결정
    - StrategyKind enum 전체를 고정 탭처럼 보여주지 않음

  Asset Compare
    - selected strategy 안에서 단지/청약/지역 후보끼리 비교
    - 또는 사용자가 직접 선택한 saved candidates 비교
```

### 4.4 조건

Role:

- Unified entry for "our context".
- Connect current housing, desired conditions, priorities/dealbreakers, region preferences, and household/eligibility details.
- Use progressive disclosure for sensitive or administrative fields.

Must not:

- Expose a long administrative form before the user sees why it matters.
- Make profile data feel like a separate product area disconnected from decisions.
- Force all eligibility details during first onboarding.

Reuse:

- `src/features/onboarding/OnboardingFeature.tsx`
- `src/features/conditions/ConditionsFeature.tsx`
- `src/features/profile/ProfileFeature.tsx`
- `src/features/currentHousing/*`
- `useConditionsStore`, `useHouseholdStore`, `useLivingContextStore`

Target flow:

```txt
기본 조건
  - 예산/가용현금
  - 직장/통근
  - 희망 평형/입주시점
  - 우선순위/절대조건

현재 상황
  - 현재 전세/자가/월세
  - 현재 집 유지 가능성
  - 이사 의향
  - 선호/제외 지역

필요할 때만 묻는 자격 정보
  - 청약 전략이 등장할 때
  - 분양권/전매 검토 때
  - eligibility unknown이 decision blocker일 때
```

## 5. Main User Flows

### Flow A: First-time user

```txt
/onboarding
  -> 기본 조건 + 현재상황 최소 입력
  -> /
  -> Decision Hub shows available strategies
  -> user taps "확인이 필요한 것"
  -> /conditions or /profile for progressive detail
  -> /compare to compare strategies
```

### Flow B: User wants more candidates

```txt
/
  -> selected strategy has weak evidence or no target
  -> /explore
  -> filter/search assets
  -> add as decision candidate/evidence
  -> /compare
  -> Strategy Compare updates using existing state and repositories
```

### Flow C: User is choosing between paths

```txt
/compare
  -> Strategy Compare first
  -> select "지금 매수" vs "전세 후 청약"
  -> inspect timing/cash/risk/eligibility
  -> open Asset Compare only for assets inside a path
  -> return to Decision Hub for next action
```

### Flow D: Eligibility unknown

```txt
/
  -> 청약 strategy status = 확인 필요
  -> CTA: 청약 자격 정보 보완
  -> /conditions or /profile
  -> profile fields shown progressively
  -> strategy board recalculates through existing domain logic
```

### Flow E: User commits to a next focus

```txt
/compare or /
  -> user picks a strategy as "우선 검토"
  -> Homefit summarizes the Decision Outcome
  -> Homefit shows the next 1-3 actions
  -> user continues to /explore, /conditions, /profile, or asset detail
```

## 6. Strategy Compare / Asset Compare Relationship

Strategy Compare is the top-level comparison. Asset Compare is subordinate.

```txt
Decision Strategy
  has evidence/candidates
    Home
    Presale
    Area
    DevelopmentArea
    Development property/listing
```

Strategy Compare answers:

- Should we buy now?
- Should we keep renting and wait for subscription?
- Should we apply to presale?
- Should we consider a presale right?
- Should we monitor a development area?

Asset Compare answers:

- If we buy now, which existing homes are plausible?
- If we wait for subscription, which presales matter?
- If we monitor development, which area/property evidence changes the decision?

Existing implementation fit:

- `buildStrategyBoard` already produces strategy-level board items.
- `pickCompareColumns` already selects one representative item per strategy kind.
- `StrategyCompareTable` and `TradeoffSummary` already support strategy-level comparison.
- `CompareFeature` can be retained as an asset comparison mode, but should no longer be the default meaning of `/compare`.

Do not:

- Convert asset compare into strategy compare by copying strategy logic into `CompareFeature`.
- Turn strategy comparison into a direct score ranking.

## 7. Decision Outcome / Next Action

Comparison is not the final screen. The product journey should end each loop with a concrete decision outcome and next action.

Decision Outcome is the UX-level summary of what the user is currently choosing or prioritizing. It does not require a new P0 domain type or store. In P0 it can be derived from the selected `StrategyBoardItem`, `StrategyDecision`, candidate asset refs, and existing route context.

Outcome examples:

- `지금 매수`를 우선 검토
- `현재 전세 유지 + 청약 대기`를 우선 검토
- `청약 자격 확인 후 다시 비교`
- `분양권 매수는 보류하고 현금/전매 조건 확인`
- `개발예정지는 관심 후보로 두고 아직 결정하지 않음`

The outcome should show:

- selected or prioritized strategy label
- why this strategy is currently meaningful
- biggest blocker or risk
- next 1-3 actions
- related candidate assets or details, if any

Next Action examples:

- `청약 자격 정보 보완하기` -> `/profile` or `/conditions`
- `이 전략에 맞는 후보 더 찾기` -> `/explore`
- `현재 집 대비 변화 확인하기` -> `/compare` map/strategy view
- `후보 단지 상세 보기` -> `/complex/[id]`
- `개발사업 진행 확인하기` -> `/area/[id]` or the current decision map panel

P0 implementation principle:

- Do not create a new persistent "selected decision" store yet.
- Derive the active outcome from the current selected strategy in `/`, `/compare`, or the existing `DecisionMapView` selection state.
- Use existing `firstChecks(board)`, `strategyTargetHref(strategy)`, `StrategyDecision.risk`, `StrategyDecision.eligibility`, `StrategyDecision.affordability`, and `StrategyDecision.timing`.
- If there is no explicit user selection, show "이번에 먼저 볼 선택지" based on the top actionable `StrategyBoardItem`.

## 8. Candidate/Evidence Model Relationship

Important modeling principle:

> Do not classify a specific home/area/presale into exactly one acquisition path.

A single candidate can support multiple strategies.

Examples:

- A presale can support `apply_presale` and, later in lifecycle, `buy_presale_right`.
- A current jeonse situation can support `rent_then_apply` and act as the baseline for `buy_existing`.
- A development area can support "wait/monitor" evidence and also inform nearby existing-home decisions.
- A home can be an asset candidate for "buy now" and comparison evidence against "keep renting".

Target conceptual model:

```ts
type DecisionStrategyRef = {
  strategyId: string;
  strategyKind: StrategyKind;
};

type EvidenceRef = {
  kind: "existing" | "presale" | "area" | "development" | "property";
  id: string;
};

type StrategyEvidenceLink = {
  strategy: DecisionStrategyRef;
  evidence: EvidenceRef;
  role: "candidate" | "baseline" | "risk" | "context" | "supporting_fact";
};
```

This is a UX/internal modeling direction, not an immediate required type change and not preferred user-facing copy. Current `Candidate` state can be reused during migration:

- `useCandidatesStore.candidates` stores saved asset refs.
- `regionInterests` stores region-level interest.
- Development data currently comes from repositories and does not need to be persisted as candidate state immediately.

Potential migration:

1. Keep `Candidate` as saved asset references.
2. Add derived strategy relevance in selectors/view helpers.
3. Only add persistent N:M links if users need explicit "attach this candidate to this strategy" behavior.

## 9. Conditions/Profile Input Flow

Code-level separation should remain:

- `conditionsStore`: desired housing conditions and priorities.
- `livingContextStore`: current housing, move preference, region preferences.
- `householdStore`: eligibility/profile information.

UX-level flow should feel unified:

```txt
조건
  1. 현재 상황
  2. 원하는 조건
  3. 우선순위/절대조건
  4. 자격 확인
```

Progressive disclosure rules:

- Ask only the minimum during first onboarding.
- If a decision is blocked by `unknown`, show a targeted input CTA.
- Keep sensitive policy fields near the decision they affect.
- Avoid presenting `HouseholdProfile` as a large standalone admin form.

Implementation direction:

- Reuse `CurrentSituationStep` as the first context block.
- Keep current `BudgetStep`, `CommuteStep`, `HouseholdStep`, `PriorityStep`, `DealbreakerStep`.
- Link Profile/Eligibility sections from `ConditionsFeature`.
- Use decision blockers from `computeStrategyDecision` to decide which profile fields to ask for next.

## 10. Route Migration

| Current route | Current role | Target role | Migration |
| --- | --- | --- | --- |
| `/` | Home dashboard with strategy + recommendations | Decision Hub | Keep route. Refocus content around strategies and next action. |
| `/strategy` | Expanded strategy screen | Compatibility route or Decision subview | Move core UI into `/` or redirect later. Reuse components. |
| `/explore` | Listing/area search | Evidence/candidate discovery | Keep route. Change copy and card hierarchy. |
| `/candidates` | Saved candidates tab | Supporting saved evidence view | Remove from bottom nav. Link from Explore/Compare if needed. |
| `/compare` | Two saved homes comparison | Strategy Compare default + Asset Compare secondary | Reuse `StrategyCompareTable`; retain old compare as asset mode. |
| `/conditions` | Desired conditions | Unified settings entry | Keep route. Add profile/current-context connection. |
| `/profile` | Eligibility overview/profile | Progressive detail screen | Keep route. Link from condition/decision CTAs, not bottom nav. |
| `/onboarding` | First-run condition input | First-run unified context setup | Keep route. Adjust copy/order later. |
| `/complex/[id]` | Home detail | Asset detail/evidence detail | Keep route. Show strategy relevance. |
| `/area/[id]` | Area detail | Area/evidence detail | Keep route. Show strategy relevance. |

Bottom nav migration:

```txt
Before: 홈 / 탐색 / 후보 / 우리 조건
After:  결정 / 탐색 / 비교 / 조건
```

Suggested matching:

- `결정`: `/`, `/strategy`
- `탐색`: `/explore`, asset details opened from explore
- `비교`: `/compare`, strategy compare, selected asset compare
- `조건`: `/conditions`, `/profile`

## 11. Affected Components, Types, and State

### Components likely affected

- `src/components/layout/BottomNav.tsx`
  - Change labels and target routes.
  - Remove `후보`, add `비교`.

- `src/features/home/HomeFeature.tsx`
  - Refocus as Decision Hub.
  - Demote recommendation/development sections under decision evidence.

- `src/features/strategy/StrategyHomeSection.tsx`
  - Likely becomes the primary hero/content block for `/`.

- `src/features/strategy/StrategyFeature.tsx`
  - Can be reused inside `/` or retained as expanded view.
  - Its card/compare/map modes are valuable; avoid rebuilding.

- `src/features/compare/CompareFeature.tsx`
  - Needs split between Strategy Compare default and Asset Compare secondary.
  - Existing two-home compare remains useful.

- `src/features/explore/ExploreFeature.tsx`
  - Copy and card priority shift from listing search to evidence discovery.
  - Add strategy relevance hints.

- `src/features/candidates/CandidatesFeature.tsx`
  - Remove from bottom nav.
  - Reuse pieces in Explore/Compare as saved evidence panels.

- `src/features/candidates/CandidateCard.tsx`
  - Adjust from fit-first to reason/strategy-first.

- `src/features/home/RecommendationCard.tsx`
  - Show "why relevant" and "which strategy it supports" before score.

- `src/features/profile/ProfileFeature.tsx`
  - Connect to Conditions as progressive detail.

- `src/features/onboarding/OnboardingFeature.tsx`
  - Existing flow is reusable. Copy/order may need refinement.

### Domain/view helpers likely affected

- `src/features/strategy/strategyView.ts`
  - Reuse `buildStrategyBoard`, `pickCompareColumns`, `groupByKind`, `firstChecks`.
  - Potentially add helpers for "strategy relevance by asset".

- `src/features/explore/search.ts`
  - Keep filtering/sorting.
  - Avoid encoding acquisition path as a single permanent asset category.

- `src/domain/strategy/*`
  - No IA-driven duplication. Only change if a real domain gap is found.

- `src/domain/scoring/*`
  - Keep as asset-level HomeFit/AreaFit explanation.
  - Do not make score the final decision.

### State likely affected

- `useConditionsStore`
  - Keep as is.

- `useHouseholdStore`
  - Keep as profile source. Expose progressively in UX.

- `useLivingContextStore`
  - Keep as current situation and region preference source.

- `useCandidatesStore`
  - Keep as saved asset references.
  - Do not immediately replace with a strategy-specific store.
  - Consider derived N:M strategy evidence links before adding persistent links.

### Repository hooks likely reused

- `useHomes`
- `useAreas`
- `useDevelopments`
- `useDevelopmentProperties`
- `useRegions`

No data layer migration is required for IA P0.

## 12. Implementation Priority

### P0: IA reframing without domain rewrites

Goal: make the app immediately read as Decision View centered.

- Change bottom nav to `결정 / 탐색 / 비교 / 조건`.
- Make `/` the Decision Hub.
- Promote current-user-relevant strategy cards and next actions above recommendations. The visible list should be derived from `buildStrategyBoard`, not from a hardcoded `StrategyKind` menu.
- Move saved candidates out of the primary nav.
- Make `/compare` default to Strategy Compare using existing `buildStrategyBoard` output.
- Keep old asset compare available as a secondary mode.
- Add a lightweight Decision Outcome / Next Action section derived from the selected/top strategy.
- Update screen copy:
  - "추천 단지" -> "결정에 참고할 후보"
  - "후보" -> "저장한 후보" or "검토 중인 선택지" where still shown
  - Avoid user-facing "evidence" copy unless it is clearly paired with natural Korean.
  - "적합도순" remains available, but not as the primary product promise.

Expected files:

- `BottomNav.tsx`
- `HomeFeature.tsx`
- `StrategyHomeSection.tsx`
- `CompareFeature.tsx`
- `ExploreFeature.tsx`
- selected card components

### P0 File-Level Implementation Plan

This is the proposed minimal implementation plan after this document is accepted. Do not implement as part of the documentation task.

Out of scope for P0:

- `src/domain/**`
- `src/stores/**`
- `src/data/repositories/**`
- Supabase ingestion scripts
- polygon/boundary/map geometry data work

Planned file changes:

| File | Planned change | Reuse constraint |
| --- | --- | --- |
| `src/components/layout/BottomNav.tsx` | Change nav labels to `결정 / 탐색 / 비교 / 조건`; route `비교` to `/compare`; make `/profile` active under `조건`; remove `/candidates` from primary nav. | No state/domain changes. |
| `src/features/home/HomeFeature.tsx` | Reframe as Decision Hub. Put strategy/next-action section first; demote recommendations to "결정에 참고할 후보"; keep existing queries/stores. | Continue using `StrategyHomeSection`, `useHomes`, `useAreas`, `recommendComplexes`. |
| `src/features/strategy/StrategyHomeSection.tsx` | Ensure visible strategies come from current `buildStrategyBoard` output/status, not hardcoded StrategyKind navigation; add or expose lightweight next actions if already available. | Reuse `buildStrategyBoard`, `firstChecks`, `STATUS_META`. |
| `src/features/compare/CompareFeature.tsx` | Make Strategy Compare the default view by building the board from existing stores/queries. Keep current two-home compare as an `Asset Compare` secondary mode. | Reuse `StrategyCompareTable`, `TradeoffSummary`, existing `ComparisonView`. No duplicate decision calculation. |
| `src/features/decisionMap/DecisionMapView.tsx` | If used inside Compare/Decision, preserve current selection behavior and optionally surface selected strategy's next action copy. | Do not alter polygon/boundary or scene geometry logic. |
| `src/features/explore/ExploreFeature.tsx` | Change page copy from generic search to "후보/검토 이유 찾기"; keep filters; avoid "evidence" in user copy. | Reuse `searchListings`, existing repository hooks, `CandidateToggleButton`. |
| `src/features/candidates/CandidateCard.tsx` | Adjust labels so saved items read as decision candidates rather than score-ranked favorites. | Keep `useCandidatesStore` shape. |
| `src/features/home/RecommendationCard.tsx` | Lead with why the item is worth reviewing; make score secondary. | Keep `computeFit`/recommendation data unchanged. |

Suggested P0 sequencing:

1. Bottom nav labels/routes.
2. Decision Hub copy and section order.
3. `/compare` strategy-first shell with old asset compare retained.
4. Explore/candidate/recommendation copy pass.
5. Lightweight Decision Outcome / Next Action presentation.

P0 polish TODOs:

- In `/compare`, avoid repeating the same selected strategy in both `DecisionOutcome` and the immediate strategy detail card.
- When two or more meaningful strategies exist, emphasize strategy-to-strategy differences first.
- When only one strategy exists, do not manufacture another comparison target. Show that only one option is currently comparable and explain what action could create more options, such as broadening conditions, adding candidates, or completing profile data.
- Revisit `/compare` after the full P0 IA pass is complete; do not block the first IA migration on this polish.

### P1: Candidate/Evidence integration

Goal: make Explore and Compare feel connected to decisions.

- Add derived "supported strategies" display on Explore results.
- Add saved evidence panels inside Explore/Compare.
- Add strategy relevance helper in `strategyView` or a new feature-level helper.
- Make asset details show which decisions the asset can inform.
- Connect decision blockers to targeted condition/profile CTAs.

Expected files:

- `ExploreFeature.tsx`
- `search.ts`
- `CandidateCard.tsx`
- `RecommendationCard.tsx`
- `complex-detail/*`
- `area/*`
- `strategyView.ts`

### P2: Optional explicit strategy evidence model

Goal: only if implicit saved candidates become insufficient.

- Introduce persistent N:M links between strategies and evidence.
- Allow users to attach/remove evidence from a strategy.
- Add compare presets such as "내가 검토 중인 매수 후보" or "청약 대기 후보".
- Consider route refinements like `/decision`, but only after `/` is stable.

Potential new state:

```ts
strategyEvidenceLinks: StrategyEvidenceLink[]
```

Do not start here. Most value can be achieved with derived relevance and existing stores.

## 13. What This IA Redesign Will Not Do

This redesign will not:

- Modify polygon/boundary work. Development boundary and map geometry work is explicitly out of scope.
- Replace the current domain strategy calculation.
- Recompute strategy decisions in UI components.
- Merge HomeFit, eligibility, transfer risk, timing, and affordability into a single score.
- Rebuild Supabase/data ingestion.
- Turn Homefit into a full property listing portal.
- Force every asset into exactly one acquisition path.
- Remove asset-level comparison; it will be repositioned below strategy comparison.
- Require a new persistent N:M evidence model in P0.
- Require every profile/eligibility field during onboarding.
- Persist a selected Decision Outcome in P0.

## 14. Practical Migration Summary

The lowest-risk path is to reuse what already works:

1. Treat `StrategyFeature`/`strategyView` as the Decision View backbone.
2. Move the user's first read of the app from property recommendations to strategy decisions.
3. Reframe Explore as evidence discovery.
4. Reframe Compare as strategy-first and asset-second.
5. Keep existing stores and domain functions intact.
6. Add N:M candidate/evidence modeling only after the UX proves it needs explicit user control.

The intended result:

```txt
Homefit stops feeling like:
  "조건 넣고 점수 높은 집 고르는 앱"

and starts feeling like:
  "우리 가족이 지금 어떤 주거 선택을 해야 하는지 정리해주는 앱"
```
