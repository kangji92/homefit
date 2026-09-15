# 현장 매물 분석 (Manual Broker Property)

> 이 문서가 "현장 매물 분석" 흐름의 single source of truth다. 코드가 이 문서를 참조한다.
> vision · 개발레이어 원칙(판단 보조·비예측·provenance)을 상속한다.

## 목적
사용자가 부동산에서 **직접 본 재개발 매물**의 가격·권리 정보를 입력하면, 원하는 신축
평형을 받기까지의 **예상 총투입액**을 계산해 보여준다. 핵심 질문:

> "부동산에서 본 이 빌라를 지금 사서 재개발을 기다리면, 원하는 신축 평형을 받기까지
> 결국 총 얼마가 필요한가?"

이 기능은 **재개발 투자 수익 예측기가 아니다.** ROI·순위·미래시세·자동판정을 하지 않는다.

## 데이터 흐름
```
실제 정비사업(DevelopmentArea) → 실제 본 매물(Home, 수기) → 권리/비용(RedevelopmentCost)
→ 희망 신축 평형(area.memberSaleEstimates) → 예상 추가분담금 → 최종 총투입액
```

## 도메인 재사용 (신규 Property 도메인 없음)
- 매물 = `Home { kind:"existing", housingType:"villa" }` + `Home.listing` + `Home.redevelopment`.
- 평형별 예정분양가 = **`DevelopmentArea.memberSaleEstimates`** (정비사업 쪽). Home/CostEstimate에
  **금액을 복사 저장하지 않는다.** 희망 평형은 **id 참조**(`redevelopment.desiredMemberSaleEstimateId`).
- 계산 = `computeRedevelopmentCost` / `computeRedevelopmentCostRange` (순수·결정적, 재사용).
- 범위 = `MoneyRange`(min~max) 재사용. base(중앙값)는 **표시용 UI 파생**이지 도메인 타입 아님.

## 최소 additive type 변경
1. `MemberSaleEstimate.id: string` — 안정적 참조 키(희망 평형 저장·복원용).
2. `MemberSaleEstimate.price?: MoneyRange` — **optional**. 근거 있는 평형만 가격, 없으면 `undefined`
   → "예정가 미확보"(임의 추정 금지).
3. `RedevelopmentLink.desiredMemberSaleEstimateId?: string` — 사용자가 고른 희망 평형(id 참조).
4. `RedevelopmentLink.inside?: boolean` — **optional로 완화**(아래 semantics).

## `inside` semantics (중요)
`inside` = **공식 geometry 기준 구역 내부임이 확인됨**. 사용자가 Step 2에서 사업을 고른 것만으로
`true`로 단정하지 않는다. 수기 매물은 기본 `inside: undefined`(미확인). 사업 연결 자체의 provenance는
매물의 `listing.sourceType`(broker/user_input)로 표현한다 — UI는 "사업 연결 · 사용자 지정"으로
보여주고 "구역 내부 확인"과 혼동시키지 않는다. (`true`는 공식 확인이 있을 때만.)

## 사용자 흐름 (진행형, 한 화면에 다 펼치지 않음)
- **Step 1. 어떤 매물인가요?** 최소: 매물명·매매가·대지지분·전용면적. 추가(접힘): 공시가·실거래·준공·층.
- **Step 2. 어떤 정비사업에 포함되나요?** real `DevelopmentArea` 선택 → `redevelopment.areaId`.
  주소/polygon 자동판정 없음. 내부 여부 자동 법적판단 없음.
- **희망 신축 평형** 선택(선택한 사업의 `memberSaleEstimates`에서) → `desiredMemberSaleEstimateId`.
- **Step 3. 권리 정보를 알고 있나요?** 종전자산평가액(모름 허용). 비례율은 분석 화면에서(모름 허용).
  **모르는 값 = undefined. 임의 추정 없음.**

## Cost Simulator 연결 — 암묵적 기본값 제거(필수)
- 매핑: 매매가→`purchasePrice`, 종전자산→`previousAssetAppraisal`, 비례율→`proportionalRate`,
  선택 평형 `price(MoneyRange)`→`memberSale`.
- **금지: 값이 없을 때 몰래 기본값 주입**(예전 코드의 종전 6억·비례율 100%·분양가 10억 fallback 제거).
  필수 입력이 없으면 그 항목은 **"계산 전"**으로 두고, 무엇이 필요한지 안내한다.
  - 권리가액: 종전자산평가액·비례율 필요.
  - 추가분담금: 권리가액·조합원분양가 필요.
- 부분 계산 가능하면 pure 함수 결과만 보여준다(임의값으로 완성 금지).

## 결과 UX (이 P0의 핵심)
- **hero = `예상 총투입액`**(현재 매수가가 아니라). 가장 크게 강조.
- **"왜 이 금액인가?" breakdown**: `현재 매입 + 예상 분담금 = 기본 총투입` 식으로 계산 구조 설명.
- **불확실성/출처 요약**: 각 값의 source(사용자 입력 / 현장 중개·미검증 / 공식·확인)를 나열.
  안내 한 줄: "실제 분담금은 관리처분계획 및 조합의 공식 자료에 따라 달라질 수 있습니다."
  과도한 경고 UX는 피한다.

## 실제 vs mock
`listing.sourceType`: `mock`(샘플) / `broker`(현장 확인) / `user_input`(사용자 입력)로 구분 표시.

## 저장
`useManualPropertyStore`(Zustand persist, localStorage) 재사용. `Home` upsert(id 기준). 희망 평형은
`redevelopment.desiredMemberSaleEstimateId`로 함께 persist → 재열람 시 복원. DB/API/admin 없음.

## 진입점
분석/상태는 기존 `DecisionMapView`(전략 탭 지도 뷰) 재사용. 추가로 **탐색(/explore)**에
"현장에서 본 매물 분석하기" CTA 하나 → `/strategy?view=map`. (Explore = 특정 매물을 살펴보는
맥락이라 "현장에서 본 매물 분석"과 이웃. 새 대형 라우트·IA 재편 없음.)

## 지도 연결
매물에 location 있으면 기존 `existing_home` point entity로 표시(구조 유지). 이번 P0에서 주소
geocoding·polygon 내부 자동판정·지도에서 주소 찍기는 **구현하지 않는다**.

## 이번 범위 밖
scraping·자동수집·주소기반 구역 자동판정·분양자격/입주권/종전자산/비례율 자동예측·미래시세·
ROI·투자추천/순위·fitScore 변경·지도 아키텍처 확장·backend/admin CRUD.
