# Coordinate Data Plan

> 상태: **설계(design-only)**. Decision Map 구현 전, Home/Presale/Area 좌표 확보 전략.
> [`decision-map.md`](decision-map.md) §6·§11 전제. **지도 렌더마다 geocoding 호출 금지** —
> 주소/공공데이터 → 좌표 확보 → normalize → repository 저장 → domain `Location` → 지도.

## 0. 현황 (코드 근거)
- 좌표 보유: **`Workplace.lat/lng`만**(WorkArea 기반). `Home`·`Area`·`Region`은 **좌표 없음**.
- 이미 있는 자산: `src/data/adapters/applyhome/commute.ts`의 **`SIGUNGU_CENTROIDS`**
  (경기 ~25개 시군구 시청 근사 좌표) + `sigunguCentroid(address)`. 통근추정이 "주소 →
  시군구 centroid → 직선거리 근사"로 이미 동작(대중교통 실경로 아님, 고지됨).
- 데이터 적재: `scripts/ingest-supabase.ts`가 data.go.kr(MOLIT AptList/AptBasisInfoV5/
  실거래가)로 단지를 수집해 Supabase에 저장(snake_case row). presale은 청약홈 어댑터.
- 결론: **region/area centroid 좌표원은 이미 존재**(SIGUNGU_CENTROIDS 확장). 부족한 것은
  **건물 단위(단지) 좌표**뿐 → 여기에 geocoding이 필요.

## 1. Location 타입 & 저장 위치
- domain 순수 값타입(§ decision-map §11):
  ```ts
  export interface Location { lat: number; lng: number } // WGS84(EPSG:4326)
  ```
- `Home`(Existing/Presale)·`Area`에 **additive `location?: Location`**. SDK/geocoding
  metadata는 **넣지 않음**(provider/accuracy/geocodedAt/sourceAddress는 data 계층 별도).
- 저장: repository row에 `lat`,`lng`(+ data 계층 `geo_meta`). 앱은 domain `Location`만 소비.

## 2. entity별 좌표 소스 (우선순위: Existing → Presale → Area → Region)

### 2.1 ExistingHome (건물 단위, geocoding 필수) — MOLIT 검증 완료(2026-09-11)
- **확정: MOLIT 공동주택 기본정보(getAphusBassInfoV5)는 위경도 좌표를 제공하지 않는다.**
  응답 필드에 lat/lng/x/y 없음. 단, `kaptCode`(안정 키)·`kaptName`·`kaptAddr`(지번)·
  `doroJuso`(도로명)는 제공. → **주소 → 좌표 geocoding이 필수**(선택 아님).
  (data.go.kr 15058453, 확인일 2026-09-11)
- 매칭 키 = **`kaptCode`**(kaptName은 중복·명칭이력 위험 → fallback만).
- 절차: `doroJuso`(우선)/`kaptAddr` → geocoding(§3) → 저장. fallback: 실패 시 **시군구
  centroid**(SIGUNGU_CENTROIDS) + accuracy="region".
- 저장 허용: MOLIT 데이터셋 "이용허락범위 제한 없음"(저장/캐시/재배포/상업이용 OK, 출처표시는
  공공누리 유형 준수).

### 2.2 PresaleHome (청약홈, geocoding 필요)
- 청약홈 공고 주소를 ingest 시 geocoding(§3). fallback = 시군구 centroid(이미 통근에 사용).
- 입주 전이라 도로명주소가 대략적일 수 있음 → accuracy 라벨 필수.

### 2.3 Area representative location (MVP: centroid로 충분)
- **polygon 없이 representative location/centroid**면 충분(사용자 결정 #3,#5).
- 소스: Area.regionId → 해당 시군구 **SIGUNGU_CENTROIDS**(서울·인천까지 확장). 신도시(교산·
  왕숙 등)는 알려진 대표 좌표를 상수로 소량 큐레이션.

### 2.4 Region (좌표 강제 안 함)
- RegionRef에 centroid/polygon **강제하지 않음**(결정 #6). 필요 시 SIGUNGU_CENTROIDS로 파생.
  polygon overlay는 실제 행정/생활권 데이터 확보 후(후속).

## 3. 주소 → 좌표 geocoding (필요 시점·방식)
- **필요**: MOLIT가 좌표를 안 주므로 건물 단위 좌표(Existing/Presale)는 **항상 geocoding**.
- **⚠️ provider 선택 제약(중요)**: 좌표를 **자체 DB에 영구 저장**하므로, **저장이 약관상
  허용되는 소스만** 쓴다. **Kakao Local·Naver geocoding은 저장용으로 쓰지 않는다** — Kakao
  운영정책 제5조(받은 데이터 캐싱/재배포 제한)와 충돌 소지(2026-09-11 확인).
  - **1순위: juso.go.kr(행안부) 좌표제공 API** — 공식·무료·**저장 허용**·도로명주소 정합성
    최상. 좌표계 **EPSG:5179(UTM-K)** → **WGS84 변환 1스텝**(data 계층).
  - 보조: **VWorld(국토부) geocoder** — 저장 조건 확인 후.
- **저장≠렌더**: 지도 render는 Kakao여도, 저장 좌표는 juso로 확보 → provider 분리(§8).
- **시점**: **ingest(수집) 시 1회**. 렌더 시 호출 절대 금지.

## 4. 수집·저장 파이프라인
```text
공공데이터(MOLIT/청약홈) 주소
  → (좌표 있으면 그대로 / 없으면 geocoding)
  → normalize(WGS84 lat/lng, 소수 6자리)
  → repository row(lat,lng + geo_meta{provider,accuracy,geocodedAt,sourceAddress})
  → domain Home.location? / Area.location?
  → Decision Map(view-model 조립)
```
- geo_meta는 data 계층에만. domain엔 `Location`만 노출.

## 5. mock → real 전환
- **mock 좌표 부여(테스트용)**: mock 10개 단지 + presale + Area에 **실제 지역과 크게
  어긋나지 않는 좌표**를 큐레이션(단지 실주소 기준 대략 좌표 또는 시군구 centroid + 소량
  offset). 지도 UX/카드↔지도 sync를 실 ingest 없이 검증 가능하게.
- `mock.ts` repository가 `location`을 채우고, `supabase.ts` repository는 DB `lat/lng`를 매핑.
  둘 다 동일 `Home.location?` 계약 → **UI/지도 코드는 소스 무관**(기존 repository 추상화 준수).
- ingest 스크립트에 좌표 컬럼 추가는 **additive**(기존 row에 lat/lng null 허용).

## 6. geocoding 실패 처리 (숨기지 않음)
- 단계적 강등: 건물좌표 실패 → 시군구 centroid(accuracy="sigungu") → 그래도 없으면
  `location` 미부여 → 지도에서 **degraded**(marker 대신 리스트/센트로이드, "위치 근사/미상"
  라벨). decision-map §12와 일치.

## 7. 중복 호출 방지 / cache
- geocoding은 ingest 배치에서만. **normalized 주소 key로 dedupe** + 이미 좌표 있는 row는
  skip. 결과를 DB에 영속 → 재적재 시 재호출 안 함.
- rate limit 대비 delay(기존 ingest의 120ms 패턴 재사용).

## 8. Map provider ↔ Coordinate source 분리 가능성 (중요)
- **분리 가능**하고 **분리 권장**. 좌표를 **WGS84 lat/lng로 normalize·저장**하면 렌더
  provider(예: Naver/Kakao 지도)는 저장된 lat/lng만 소비 → geocoding provider와 무관.
- 이점: geocoding은 **juso(무료·정합성)**로, 지도 렌더는 별도 최적 provider로 조합 가능.
- 유일한 결합점: **좌표계 정규화**(juso EPSG:5179 → WGS84). 이 변환만 data 계층에서 처리하면
  이후는 완전 분리. (Kakao/Naver JS SDK 모두 WGS84 lat/lng 입력 지원 — provider 문서에서 확인.)

## 9. 좌표 정확도 검증
- accuracy 등급: `rooftop/parcel`(건물·지번) > `road`(도로명) > `sigungu`(centroid) > 없음.
- sanity: 수도권 bounding box(위 37.2~37.9, 경 126.6~127.6 근사) 밖이면 reject → fallback.
- 스팟체크: 대표 단지 몇 개를 지도에 찍어 육안 검증(수집 QA).

## 10. provider 변경 가능성
- geocoding provider 교체는 **data 계층 어댑터 교체**로 국한(저장 결과는 동일 WGS84).
- 렌더 provider 교체는 **MapAdapter 교체**(decision-map §11)로 국한. 도메인·저장 스키마 불변.

## 11. 테스트 전략
- **순수·결정적 우선**: 좌표계 변환(5179→WGS84), sigungu fallback 선택, accuracy 등급,
  bounding-box 검증, dedupe key normalize — 전부 단위 테스트(네트워크 없음).
- geocoding client는 **모킹**(고정 응답). ingest 실호출은 테스트 대상 아님.
- repository 계약 테스트: mock/supabase 둘 다 `Home.location?` 동일 형태 반환.

## 12. 미결정 (구현 전 확인)
1. ✅**해결**: MOLIT는 좌표 미제공 → geocoding 필수(§2.1). kaptCode가 매칭 키.
2. ✅**방향 확정**: 저장용 geocoding은 **juso.go.kr**(무료·저장허용·5179→WGS84). Kakao/Naver
   geocoding은 저장 제약으로 제외. (juso 좌표계 EPSG·이용약관 세부는 사용 직전 재확인)
3. mock 좌표 큐레이션 범위/정확도(§5) — 실존 단지는 실좌표, 미검증은 region-level로 정직 표기.
4. juso 좌표 API **활용신청/키**(정부 API) 발급 — 실제 ingest 전 선행.
