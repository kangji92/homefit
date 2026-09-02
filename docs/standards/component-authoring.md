# 컴포넌트 작성 표준

`ai-fe-harness`의 컴포넌트 표준을 Homefit(Next App Router + Tailwind + shadcn/ui) 맥락으로 확장한다.

## 파일·폴더

- 폴더 구조: `src/components/<Name>/{<Name>.tsx, <Name>.test.tsx, index.ts}`
  - `<Name>.stories.tsx`는 **선택**(Storybook 미도입 상태 — 도입 시 CSF3로 추가).
- 컴포넌트·파일명은 **PascalCase**. `index.ts`에서 `export * from "./<Name>"`.
- **재사용 UI**는 `components/ui/`, **화면 조립**은 `features/<screen>/`. 도메인 로직은 컴포넌트에 넣지 않는다(`domain/`·`stores/`·`data/`).

## Server / Client 경계 (Next App Router)

- `page.tsx`·`layout`은 **가능하면 Server Component**로 둔다.
- `"use client"`는 Zustand·localStorage·form·이벤트 핸들러·browser API가 **실제로 필요한 최하위 경계**에만 붙인다.
  ```tsx
  export default function CandidatesPage() { return <CandidatesFeature />; } // server
  // features/candidates/CandidatesFeature.tsx
  "use client";
  ```

## Props

- **명시적 인터페이스**: `export interface <Name>Props { ... }`.
- `any` 금지. 유니온·제네릭으로 정확히 표현.
- 선택 props는 구조분해에서 기본값 지정(`variant = "primary"`).

## 스타일

- **Tailwind 클래스 기반**. 클래스 조합은 `cn()` 유틸 사용. 인라인 스타일은 동적 값에 한해 최소화.
- **shadcn/ui 프리미티브를 우선 사용**하고, 근거 없이 미리 감싸지 않는다(YAGNI). 실제 재사용이 2회+ 생길 때 공통화.

## 접근성

- 시맨틱 태그 우선(`button`·`nav`·`ul`…). 인터랙티브 요소는 role·aria·label을 갖춘다.
- 키보드 접근성(focusable, Enter/Space). `eslint-plugin-jsx-a11y` 위반은 CI에서 차단.

## 구현

- 부수효과는 이벤트 핸들러/effect로 분리, 렌더 중 상태 변경 금지.
- 한 파일이 커지면 책임 단위로 분리.
