# 탐색(검색) 화면 — 사용자 주도 매물 탐색

추천(홈의 자동 상위 5개)만으로는 **사용자가 직접 조건을 걸어 찾아보는** 경로가
없다. `/explore`를 신설해 전체 매물(집 + 개발 예정지)을 필터·정렬·검색한다.

## 1. 원칙

- **추천과 직교**: 홈의 "추천 주택"은 dealbreaker 통과분을 적합도 상위로 좁혀
  보여준다. 탐색은 **전부 보여주고** 사용자가 좁힌다(불충족도 배지로 표시).
- **점수는 재사용, 재계산 금지**: 집은 `computeFit`, 지역은 `computeAreaFit`.
  HomeFit·AreaFit는 **성격이 다른 척도라 한 목록에서 서로 직접 비교하지 않는다**
  (domain-model-v2 §5). → 결과를 **집 / 개발 예정지 두 그룹**으로 나눠 렌더.
- **순수·결정적 필터**: 필터·정렬은 순수 함수(`searchListings`)로 두고 단위
  테스트. UI(React)는 상태·렌더만.
- **카드 재사용**: 집 = `RecommendationCard`(조건 미충족 배지 내장), 지역 =
  `AreaCard`. 새 카드 만들지 않는다(YAGNI).

## 2. 라우팅·네비

- 라우트 `/(app)/explore`. 하단 탭 **홈 / 탐색 / 후보 / 비교 / 조건** (5개).
  아이콘 `Search`(lucide). `match`: `pathname.startsWith("/explore")`.
- 온보딩 미완료여도 탐색은 열람 가능(추천과 달리 필수 조건 불요). 단 적합도
  배지는 조건이 있어야 의미 있으므로, 조건 미완료면 점수 없이 목록만.

## 3. 검색 파라미터 (로컬 상태)

URL·persist 아님 — 컴포넌트 `useState`. `dealType` 기본값은 우리 조건에서 승계.

```ts
interface SearchParams {
  q: string;                    // 이름 부분일치(대소문자 무시, trim)
  regionId: string | "all";
  dealType: DealType;           // 매매|전세 — 가격 표시·필터 기준
  kind: "all" | "existing" | "presale" | "area";
  priceMax?: number;            // 만원 — 대표가 이하 (집에만 적용)
  sizeMin?: number;             // 평 — 최소 평형 (집에만 적용)
  sort: "fit" | "price" | "newest";
}
```

### 필터 적용 규칙
- `q`·`regionId`·`kind`: 집·지역 공통.
- `dealType`·`priceMax`·`sizeMin`: **집에만** 적용. 개발 예정지는 가격/평형/
  거래유형 개념이 없어 `kind` 필터로만 포함/제외한다(고지 문구).
- `priceMax`: 해당 `dealType`의 대표가가 없으면(매물 없음) 제외하지 않고 **통과**
  (정보 없음 ≠ 초과). `sizeMin`: `sizesPyeong` 최댓값 기준.

### 정렬
- 집: `fit`=`sortByFit`(통과 우선→총점), `price`=대표가 오름차순(없으면 뒤),
  `newest`=준공/입주연도 내림차순.
- 지역: 정렬 옵션과 무관하게 **AreaFit 내림차순**(집과 섞지 않으므로 안전).

## 4. 순수 함수

```ts
// src/features/explore/search.ts
interface SearchContext {
  conditions: UserConditions;          // store가 기본값 보장(항상 존재)
  priorities: Priorities;
  dealbreakers: Dealbreakers;
  config?: ScoringConfig;
}
interface SearchResults {
  homes: Recommendation[];             // {complex, fit}
  areas: { area: Area; fit: AreaFitResult }[];
}
searchListings(homes, areas, params, ctx): SearchResults
```

- 집: 필터 → `computeFit` → 정렬. 지역: 필터 → `computeAreaFit` → AreaFit 정렬.
- 탐색 필터의 `dealType`을 점수에도 반영: `computeFit`에 `{...conditions,
  dealType: params.dealType}`를 넘겨 매매/전세 전환 시 가격 축이 함께 바뀐다.
- 조건이 아직 미완료(`isConditionsReady` false)여도 점수는 계산하되(store 기본값),
  화면 상단에 "조건 완성하기" 안내 배너를 병행 노출한다.

## 5. UI 구성

```
[검색창 🔍 이름]
지역 [전체▾]   거래 [매매/전세]
유형 [전체][기존][분양][개발예정지]
가격 상한 [====○====]  평형 최소 [==○=====]
정렬 [적합도순▾]
──────────────────
집 (n)
  ▸ RecommendationCard × n   (조건 미충족은 배지)
개발 예정지 (m)
  ▸ AreaCard × m
```

- 결과 0건: "조건에 맞는 매물이 없어요" + 필터 초기화 버튼.
- 개발 예정지 그룹 상단에 "가격·평형 필터는 집에만 적용돼요" 안내.

## 6. 테스트·완료

- `searchListings` 단위 테스트: 이름/지역/유형/가격/평형 필터, 3정렬, 조건
  미완료 경로, 지역은 가격필터 무관, dealbreaker 불충족도 포함되는지.
- `ExploreFeature` 렌더 테스트(입력→결과 반영), BottomNav 탭 추가 렌더.
- 완료 기준(lint/typecheck/test) green. `computeFit`/`computeAreaFit` 불변.
