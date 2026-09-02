# 단지 상세 설계 (`/complex/[id]`)

한 단지의 **우리 조건 기준 적합도**를 이해시키고, 후보/즐겨찾기/메모를 관리하는 화면.
[screens-and-routing.md](./screens-and-routing.md) §4.4를 구체화하며, [domain-model.md](./domain-model.md)·[scoring.md](./scoring.md)와 충돌하지 않는다.

**원칙**
- **계산 점수와 원시 정보를 명확히 분리**한다(다른 섹션).
- scoring은 `computeFit`를 재사용하고 UI에서 재구현하지 않는다.
- 상세는 **progressive disclosure**(접기/펼치기)로 노출한다.

---

## 1. 데이터 조회
- route param `id` → `useComplex(id)`.
- `conditionsStore`의 조건/우선순위/절대조건 → `computeFit(conditions, priorities, dealbreakers, complex)`.
- 지역명: `useRegions()`로 `regionId → name` 매핑.
- 적합도는 **조건이 준비된 경우에만** 계산(`isConditionsReady`). 미완성이면 점수 대신 안내.

## 2. 레이아웃 (progressive disclosure)
위→아래 순서(모바일 단일 컬럼):
1. **히어로**: 단지명 · 지역명 · 대표 가격 · 대표 평형 · 큰 ScoreGauge(totalScore) · 절대조건 통과/미통과 상태.
2. **Dealbreaker 경고**: 실패 시에만 명확한 경고 영역(§3).
3. **항목별 적합도**(7축 bar) — 접기/펼치기(기본 펼침).
4. **원시 정보** — 별도 섹션, "자세히"로 확장(기본 접힘).
5. **후보/메모** 관리.

데스크톱: 480px 고정이 아니라 `max-w-2xl`~`3xl`. 히어로는 `md`에서 2-column(점수 | 핵심 정보).

## 3. Dealbreaker 표현
- 통과: 과도한 강조 없이 담백한 배지(예: "절대조건 통과").
- 실패: **경고 영역**(danger 톤)으로 실패 조건을 나열. 점수가 높아도 탈락 사실이 묻히지 않게 히어로 근처 상단에 배치.
- `failedDealbreakers` 키 → 사용자 친화 한국어 문구로 변환(§매핑).

## 4. 항목별 적합도 (7축)
- 축: 가격·출퇴근·교육/육아·신축·생활 인프라·주거환경·미래가치.
- 각 축: 항목명 + 0~100 score + bar(적합도 밴드 색). `axisScores` 사용.
- **미래가치는 "현재 테스트용 데이터" 고지**를 함께 표시.
- 긴 설명은 기본 노출하지 않는다(bar만). 상세 설명은 향후 확장.

## 5. 원시 정보 (점수와 분리)
- 대표 가격, 가격 범위(min~max), 평형, 준공연도/연식, 세대수, 역 거리, **두 직장까지 통근시간**(workplace 라벨별), 학교 접근성.
- 점수/원시 데이터를 시각적으로 혼동하지 않게 라벨·섹션 구분.

## 6. 후보 관리 (candidatesStore)
- 후보 아님: **"후보에 담기"**.
- 후보임: 담김 표시 + **후보에서 제거** + **favorite toggle**.
- 후보 제거 시 메모도 함께 제거(현 store 정책 그대로).

## 7. 메모 (Candidate일 때만)
- `pros[]` · `cons[]`: 간단 추가/삭제(입력 + 추가, 각 항목 삭제).
- `visitMemo`: textarea.
- 저장은 `candidatesStore.updateNotes`. rich text/에디터 없음.

## 8. 비교 액션
- Candidate인 경우 **"비교하기"** → `/compare?a=<complexId>` 링크.
- 비교 화면 구현은 이번 범위 아님(링크만 준비).

## 9. 상태 처리
- query loading / error / **존재하지 않는 id(data===null)**.
- conditionsStore·candidatesStore **hydration 전에는 판정 보류**(로딩) → 후보 버튼 flicker 방지.
- conditions 미완성: 점수 섹션 대신 "조건 완성" 안내(원시 정보는 표시 가능).

## 10. 반응형
- Mobile First 단일 컬럼(점수 → 핵심 정보 → 상세 → 메모).
- Desktop: `max-w-2xl`+, 히어로 2-column 확장. 480px 고정 금지.

## 11. 구조
- `page.tsx` 얇게 → `ComplexDetailFeature id={id}` 렌더.
- 조립은 `src/features/complex-detail/`(Hero·DealbreakerAlert·AxisScoreList·RawInfo·CandidateActions·NotesEditor).
- formatter(`lib/format`)·label 매핑(`lib/priorityLabels`, feature 내 dealbreaker 매핑) 분리.
- domain은 React/Zustand 비의존 유지. `isConditionsReady`는 `lib/conditions`로 공유.

## 12. failedDealbreakers → 한국어 매핑
| key | 문구 |
|---|---|
| maxPrice | 최대 가격 초과 |
| minSizePyeong | 희망 평형 없음 |
| maxStationDistanceM | 역과의 거리 초과 |
| maxBuildingAgeYears | 연식 초과 |
| minHouseholds | 세대수 부족 |
| requireSchoolNearby | 학교 접근성 미달 |

## 정합성 확인
- screens-and-routing §4.4(히어로·적합도 접기·원시 자세히·메모·비교 추가)와 일치. BottomNav는 `(app)` 레이아웃이 제공하며 상세에서 '후보' 탭 활성 유지(이미 구현).
- domain-model §6~7(FitResult·failedDealbreakers·비교)·scoring 규칙 재사용, 저장 금지 규칙(파생값·원본 미저장) 준수.
