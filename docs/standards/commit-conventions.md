# 커밋 컨벤션

[Conventional Commits](https://www.conventionalcommits.org)를 따른다.

## 형식

```
<type>: <제목 (72자 이내)>

<본문 — "왜"를 설명 (선택)>
```

## type

- `feat` 기능 추가
- `fix` 버그 수정
- `refactor` 동작 변경 없는 구조 개선
- `test` 테스트 추가/수정
- `docs` 문서(설계 문서·표준 포함)
- `chore` 빌드·설정·잡무

## 규칙

- 제목은 명령형·현재형.
- 하나의 커밋 = 하나의 논리적 변경.
- 본문에는 무엇보다 **왜**를 남긴다.
- 설계 변경을 동반하면 `docs:`(문서) 커밋을 **먼저** 하거나 같은 커밋에 문서 변경을 포함한다.

## 대소문자 · 표기

| 요소 | 규칙 | 예 |
|------|------|-----|
| type | 항상 **소문자** | `feat` (❌ `Feat`, `FEAT`) |
| 제목 첫 글자(동사) | **소문자**, 명령형 | `add`, `scaffold` (❌ `Add`) |
| 고유명사 | 원래 표기 유지 | `Next.js`, `Tailwind`, `TypeScript`, `Supabase` |
| 끝맺음 | 마침표 **없음** | `add scoring engine` (❌ `... engine.`) |

- 즉 **타입·문장 시작은 소문자, 고유명사만 대문자**. `chore: scaffold Next.js app`에서 `scaffold`(소문자 동사) + `Next.js`(고유명사)가 섞여 보이는 건 정상이다.
- 한글 제목도 타입은 소문자로 둔다. 예: `feat: 적합도 엔진 추가`.

## 예시

```
feat: add weighted fit scoring engine

7축 정규화 + 가중합을 순수 함수로 구현.
scoring.md §7 워크드 예시를 단위 테스트 기대값으로 고정.
```
