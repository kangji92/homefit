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

## 예시

```
feat: add weighted fit scoring engine

7축 정규화 + 가중합을 순수 함수로 구현.
scoring.md §7 워크드 예시를 단위 테스트 기대값으로 고정.
```
