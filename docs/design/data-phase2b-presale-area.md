# Phase 2-B — 분양 단지(Presale) · 개발 예정지(Area)

v2 모델(`domain-model-v2.md`)의 `PresaleHome`·`Area`를 실제로 채운다. 대상을
기존 아파트에서 **분양 단지**와 **3기신도시 같은 개발 예정지**까지 넓힌다.

MVP·2A 원칙 유지: **mock 시드 우선**, 데이터 접근은 repository/adapter 뒤로
추상화해 나중에 실데이터(청약홈·개발계획)로 교체한다.

## 1. 범위

포함(mock-first):
- **Area(개발예정지)** 데이터: 3기신도시(남양주왕숙·하남교산·인천계양·고양창릉·
  부천대장) mock `areaMetrics`(테스트 데이터 고지).
- **PresaleHome(분양)** 데이터: 분양 단지 mock(분양가·입주예정·청약일정).
- 조회 seam: `areaRepository`, presale은 home 계열 repository로.
- 스코어링: presale→`computeHomeFit`(이미 동작), area→`computeAreaFit`(골격).
- UI: 홈 **섹션 분리**(주택=HomeFit / 개발예정지=AreaFit), `/area/[id]`,
  presale은 `/complex/[id]` 재사용(분양가·입주예정·unknown 경고).
- 후보/비교: area 후보(kind:"area")·같은 종류끼리 비교.

제외(다음):
- 실데이터 연동(청약홈 API·LH/국토부 개발계획) — adapter만 교체하면 되게 설계.
- 청약 자격/대출(2C), 지표 실측(2D).

## 2. 데이터 모델 (v2 재사용)

- `PresaleHome { kind:"presale", moveInYear, subscription?, households?,
  stationDistanceM? }` — 미확정 필드는 optional → dealbreaker **unknown**.
  price는 `ComplexPrice`(분양가를 sale 밴드로).
- `Area { kind:"area", areaMetrics{plannedInfra,transitPlan,supply,
  futurePotential,environment}, targetMoveInYear?, commuteMinutes? }`.
- 3기신도시는 자체 `Region`(수도권 그룹) + `Area` 레코드. regionId로 그룹.

## 3. 스코어링

- **presale → HomeFit**: `computeHomeFit` 그대로. price=분양가, newness=입주예정
  연도(미래면 신축 만점). 미확정 dealbreaker는 unknown(탈락 아님) → UI 경고.
- **area → AreaFit**: `computeAreaFit` 골격 사용. **공식은 아직 확정하지 않는다** —
  mock `areaMetrics`를 넣고 결과를 눈으로 본 뒤, 반영 축·가중을 조정한다.
  현재 매핑: infrastructure→plannedInfra, environment→environment,
  futurePotential→futurePotential. (transitPlan/supply/education 반영은 실감 확인
  후 추가 검토 — `AREA_AXIS_FROM_PRIORITY` TODO.)
- **HomeFit ↔ AreaFit 직접 점수 비교 금지**(척도 다름). 홈에서 섹션 분리 표시.

## 4. UI

- **홈**: 두 섹션. `추천 주택`(기존/분양, HomeFit 카드) / `개발 예정지`(Area,
  AreaFit 카드). 서로 순위 섞지 않음.
- **`/area/[id]`**: Area 상세 — AreaFit 총점·축, areaMetrics 원시값, 관련 분양
  단지·청약 일정(있으면), "지표는 테스트 데이터" 고지.
- **`/complex/[id]`**: PresaleHome도 여기서. 분양가·입주예정 표기, 미확정
  dealbreaker는 "⚠️ 아직 확정되지 않았어요"로. 데이터 완성도 배지(후속).
- **후보/비교**: area는 `addCandidate(id,"area")`. 비교는 같은 종류끼리
  (집 vs 집 / 지역 vs 지역), 교차는 나란히+경고.

## 5. 청약 일정(2B 최소)

`PresaleHome.subscription { announcementDate?, scheduleNote? }`를 상세에 표시.
"다가오는 청약" 목록·알림은 2C(사용자 프로필)와 함께 확장.

## 6. 실데이터 경로(후속, adapter 교체)

- presale: 청약홈(한국부동산원) 분양/청약 API → adapter → PresaleHome.
- area: LH·국토부 3기신도시 계획(공급·교통계획·인프라) → adapter → areaMetrics.
- 2A와 동일: 앱은 repository/Supabase만 읽고, 수집 잡이 채운다.

## 7. 서브 단계 (권장 순서)

1. **2B-1 Area(3기신도시)** — 새 부분(AreaFit·/area·홈 섹션 분리)을 먼저 세워
   v2 모델을 화면까지 관통. mock area + computeAreaFit 확인 → 축 조정.
2. **2B-2 Presale(분양)** — HomeFit 재사용이라 증분. mock presale + /complex
   presale 표기 + unknown 경고 + 후보/비교.
3. **2B-3 청약 일정** 표시.
4. 이후 실데이터(청약홈·개발계획) 연동.

## 8. 미결정(구현 중 확정)

- AreaFit에 transitPlan/supply를 반영할지(반영 시 대응 우선순위 없음 → 고정
  가중? 별도 처리?) — mock 결과 보고 결정.
- 3기신도시 Region 구조(개별 Region vs 단일 "수도권 개발예정지" 그룹).
- presale 후보를 홈 어느 섹션에 둘지(주택 섹션 = HomeFit이므로 주택 섹션).
