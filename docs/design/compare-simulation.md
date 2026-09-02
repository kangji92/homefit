# VS 비교 — 우선순위 시뮬레이션 설계

`screens-and-routing.md`의 VS 비교(`/compare`) 화면을 확장한다. 저장된 우리
조건은 그대로 둔 채, **"우선순위를 이렇게 바꾸면 누가 이기나?"**를 즉석에서
실험하는 what-if 도구다.

## 1. 목적

- 두 후보의 승부가 우선순위 가중치에 얼마나 민감한지 사용자가 직접 확인한다.
- 예: "미래가치보다 통근을 더 중요하게 보면 결과가 뒤집히나?"
- 결정적 계산(`computeFit`)을 재사용하므로 AI가 개입하지 않는다.

## 2. 범위 (MVP)

포함:
- 비교 화면 하단에 접이식 **"우선순위 시뮬레이션"** 섹션.
- 7축 슬라이더(저장된 `priorities`가 초기값).
- 슬라이더 조정 시 두 후보의 총점·7축·항목별 winner·종합 우세가 **즉시 재계산**.
- **초기화** 버튼(저장값으로 복귀).
- **이 우선순위로 저장** 버튼(선택) → `conditionsStore.setPriorities`로 실제 반영.

제외(MVP 아님):
- dealbreakers/예산/통근 조건 변경 시뮬레이션. 절대조건은 가중치와 무관하므로
  통과/탈락 결과는 시뮬레이션에서 변하지 않는다(그대로 표시).
- 3개 이상 후보 동시 시뮬레이션.
- 시뮬레이션 히스토리·되돌리기.

## 3. 동작

1. 시뮬레이션 섹션은 기본 접힘(`<details>`). 펼치면 슬라이더 노출.
2. 로컬 상태 `simPriorities`(초기값 = 저장된 `priorities` 복사본).
3. 슬라이더 변경 → `simPriorities` 갱신 → 상단 비교 결과가 `simPriorities`로
   다시 계산되어 렌더.
4. **저장값과 다를 때만** "초기화"·"저장" 버튼과 "변경됨" 배지를 활성화한다.
5. **초기화**: `simPriorities`를 저장값으로 되돌린다(스토어는 건드리지 않음).
6. **저장**: `setPriorities(simPriorities)` 호출. 저장 후 `simPriorities`가 곧
   새 저장값이 되므로 "변경됨" 상태가 자연히 해제된다. 저장은 홈·상세·비교
   전체 점수에 영향을 주는 되돌리기 어려운 동작이므로 확인 문구를 함께 노출한다.

## 4. 계산 흐름

- 현재 `CompareFeature`는 저장된 `priorities`로 `computeFit`을 호출한다.
- 시뮬레이션 도입 후에는 **표시에 쓰는 우선순위**를 `simPriorities`로 일원화한다.
  - `fitA = computeFit(conditions, simPriorities, dealbreakers, complexA)`
  - `fitB = computeFit(conditions, simPriorities, dealbreakers, complexB)`
  - `comparison = compareFit(fitA, fitB)`
- 슬라이더 초기값이 저장값과 같으므로, 사용자가 만지기 전에는 기존과 동일한
  결과가 나온다(회귀 없음).
- `computeFit` 내부에서 가중치는 정규화되므로 절대 크기가 아니라 **비율**만
  결과에 영향을 준다.

## 5. 상태 소유

- `simPriorities`는 **비교 화면 로컬 state**다. 스토어에 저장하지 않는다
  (저장 버튼을 누르기 전까지 실험은 휘발성).
- 후보 선택(`?a=&b=`)이 바뀌어도 `simPriorities`는 유지한다(같은 실험을 다른
  후보 쌍에 적용해볼 수 있도록).

## 6. 컴포넌트

- `SimulationPanel`(신규, compare 피처 내부):
  - props: `value: Priorities`, `onChange(next)`, `saved: Priorities`,
    `onReset()`, `onSave()`.
  - 7축 슬라이더 + 변경됨 배지 + 초기화/저장 버튼.
  - 슬라이더는 RHF에 묶이지 않은 **제어 컴포넌트**(온보딩의 `PrioritySlider`는
    RHF 전용이라 재사용하지 않고 별도 경량 슬라이더 사용).
- 우선순위 라벨(`PRIORITY_LABELS`)과 레벨 표기(낮음/보통/높음)는 상세·온보딩과
  일관되게 재사용한다. 레벨 헬퍼는 온보딩 피처에만 있으므로 `src/lib/`로 옮겨
  교차 import를 피한다.

## 7. 접근성 · UX

- 각 슬라이더 `type="range"`, `aria-valuetext`에 "레벨 값" 제공.
- 섹션 `<details>/<summary>`로 키보드 접근 가능.
- 모바일 우선: 슬라이더 세로 스택, 터치 타깃 충분히.
- "저장" 실행 시 `role="status"`로 "우선순위를 저장했어요" 안내.

## 8. 테스트

- 슬라이더를 움직이면 총점/winner가 다시 계산되어 표시가 바뀐다.
- "저장값과 다를 때만" 초기화/저장 버튼이 나타난다.
- 초기화가 슬라이더를 저장값으로 되돌린다(스토어 불변).
- 저장이 `conditionsStore.priorities`를 갱신한다.
- 후보를 바꿔도 시뮬레이션 값이 유지된다.
