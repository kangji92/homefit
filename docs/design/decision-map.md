# Decision Map 설계

> 상태: **설계(design-only)**. 이 문서 승인 전까지 지도 구현·Map SDK 도입·좌표 수집을
> 하지 않는다. product-vision(Understand→Compare→**Decide**)과
> [`current-housing.md`](current-housing.md)·[`housing-strategy.md`](housing-strategy.md)를
> 상위 진실 소스로 따른다.

---

## 1. 목적 / 비목적

**목적**: "부동산 정보를 많이 보여주는 지도"가 아니라, **우리 가족의 현재 위치와 주거
전략을 공간적으로 이해·결정**하게 돕는 지도. 중심 질문은 *"이 아파트가 어디 있나?"*가
아니라 **"우리에게 이 선택은 공간적으로 어떤 변화인가?"**.

**비목적(MVP에서 명시적 제외)**
- 실거래가 Heatmap / "모든 부동산 정보 레이어".
- 지도를 primary 탐색 수단으로 만드는 것(호갱노노형 브라우징). 지도는 **spatial
  explanation layer**, Decision View가 primary.
- 실제 통근 route geometry·isochrone·교통계획 오버레이(후속).
- GIS polygon 편집/정밀 행정경계(후속).

## 2. 핵심 사용자 질문 (지도가 답해야 할 것)
1. 우리는 **지금 어디서 출발**하는가? (현재 집/생활권)
2. **두 직장**은 어디인가?
3. 어떤 **주택/청약/분양권/개발지**가 선택지인가?
4. 이 선택은 현재 생활권에서 **얼마나 벗어나는가?**
5. 이 선택으로 **통근이 어떻게 달라지는가?** (사람별)
6. **제외 지역**을 침범하는가?
7. **관심 지역** 안에 어떤 선택지가 있는가?
8. 각 **Housing Strategy가 공간적으로 어떻게 다른가?**

지도는 위 질문에 답하지 못하면 실패다. 화려한 지도보다 **8개 질문 응답**이 성공 기준.

## 3. 지도 entity 모델

> ⚠️ **좌표 현실(핵심 제약)**: 현재 도메인에서 좌표를 가진 것은 `Workplace.lat/lng`뿐.
> `Home`(existing/presale)·`Area`·`Region`·`RegionRef`는 **좌표 없음**. 통근은
> `commuteMinutes: Record<workplaceId, 분>`(사전계산, route geometry 없음). 따라서
> **degraded 모드가 기본**이고, 좌표 확보가 MVP의 최대 선행조건(§6·§10).

| Entity | 소스 | 좌표 유무(현재) | 표현(좌표 有) | 표현(좌표 無 = fallback) | 기본 visibility |
|---|---|---|---|---|---|
| CurrentHousing(현재 집) | livingContext.current(+homeRef→Home) | ✗ | ★ "현재" 특수 marker(home pin) | 현재 region centroid 또는 라벨칩 "현재: 평촌 전세" | 항상 |
| CurrentRegion(현재 생활권) | current.regionRef | ✗(polygon 없음) | 반투명 영역 강조 | centroid marker + region chip | 항상(soft) |
| Workplace ×2 | conditions.workplaces | ✓(스키마), 실제 population은 geocoding 의존 | 직장 marker(A/B) | 라벨칩 "직장 미좌표" + 통근분만 표시 | 전략 상세 시 |
| ExistingHome | homeRepository | ✗ | 매물 marker(clusterable) | region centroid 그룹 + 리스트 | 선택 전략의 후보만 |
| PresaleHome | homeRepository | ✗ | 분양 marker(구분 색) + lifecycle 배지 | 동일 fallback | 선택 전략의 후보만 |
| Area(개발예정지) | areaRepository | ✗(polygon 없음) | 영역/centroid marker | centroid marker + chip | 선택 전략의 후보만 |
| HousingStrategy target | strategy.targetRef | 위 매물/Area 좌표 상속 | ★ 강조 marker + 현재→목표 관계선 | 관계 화살표(스키마틱) | **선택된 전략만** |
| preferred region | regionPrefs.preferred | ✗ | soft ring/tint | "관심" chip/필터 | soft, on-demand |
| excluded region | regionPrefs.excluded | ✗ | 강한(비-채움) 외곽선/해치 | "제외" chip + 해당 marker에 제외 배지 | 항상(약하지만 명확) |

**visibility 원칙(과밀 방지)**: 모든 데이터를 동시에 올리지 않는다.
- 기본 화면: 현재 집/생활권 + (전략 선택 시)그 전략의 target·직장만.
- 후보 매물 다수는 **선택된 전략의 후보 집합**으로 제한 + clustering.
- preferred/excluded는 항상 표시하되 **저채도/외곽선 수준**(marker를 가리지 않음).
- 레이어 토글(직장/후보/관심·제외)은 후속. MVP는 컨텍스트 기반 자동 visibility.

## 4. Strategy별 지도 표현

각 전략 선택 시 **강조(emphasis)** 대상만 정의(나머지는 dim).

| StrategyKind | 강조 | 관계선/애니메이션 | 핵심 메시지 |
|---|---|---|---|
| `buy_existing` | 현재 집 → 후보 매물 marker, 직장 ×2 | 현재→후보 이동선 + 각 직장까지 통근분 라벨(Δ) | "여기로 즉시 이동, 통근 이렇게 바뀜" |
| `apply_presale` | 현재 생활권 → 분양/Area target, 직장 ×2 | 현재→target + 입주연도 배지 | "미래 이 지역에 정착" |
| `rent_then_apply` | **현재 집(유지 강조)** + 청약 target | 현재는 '유지' 링, target은 점선(미래) | "지금은 여기 유지, 나중에 저기로" |
| `buy_presale_right` | 분양권 target marker + 전매상태 배지 | 현재→target(즉시성) | "청약 대기 없이 이 입주권 확보" |

- 공통: 현재 생활권 이탈 여부를 색/배지로("생활권 유지" vs "생활권 이동").
- 좌표 無일 때: marker 대신 **스키마틱 관계도**(현재 ● → target ●, 직장 ◆)와 통근 Δ만.

## 5. Current → Future 변화(지도에서)
- 현재 집 marker(★) + 후보 marker(○) + 둘 사이 이동 관계선.
- 각 직장까지 **통근 변화 Δ**를 선 라벨로(예: 내 +9분, 배우자 −7분). 데이터는 기존
  `currentHomeComparison`(current-housing §4) 재사용 — **지도는 표현만**, 계산은 도메인.
- 생활권 이탈 여부를 현재 생활권 강조 대비 target 위치로 시각화.
- **Degraded(통근/좌표 없음)**: 직선거리로 대체하지 **않는다**(오해 유발). 대신 통근분
  텍스트 Δ + "실측 경로 아님" 라벨, 또는 관계도만. 좌표 없으면 지도 대신
  **Current→Future 델타 패널**(이미 카드에 구현됨)을 그대로 노출.

## 6. preferred / excluded region 표현
- **excluded(hard)**: 강한 신호 but **화면을 덮지 않음** — polygon 채움 대신 **굵은 붉은
  외곽선/해치**(polygon 有) 또는 region **centroid에 '제외' 배지** + 그 지역 내 marker에
  작은 제외 아이콘(polygon 無). 리스트/필터에서도 회색 처리.
- **preferred(soft)**: "추천지역"으로 오해되지 않게 **저채도 링/틴트 + '관심' 라벨**.
  절대 "추천/베스트"류 표현 금지(랭킹 앱 회피).
- **polygon 없음(MVP 기본, RegionRef.level만 존재)** fallback 순서:
  1. region **chip/filter**(지도 상단 또는 사이드) — 가장 확실.
  2. region **centroid marker**(좌표 확보 시).
  3. 리스트 연계(해당 region 매물 강조/회색).
- MVP는 1(chip/filter) + marker 배지 수준. GIS polygon은 후속.

## 7. 지도 ↔ Decision View 연동
- **Decision View primary, 지도 secondary(설명 레이어).** 지도 단독 탐색 금지.
- 양방향 sync:
  - 카드(전략/후보) 선택 → 지도 해당 marker/관계 강조 + 뷰포트 fit.
  - marker 선택 → 카드 강조/스크롤.
  - 지도 이동(pan/zoom) → 탐색 보조일 뿐, 결정은 카드에서.
- 선택 상태는 **feature 레이어의 공유 UI 상태**(예: selectedStrategyId)로 관리, 지도·카드가
  구독. 도메인엔 지도 상태 없음.

## 8. 모바일 / 데스크톱 UX
- **모바일(우선)**: 상단 지도(접이식, 40~50vh) + 하단 **전략/후보 카드 시트**(스크롤).
  카드 시트를 위로 끌면 지도 축소. marker 탭 → 시트 해당 카드로 스냅. 지도는 "맥락 보기",
  결정은 시트에서. 지도 없이도(좌표 無) 시트만으로 완결.
- **데스크톱**: 좌 카드 리스트/Decision View(고정폭) + 우 지도(가변). 카드 hover/select ↔
  지도 강조. 넓은 폭에서 비교 매트릭스와 지도 병치 가능.
- 두 레이아웃 모두 **지도는 제거해도 기능이 성립**(progressive enhancement).

## 9. MVP / 후속 범위
**MVP(반드시)**
- 현재 위치/생활권(좌표 없으면 centroid/칩) · 직장 ×2 · 선택 전략의 Home/Presale/Area 위치.
- 전략 선택 시 관련 marker 강조 + 현재→target 관계.
- preferred/excluded 최소 표현(chip/배지).
- 각 marker에 fit/status 요약(팝오버).
- **카드 ↔ 지도 sync.**
- 좌표 부재 시 **degraded(관계도/델타 패널)**로 자동 강등.

**후속(제외)**
- 실제 통근 route·isochrone·교통계획.
- 역/학교/생활시설 레이어, 개발지구 polygon(GIS).
- 실거래가 Heatmap / 종합 부동산 레이어(**명시 제외**).
- 레이어 토글 UI, marker clustering 고도화.

## 10. Map Provider capability checklist (확정 아님 — 평가 템플릿)

이 문서에서 특정 API를 **확정하지 않는다.** 필요 capability를 정의하고 비교표만 제공.

| Capability | MVP 필요 | 비고 |
|---|---|---|
| Custom marker(HTML/이미지) | ★필수 | 현재/후보/직장 구분, status 배지 |
| Marker clustering | 후속 | 후보 다수 시 |
| Polygon/overlay | 후속 | region 경계(GIS 확보 후) |
| Viewport/이벤트(pan/zoom/click) | ★필수 | sync·fit-bounds |
| Fit bounds(여러 지점 맞춤) | ★필수 | 현재+target+직장 한 화면 |
| 모바일 성능/제스처 | ★필수 | 모바일 우선 |
| Geocoding(주소→좌표) | ★필수(선행) | **listing 좌표 확보 핵심**, 국내 주소 품질 |
| Directions/route | 후속 | 통근 경로 |
| 국내 주소/지번·도로명 품질 | ★필수 | Kakao/Naver 유리(가설) |
| 비용/쿼터 | ★필수 | 무료 한도·초과 과금 |
| 약관/상업 이용 허용 | ★필수 | 서비스화 가능 여부 |
| SDK 타입 격리 용이성 | ★필수 | §11 adapter |

후보(Kakao / Naver / Google / Mapbox 등)를 위 행으로 비교하는 표를 **선택 시점에** 채운다.
현재 코드 이력상 Kakao geocoding 권한 이슈(OPEN_MAP_AND_LOCAL 비활성) 존재 → 선택 전
**국내 주소 geocoding 실측 검증** 필요.

## 11. Adapter architecture (도메인 경계)

```text
domain(순수)                 feature adapter                 provider(SDK)
────────────                 ──────────────                 ────────────
Location {lat,lng}    ─┐
CurrentHousing         ├─► MapViewModel 조립 ─► MapAdapter ─► Kakao/Naver/… SDK
Home/Area/Strategy    ─┘     (MapEntity[])       (interface)     marker/overlay
```

- **도메인엔 지도 SDK 타입 금지.** `types.ts`·`HousingStrategy`·`CurrentHousing`·`Listing`에
  provider 좌표/marker 타입을 넣지 않는다.
- 새 순수 값타입: `Location { lat: number; lng: number }`(도메인). Home/Area에 **선택적
  `location?: Location`** 추가는 가능(순수 값, SDK 무관) — 좌표 확보 후.
- `MapEntity`(view-model, feature 레이어): `{ id, kind, location?, label, status?, role }`.
  도메인+좌표 조회로 조립. 지도는 이 view-model만 소비.
- `MapAdapter` interface(feature): `render(entities, selection)`, `fitBounds`,
  `onMarkerSelect`, `highlight(id)`. provider 구현이 SDK에 의존. 교체 가능.

## 12. Unknown / error / degraded states (숨기지 않는다)

| 케이스 | 표현 |
|---|---|
| current location 없음 | "현재 위치 미설정 — 우리 조건에서 입력" CTA. 지도는 후보만, 현재 기준 변화는 비활성 + 안내. |
| workplace 1개만 | 있는 직장만 표시, "직장 1곳만 입력됨" 배지. 통근 Δ는 해당 사람만. |
| listing 좌표 없음 | marker 대신 region centroid/리스트, marker에 "위치 근사" 라벨. degraded 관계도. |
| region polygon 없음 | chip/필터 + centroid(§6). |
| commute 데이터 없음 | 통근 Δ "미상"으로 명시, **직선거리로 대체 금지**. |
| strategy 대상 없음 | 지도 강조 없음, "표시할 전략 대상이 없어요". |
| excluded region 겹침 | 후보 marker에 '제외' 배지 + 카드 status(생성 단계서 이미 제외 시 목록서 제외 사유 표기). |

원칙: **unknown을 숨기지 않고 라벨로 명시**(product-vision·strategy status 규칙과 일관).

## 13. 대표 사용자 플로우

**A. 현재 평촌 전세 → 의왕 기존주택 매수 비교**
- 봄: 현재 집(★평촌) + 후보(○의왕) + 직장 ◆×2, 관계선 + 통근 Δ(내 +9, 배우자 −7).
- 클릭: `buy_existing` 카드 → 지도가 현재·후보·직장 fit-bounds, 생활권 이동 배지.
- 강조: 현재→후보 이동선, 의왕 marker, 통근 Δ 라벨.
- 복귀: marker 팝오버의 "이 전략 자세히" → Decision View 카드(gains/tradeoffs).

**B. 현재 전세 유지 → 하남교산 청약**
- 봄: 현재 집(★, '유지' 링) + 교산(○ 점선, 2032) + 직장 ◆×2.
- 클릭: `rent_then_apply` 카드 → 현재 '유지' 강조 + target 점선(미래).
- 강조: 현재는 유지 링, 교산은 미래 배지, "지금 이동 아님" 메시지.
- 복귀: 카드의 "전세 후보 미선정/유지" 상태와 일치.

**C. 기존주택 vs 분양권 전략을 지도에서 비교**
- 봄: 두 target(○기존, ◇분양권) 동시 + 현재 + 직장.
- 클릭: 비교 모드 → 두 전략 marker 나란히 강조, 각 status/전매 배지.
- 강조: 축별 차이는 지도 아닌 **TradeoffSummary**로(지도는 위치·통근만).
- 복귀: 비교 매트릭스로 스크롤.

## 14. 테스트 전략
- **순수 로직 우선**: MapEntity 조립(도메인→view-model), visibility rule, degraded 선택
  (좌표 유무 분기), sync 상태(선택→강조 대상 산출)를 **SDK 없이 단위 테스트**.
- Map SDK/DOM 렌더는 **모킹**(adapter interface에 fake). marker 좌표·fitBounds 인자만 검증.
- degraded 경로(좌표 없음/직장 1개/통근 없음)별 스냅샷/문구 테스트.
- 도메인엔 지도 의존 0 → 기존 도메인 테스트 무영향 확인.

## 15. 미결정 사항
1. **좌표 데이터 소스**(최대 선행): listing/area/region 좌표를 어떻게 확보?
   geocoding(어느 provider)·수집 배치·저장 위치(Home.location?)·정확도 기준.
2. **Map provider 선택**: §10 체크리스트로 Kakao/Naver/Google/Mapbox 실측 비교(특히 국내
   주소 geocoding·상업약관·비용). Kakao 권한 이슈 재확인.
3. **MVP를 degraded(무좌표 스키마틱)로 먼저 출시할지**, 좌표 확보 후 진짜 지도를 낼지.
4. **excluded의 지도 시각 강도**(배지 vs 외곽선) 최종 톤.
5. RegionRef **계층(level)·centroid** 도입 시점(polygon은 후속 합의).
