# 실데이터 통합 매핑 (mock → 실제 소스)

MVP는 모든 값을 mock 시드로 채운다. 이 문서는 **각 도메인 필드가 앞으로 어떤
실데이터 소스로 교체되는지**를 박아두는 레퍼런스다. 구현 단계에서 이 매핑을
source of truth로 삼아 필드별로 뜯어 통합한다.

관련: 데이터 접근 seam은 [`data-phase2-supabase-catalog.md`](./data-phase2-supabase-catalog.md)
(Phase 2-A, 완료)에서 준비됨.

## 원칙 — ETL → Supabase, 읽기 seam 무변경

외부 API를 앱에서 직접 부르지 않는다(키 노출·CORS·rate limit·지연). **수집 잡**이
주기적으로 외부 소스를 받아 Supabase 카탈로그(`complexes`/`regions`)에 upsert하고,
앱은 2-A대로 Supabase에서 읽는다. 따라서 아래 어떤 필드를 실측화해도
`features`/`hooks`/`domain`은 **무변경**이다.

```
외부 소스 → [수집 잡] → Supabase 테이블 → 앱 읽기(무변경)
```

## 필드 매핑

| 도메인 필드 | 현재(MVP) | 실데이터 소스 | 키/제약 | 난이도 |
|---|---|---|---|---|
| `Complex.price.sale` (매매) | mock 시드 | **국토부 아파트 매매 실거래가** (data.go.kr) | 무료 공식 키, 법정동코드+아파트명 매칭 | 중 |
| `Complex.price.jeonse` (전세보증금) | mock 시드 | **국토부 아파트 전월세 실거래** (전세=월세0) | 위와 동일 | 중 |
| `Complex.commuteMinutes` (단지→직장 편도 분) | mock 프리셋 | **지도/경로 API** (Kakao/Naver/ODsay) | 키·쿼터·비용, 대중교통/자동차 구분 | 중~상 |
| `Complex.metrics.education` (교육·학군) | mock seed | **학교/교육 공공데이터** (학교알리미·교육부) | 지표 산출 규칙 설계 필요 | 상 |
| `Complex.metrics.infrastructure` (생활 인프라) | mock seed | **POI 데이터** (Kakao/Naver 로컬 검색: 마트·병원·편의) | 밀도→점수 산출 규칙 | 상 |
| `Complex.metrics.environment` (주거환경) | mock seed | **공원/녹지·환경 공공데이터** | 지표 산출 규칙 | 상 |
| `Complex.metrics.futurePotential` (미래가치) | mock seed(테스트 고지) | **별도 분석 지표** (교통호재·개발계획·GTX 등) | 단일 소스 없음, 자체 분석 | 최상 |

### 단지 팩트(카탈로그 정적 속성)

| 필드 | 현재 | 실데이터 소스 |
|---|---|---|
| `Complex.completionYear` / `households` / `sizesPyeong` | mock | 건축물대장·단지정보 (부동산 공공데이터) |
| `Complex.stationDistanceM` | mock | 역 좌표(공공데이터) + 단지 좌표 거리계산 |
| `Complex.schoolNearby` | mock | 학교 위치(교육 공공데이터) + 거리 임계 |
| `Region` (name/summary) | mock | 직접 큐레이션 or 행정구역·신도시 메타 |

### 사용자 상태 (참고 — 필드 매핑 아님)

| 대상 | 현재 | 실데이터 |
|---|---|---|
| `conditions` / `candidates` | localStorage(persist) | **Supabase Auth 로그인 + 사용자 테이블 동기화** (Phase 2-C) |

## 공통 전제 · 주의

- **단지 정체성**: 실거래가·POI를 붙이려면 각 카탈로그 단지를 **실제 아파트**
  (법정동코드 `LAWD_CD` + 아파트명, 좌표)에 매핑해야 한다. 현재 mock 단지는
  준가공이므로, 실측 단계에서 실제 아파트로 교체하거나 매핑 테이블을 둔다.
- **단위 정합**: 국토부 거래금액은 **만원** 단위 → 도메인 `PriceBand`(만원)와 일치.
- **결정성 유지**: 스코어링은 결정적. 수집 잡도 `Date.now()` 직접 호출 금지(대상
  기간·기준연도는 인자로 주입).
- **쓰기 권한**: 앱 anon 키는 카탈로그 **읽기 전용 RLS**. 수집 잡의 upsert는
  service role 키(서버 전용)로 분리한다.
- **부분 실패 격리**: 매칭 실패·거래 0건이면 해당 필드 스킵(로그), 기존 값 유지.

## 단계 제안 (독립적으로 착수 가능)

1. **2-B1 실거래가** (`price.sale`/`price.jeonse`) — 무료 공식 API, 가격 점수에
   직접 반영. 가치 대비 난이도 낮아 첫 대상 추천.
2. **2-B2 통근시간** (`commuteMinutes`) — 경로 API. 키·비용 확보 후.
3. **2-B3 정성지표** (`metrics.*`) — 산출 규칙 설계가 큰 일. education→infra→
   environment 순, `futurePotential`은 자체 분석이라 최후.
4. **2-C 사용자 상태** — 로그인 + 클라우드 동기화(별도 트랙).
