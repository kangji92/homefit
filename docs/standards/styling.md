# 스타일 · 디자인 표준

Tailwind CSS v4 + shadcn/ui 기준. 상세 스택은 `docs/development-environment.md` §6.

## 토큰 · 설정

- Tailwind v4는 **CSS-first**: 색·간격·폰트 등 토큰을 `src/app/globals.css`의 `@theme inline`에 정의한다.
- 클래스 정렬은 `prettier-plugin-tailwindcss`가 자동 처리.
- 클래스 조합은 `cn()`(`clsx` + `tailwind-merge`) 유틸을 통해서만.

### 디자인 토큰 (globals.css)

shadcn(neutral) 기본 토큰을 **재사용**하고, Homefit 시맨틱 토큰만 추가한다. raw 값은 `:root`/`.dark`에, Tailwind 유틸용 매핑은 `@theme inline`(`--color-*`)에 둔다.

| 구분 | 토큰 | 용도 |
|---|---|---|
| shadcn 재사용 | `--background` `--foreground` `--primary` `--primary-foreground` `--card` `--muted` `--border` `--destructive` … | 기본 표면·텍스트·강조 |
| Homefit 표면 | `--surface` `--surface-foreground` `--surface-muted` `--surface-muted-foreground` | 카드/서브 배경(의미 명시용) |
| 상태 | `--success` `--warning` `--danger` (+ `-foreground`) | 통과/경고/탈락·오류 |
| **적합도 전용** | `--fit-high` `--fit-medium` `--fit-low` | **ScoreGauge 등 적합도 강조 — 색 강조는 여기에 집중** |

- 사용 예: `bg-surface`, `text-fit-high`, `bg-success/10 text-success` 등 Tailwind 유틸로 접근.
- 값(oklch)은 **시작점이며 튜닝 가능**. 변경 시에도 토큰 이름은 유지한다.
- **브랜드 강조색**을 도입하려면 `--primary`(현재 neutral)만 교체하면 컴포넌트 전반에 반영된다.

## shadcn/ui

- 생성물은 `src/components/ui/`. **필요할 때 개별 컴포넌트만 추가**(전량 설치 금지).
- 프리미티브를 그대로 쓰고, 근거 없는 래핑을 만들지 않는다.

## 디자인 톤 (Homefit)

- **모바일 우선 반응형 + 화면별 선택적 데스크톱 확장**: 기본은 모바일 1열(중앙 정렬 컨테이너). 콘텐츠가 넓을 때 이득인 화면(예: VS 비교, 후보 목록)만 `md`+에서 넓은 폭·다열로 확장한다. 모든 화면을 무조건 좁게 고정하지 않는다.
- 넉넉한 여백, **카드 기반 UI**, 핵심 정보 우선 + **progressive disclosure**.
- **뉴트럴 베이스 + 절제된 단일 강조색**. 색 강조는 **적합도 점수(ScoreGauge)**에 집중.
- 과도한 그래프·색 지양. 신혼부부 서비스라도 **핑크·과한 귀여움 금지** — 소비자용 라이프스타일 톤.
- 다크모드는 토큰 기반으로 확장 가능하게 두되 MVP 필수 아님.
- 접근성: 색만으로 정보 전달 금지(아이콘·라벨 병행), 대비 확보.
