# Current Housing Context + Region Preferences

목적: Homefit이 "앞으로 원하는 집"(UserConditions)만 알던 것을, **지금 어디서 어떻게
사는지**를 출발점으로 삼아 Decision View가 *"이 선택으로 옮기면 우리 가족 생활이 실제로
어떻게 달라지는가"*를 답하도록 확장한다. product-vision(Understand→Compare→Decide)의
Compare/Decide를 현재 상태 기준으로 구체화. **새 종합점수는 만들지 않는다.**

## 1. 소유(Ownership) 결정

| 개념 | 소유 | 이유 |
|------|------|------|
| `CurrentHousing` | **새 `livingContextStore`** | "현재 상태"는 desired condition(conditions)도, 자격 fact(household)도 아닌 별도 출발점. 오염 없이 additive. |
| `RegionPreferences`(preferred/excluded) | 같은 `livingContextStore` | 현재 상태·지역 제약을 한 aggregate로 응집. generation 입력. |
| `tenure` ↔ `housingStatus` | household는 자격용 유지, tenure가 richer | 자격 계층은 `housingStatus` 사용. 미입력 시 `tenureToHousingStatus`로 prefill(자격 연결). |

- `UserConditions`에 넣지 않음(현재≠희망), `HouseholdProfile`에 넣지 않음(현재≠자격fact).
- 기존 `candidatesStore.regionInterests`(관심지역, 탐색용)와 **개념 중복** 존재 → MVP는
  건드리지 않고 별도 운용, 추후 통합 검토(과설계 방지). 

## 2. Region 모델 / 이동 의향
- `RegionRef { id; level?; label? }` — flat `Region.id`를 담되 계층(시>구>생활권>역세권)
  확장 가능. **자유 문자열 배열로 고정하지 않음.** MVP 매칭은 id 동등(`regionRefMatches`).
- `MovePreference`: `stay_current_area`(**hard**, 현재지역만) / `prefer_nearby`(soft) /
  `open_to_move`(neutral) / `want_to_leave`(soft, 현재지역 후순위). **soft≠hard.**

## 3. RegionPreferences vs Dealbreakers
- **excluded → RegionPreferences hard(생성 제외)**, Dealbreaker 아님. 이유: Dealbreaker는
  집 속성 필터(가격/면적/역세권…)로 FitResult 축. 지역 제외는 *생성 단계 집합 필터*라
  scoring 축과 성격이 다름. `filterHomesByRegion`으로 생성 입력에서 제거.
- **preferred → soft**: 정렬 tiebreak(`regionSoftBoost`)·주석만. 필터 아님.

## 4. Current Home ↔ Candidate 비교 (`currentHomeComparison`, 순수)
- HomeFit과 **분리된** `CurrentHomeComparison { rows, gains, tradeoffs }`. 종합점수 없음.
- 축: 주거형태 / 필요자금 / 면적 / 사람별 통근 / 준공 / 역거리 / 생활권.
- 각 축 `direction: gain|tradeoff|neutral`. 현재 단지 미매칭이면 면적·통근·연식은
  graceful 생략(현재 값 미상). gains/tradeoffs는 방향으로 결정적 산출.

## 5. Housing Strategy 연결
- `generateStrategies(input)`에 `currentHousing`·`regionPrefs` 추가(옵션).
- **rent_then_apply 개선**: 현재 전세 유지 가능(`tenure==="jeonse"` && `movePreference!==
  "want_to_leave"`)이면 rent step을 `RENT_RETAIN_NOTE`로 해소 → "전세 후보 미선정"
  incompleteInput 제거, 라벨 "현재 전세 유지 → 청약". 아니면 "새 전세 → 청약"(미선정 유지).
- 지역 hard 필터 + tenure→housingStatus prefill이 생성에 반영.
- 확장 여지: `현재 유지`·`현재 생활권 매수`·`다른 지역 매수` 등 kind는 후속(과설계 방지).

## 6. Decision View: Current → Strategy → Future
- `CurrentContextBanner`("현재 · 평촌 전세 · 여기서 출발")로 출발점 명시.
- StrategyCard에 **"옮겨서 얻는 것 / 포기하는 것"**(gains/tradeoffs)을 서사·사실 사이에 노출.
- Decision View가 "좋은 집 설명"이 아니라 "현재→선택시 변화 설명"이 되도록.

### 6.1 "현재 유지" baseline (결정 #3)
- `현재 유지`는 **HousingStrategy로 생성하지 않는다.** CurrentHousing에서 파생하는
  비교 기준점(anchor). **종합점수·status 없음.**
- `BaselineCard`(점선 카드, "기준 · 현재 유지")를 홈·카드뷰·비교뷰 상단에 노출: "추가
  필요현금 없음 / 통근 변화 없음 / 신축·면적 개선 없음". 각 전략 카드의 gains/tradeoffs가
  이 baseline 대비 변화임을 명시.
- 추후 "현재 집 유지"를 **능동 추천/계획**해야 하는 요구가 생기면 그때 StrategyKind 승격 검토.

## 7. 입력 UX
- `CurrentHousingSection`(우리 조건에 additive, 자동 저장). 현재 주거·지역·이동의향·
  관심/제외 지역·단지매칭 전부 optional(미매칭 graceful).
- ✅(구현) **onboarding '현재 상황' 인트로(결정 #2)**: **3개만** — ① 현재 주거형태
  ② 현재 지역 ③ 생활권 이탈 의향(사용자 문구→MovePreference 매핑). 나머지(단지·보증금·
  월세·관심/제외 지역)는 우리 조건에서. `livingContextStore`에 직접 write(RHF/conditions
  스키마 미변경). 3개 모두 optional, **건너뛰기 허용**.
  - **resume 무영향 설계**: 기존 RHF stepper(0~4)에 step을 끼워넣지 않고, `!onboardingIntroSeen
    && onboardingStep===0`일 때만 stepper **앞에 1회** 렌더하는 pre-phase로 분리.
    조건 흐름 중간(step>0) 재개 사용자에겐 노출 안 됨. `onboardingIntroSeen`은 livingContext persist.

## 8. 기존 구조 충돌 / migration
- 전부 **additive**: 새 store·새 도메인 모듈·StrategyInput 옵션 필드. 기존 타입 파괴 없음.
- 자격: household.housingStatus 권위 유지, currentHousing은 미입력 시 prefill만.

### 8.1 관심지역 통합 계획 (결정 #1 — 지금 실행 안 함)
권위 source = **`livingContextStore.regionPrefs.preferred`**. 기존
`candidatesStore.regionInterests`(regionId 배열)를 점진 migration.

**중복 사용 지점**
- `candidatesStore`(store 구현) · `domain/types.ts`(RegionInterest 타입)
- `features/candidates/RegionInterestList.tsx`(관심지역 add/remove UI) ←
  `CandidatesFeature.tsx`에서 렌더
- `features/auth/{useAccountSync,userState}.ts` — **Supabase 계정 동기화가 저장**(중요)

**안전한 순서**
1. ✅(구현) 하이드레이션 시 `regionInterests → regionPrefs.preferred` **비파괴 seed**
   (preferred 비었을 때만, 중복 제거). 읽기/토글 어댑터 `usePreferredRegions()` +
   seed 훅 `useSeedPreferredFromInterests()`(AccountSync에 마운트).
2. ✅(구현) `RegionInterestList`·`CurrentHousingSection` 관심지역을 `regionPrefs.preferred`
   read/write로 전환. **dual-write**: 토글 시 regionInterests도 함께 갱신(Supabase 호환).
3. (동기화, **먼저 스키마 조율 필요** — 미실행) 계정 동기화를 `regionPrefs`까지 포함하도록.
   Supabase에 `regionInterests`가 남아 있어 **스토어 제거는 이 단계 이후**.
4. (마지막, breaking — 미실행) `candidatesStore.regionInterests` + 타입 제거.
- 1~2 완료(안전, additive). 3~4는 Supabase 스키마 변경 창에서.

## 9. Decision Map(향후) 인터페이스 (구현 안 함)
지도는 CurrentHousing/RegionPreferences에서 다음을 소비:
- 현재 집/지역: `current.regionRef`, `current.homeRef`(좌표는 homeRef→Home 조회).
- 직장: 기존 `conditions.workplaces[].{lat,lng}`.
- 후보/청약/개발지: 기존 Home/Area.
- 이동 전략: HousingStrategy.steps(현재→목표 경로).
- 제외/관심 지역: `regionPrefs`(영역 음영/우선 표시).
