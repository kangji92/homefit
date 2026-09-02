# E2E(Playwright) 작성 표준

Homefit은 Playwright를 **실제로 설치·실행**한다(`pnpm e2e`). 스펙은 `e2e/`에 둔다.

## 파일·구조

- 한 파일 = **하나의 사용자 플로우**(`e2e/<flow>.spec.ts`).
- 구조: **Arrange(이동) → Act(상호작용) → Assert(관찰 가능한 결과)**.

## 우선 플로우 (MVP)

1. 온보딩 → 조건 저장 → 홈 진입
2. 후보 담기 → 즐겨찾기 → 단지 상세 메모 작성
3. 후보 2개 → `/compare` 비교 결과 확인

## 셀렉터

- **role·label·text 기반**(`getByRole`·`getByLabel`·`getByText`). CSS 클래스·`data-testid` 남발 지양.

## 검증 · 대기

- 사용자가 실제로 하는 행위와 확인하는 결과만 단언(내부 상태 금지).
- Playwright **자동 대기**에 의존. 고정 `sleep`/지연 금지.
