# Phase 2-1 — 실거래가 연동 설계 및 PoC

`price.sale`/`price.jeonse`를 국토부 실거래가로 실측화하는 **첫 실데이터 단계**.
처음부터 전 지역을 붙이지 않고 **단지 1~2개 PoC**로 `조회 → adapter 정규화 →
repository → domain → 화면 표시 → scoring 영향 검증`을 관통해 **구조를 확정한 뒤**
확대한다.

상위 규칙: [`real-data-integration.md`](./real-data-integration.md) 원칙 1·2.

## 1. 계층 (필수) — API 응답은 adapter에서만 안다

```
국토부 응답(raw)                    ← adapter만 이 타입을 import
   ↓ adapt.ts (순수 변환·대표가 산정)
PriceBand (도메인 부분값, 만원)
   ↓ repository / 수집 잡
Complex.price (도메인)
   ↓
computeFit()                        ← 제공처를 모른다
```

모듈 배치:
```
src/data/adapters/molit/
  types.ts        # MolitTradeItem, MolitRentItem — raw 응답 타입(여기서만)
  parse.ts        # 응답 → raw 객체[] (thin)
  adapt.ts        # raw[] → PriceBand  (대표가 산정 규칙, 순수·테스트)
  client.ts       # 네트워크 fetch (키 게이트, 단위테스트 제외)
  sources.ts      # MolitSource[]  (complexId → lawdCd, aptName)
  __fixtures__/   # 캡처한 실제 응답 샘플(PoC 단지)
```
- `domain/`·`features/`·`hooks/`·`scoring`은 raw 타입을 **몰라야** 한다.
- 제공처 교체는 `adapt.ts`/`client.ts`만 교체. 상위 무변경.

## 2. 국토부 API 개요

- 매매: `getRTMSDataSvcAptTradeDev`, 전월세: `getRTMSDataSvcAptRent`
  (`apis.data.go.kr/1613000/...`).
- 파라미터: `serviceKey`, `LAWD_CD`(시군구 법정동 5자리), `DEAL_YMD`(YYYYMM).
- 매매 raw: `aptNm`, `dealAmount`(만원, " 80,000"), `excluUseAr`(전용㎡),
  `dealYear/Month/Day`, `umdNm`, `buildYear`.
- 전월세 raw: `deposit`(보증금 만원), `monthlyRent`(0=순수 전세), 외 동일.
- 응답 형식: 기본 XML. `parse.ts`는 raw 객체 배열만 만들고, 정규화는 `adapt.ts`가
  담당한다. (파싱 방식·라이브러리는 구현 시 확정 — 도메인엔 영향 없음.)

## 3. 단지 식별 · 주소 매핑

카탈로그 단지는 준가공이라, 실거래를 붙이려면 **실제 아파트**에 매핑해야 한다.

```ts
interface MolitSource {
  complexId: string;   // 카탈로그 id
  lawdCd: string;      // 시군구 법정동코드 5자리
  aptName: string;     // 매칭용 aptNm (정규화 비교)
}
```
- PoC는 **실제 아파트 1~2곳**을 골라 매핑(예: 특정 신도시 실단지). 나머지는 확대
  단계에서 채운다.
- 매칭: `aptNm` 정규화(공백·특수문자 제거) 후 동일/포함 비교. 실패 시 스킵·로그.

## 4. 대표가 산정 규칙 (최근 거래 기준)

한 단지의 수집 거래에서 도메인 `PriceBand`(만원)를 결정적으로 산출:
- **대상 기간**: 실행 인자 `asOfYm` 기준 **최근 6개월**(부족하면 12개월로 확장).
  `Date.now()` 직접 호출 금지 — 기준월은 인자 주입.
- **매매 `representative`**: 기간 내 거래 `dealAmount`의 **중앙값**(정렬 후, 결정성).
- **`min`/`max`**: 기간 내 최저/최고.
- **전세 `representative`/min/max**: `monthlyRent === 0`(순수 전세)의 `deposit`만
  같은 규칙. 월세 전환건 제외.
- 거래 0건 → 해당 밴드 `undefined`(그 유형 매물 없음으로 취급).
- (PoC 단순화) 전용면적/평형 가중은 하지 않는다. 확대 시 평형 필터 옵션 추가 검토.

정규화 세부(모두 `adapt.ts`):
- `dealAmount " 80,000"` → `80000`(숫자, 만원). 공백·콤마 제거, 실패값 제외.
- 이상치/음수/빈 값 방어. 도메인엔 정제된 숫자만 전달.

## 5. PoC 진행 (fixture-first, 키는 확대 때)

구조 확정이 목적이므로 **키 없이 게이트 green**을 유지하며 관통한다:

1. **adapt.ts + 테스트**: 캡처한 실제 응답 fixture → `toSalePriceBand`/
   `toJeonsePriceBand` → 기대 `PriceBand`. (중앙값·범위·월세 제외·0건 undefined)
2. **화면 표시**: PoC 단지 1~2개의 `price`를 adapter 산출값으로 교체해 상세/홈/
   비교에 실제 대표가가 뜨는지 확인. (교체 경로는 §6.)
3. **scoring 영향 검증**: 같은 단지의 mock price vs real price로 `computeFit`을
   돌려 **price 축·총점 변화**를 스냅샷/로그로 확인(결정적).
4. **live 조회**(키 확보 후): `client.ts`로 실제 `LAWD_CD`+`DEAL_YMD` 호출 →
   동일 adapter 통과 → fixture와 같은 경로임을 확인.

## 6. 화면까지 잇는 경로 (2-A 연계)

- 정석: adapter 산출 `PriceBand` → **수집 잡이 Supabase `complexes.price`에
  upsert**(2-A) → 앱은 그대로 Supabase에서 읽음. `NEXT_PUBLIC_DATA_SOURCE=supabase`.
- PoC 간이: Supabase 없이도 검증되도록, PoC 단지의 price를 adapter 출력으로
  주입하는 **경량 오버레이**(개발용)로 화면 확인 → 이후 정석 경로로 대체.
- 어느 쪽이든 **read seam·domain·scoring·UI 무변경**(원칙 2).

## 7. 환경변수 · 권한

```
MOLIT_SERVICE_KEY=...                 # data.go.kr 발급(서버 전용, NEXT_PUBLIC_ 아님)
SUPABASE_SERVICE_ROLE_KEY=...         # 수집 잡 upsert용(읽기전용 anon과 분리)
```

## 8. 테스트 · 완료 기준

- `adapt.ts` 순수 단위 테스트(대표가 산정·정규화·엣지). 이게 핵심 로직.
- `parse.ts`는 fixture로 라운드트립 확인.
- `client.ts`/수집 잡은 네트워크·쓰기라 단위테스트 제외.
- **키 없이(fixture 경로) `lint`/`typecheck`/`test`/`build` green.**

## 9. 확대 (PoC 통과 후)

1. 나머지 단지 `MolitSource` 실제 아파트 매핑.
2. 수집 잡 정식화 → Supabase upsert, 대상월 인자화, 부분 실패 격리·로그.
3. 주기 실행(수동/CI cron). 값 롤백은 재시드/재수집.
4. 이후 2-2(통근)로 이동.

## 10. 리스크 · 완화

- **아파트명 매칭 흔들림** → 정규화 매칭 + 실패 로그·스킵. PoC에서 규칙 확정.
- **거래 희소(그 달 0건)** → 기간 확장(6→12개월), 그래도 0이면 밴드 undefined.
- **응답 형식/파서** → domain에 영향 없음(adapter 내부). 구현 시 확정.
- **키·쿼터** → 서버 전용 키, 수집은 배치. 앱 런타임에서 외부 호출 없음.
