# Map Provider 비교 (Kakao · Naver · Google · Mapbox)

> 상태: **비교/추천(설계)**. provider **미확정**, **SDK 미설치**. [`decision-map.md`](decision-map.md)·
> [`coordinate-data-plan.md`](coordinate-data-plan.md) 전제. 조사 기준 **2026-09**, 전부
> **공식 문서 기준**(개별 URL은 아래 각 provider 절). 변동성 큰 값(가격·쿼터·약관)은
> **확인 불가/추측 금지** 원칙에 따라 명시했고, **출시 전 콘솔에서 재확인 필요**.

## 0. 판단 프레임
Homefit에 지도는 **spatial explanation layer**(Decision View가 primary). 핵심 필요:
① **한국 아파트/도로명주소 geocoding**(좌표 확보의 근간) ② custom marker/click/fitBounds/
viewport 이벤트 ③ 모바일 웹 ④ 합리적 무료 쿼터·상업 이용 가능 ⑤ SDK 타입 격리.
**중요**: geocoding(주소→좌표)과 지도 render는 **분리 가능**(coordinate-data-plan §8) →
두 역할을 다른 provider로 조합할 수 있다.

## 1. 비교표 (요약)

| 기준 | **Kakao** | **Naver(NCP)** | Google | Mapbox |
|---|---|---|---|---|
| 한국 주소 geocoding | ★도로명+지번 지원, WGS84 직접 | ★도로명+지번(자사 DB) | △ 가능하나 정밀 내비 레이어 규제, 도로명 전용 정확도 공식근거 부족 | ✕ **주소(건물)레벨 미지원**(공식 커버리지 표) |
| JS 웹 SDK / React·Next | script 로드, `kakao.maps.load` 콜백, SSR은 client-only | v3 script, `ncpKeyId`, SSR client-only | `@vis.gl/react-google-maps`(공식후원) | `react-map-gl`(GL JS) |
| custom marker(HTML) | ✓ CustomOverlay | ✓ Marker/Overlay | ✓ AdvancedMarker | ✓ Marker |
| marker click | ✓ | ✓ `click` | ✓ onClick | ✓ onClick |
| fitBounds | ✓ `setBounds`+LatLngBounds | ✓ `fitBounds()` | ✓ (native `fitBounds`) | ✓ (native) |
| viewport 이벤트 | ✓ `bounds_changed` | ✓ `idle`/`bounds_changed` | ✓ `idle`/`bounds_changed` | ✓ `moveend` |
| polygon/overlay | ✓ (drawShape 샘플) | ✓ (Polygon/drawing) | △ native 직접 | ★ GeoJSON layer(강점) |
| directions(경로) | Kakao Mobility(제휴 필요) | Directions 5/15(차량, 유료) | ✕ **한국 미제공**(반출규제, 2026-02 조건부승인·롤아웃 전) | ✓ (한국 정합성 별개) |
| 무료 쿼터 | ★관대(웹지도 30만/일·geocoding 10만/일·월 300만) | 레거시 10M loads·geocoding 3M/월(**신제품 수치 확인불가**) | SKU당 월 10k | 지도 5만/월, geocoding temp 10만/월 |
| 초과 단가 | geocoding 0.5원·웹지도 0.1원/건(2026 한시 80%할인) | 웹지도 0.1원/건(레거시)·**신제품 확인불가** | Dynamic Maps $7/1k·Geocoding $5/1k | 지도 $5/1k·**permanent geocoding $5/1k(무료없음)** |
| 상업 이용/약관 | 허용 "명문" 미확인(금지도 아님) | 허용, billing 계정 필요 | 허용, billing 필요 | 허용, **부동산 앱 별도 상업 라이선스 요구** |
| 키/보안 | JS키(도메인 화이트리스트)+REST키(서버전용) | client `ncpKeyId`(도메인)+APIGW키(서버) | API키+billing | 토큰 |
| Vercel/Next | script client-load, 프리뷰 도메인 등록 | 프리뷰 도메인 allowlist 마찰 | client 경계 필요 | dynamic ssr:false |
| 국외/리스크 | 국내 | 국내 | 국외+규제 | 국외+KR geocoding 결함 |

(★강점 · ✓지원 · △부분/주의 · ✕부적합)

## 2. Provider별 핵심

### Kakao Maps (최종 검증 2026-09-11)
- **ToS BLOCKER 없음**: 상업/부동산 사용을 금지하는 조항 없음. 운영정책 제3조 이용제한
  업종은 **게임/게임관련/가상자산 3종뿐**(부동산 없음). 상업 이용 명문은 침묵이나 유료 과금이
  상업 사용 전제. (developers.kakao.com/terms/ko/site-policies, 2026-09-11)
- **⚠️ 핵심 제약 — geocoding 결과 영구저장 미허가**: 운영정책 **제5조 20호**(카카오에서 받은
  데이터의 목적 외 캐싱 금지) + **제5조 30호**(얻은 정보 복제·변경·제3자 제공 금지)로,
  **Kakao Local geocoding 좌표를 자체 DB에 영구 저장하는 ingest-and-store는 충돌 소지.**
  → **결론: 지도 render는 Kakao, geocoding-저장은 비-Kakao(juso/VWorld)로 분리**(coordinate
  -data §3,§8). (site-policies 제5조, 2026-09-11)
- **지도(render)**: web SDK 무료 **30만/일**(0.1원/건 초과). CustomOverlay·마커클릭·setBounds·
  bounds_changed·Polygon(Drawing) 공식 지원. 길찾기는 JS SDK에 없음(카카오모빌리티 별도,
  자동차 무료 1만/일 — **강제 제휴 아님**, 우리 MVP는 route 미사용).
- **쿼터/과금**: 무료 쿼터는 **개발자 계정의 "첫 활성화 앱 1개"에만**. 월 통합 300만.
  ~~2026 80% 할인~~ → **정정: 그 할인은 카카오톡 공유(메시지) 대상이고 카카오맵 아님.**
- **키/도메인**: REST키는 클라→서버/서버→서버 공식 허용(서버 IP 등록 권장; 강경 "서버전용"은
  **어드민 키** 한정). JS키 도메인 **최대 10개**, 와일드카드는 **단일 레벨+비즈앱 전용**
  (`*.sample.com` O, `*.*`·`sub.*` X). **Vercel 프리뷰(동적 URL) 포괄 어려움** → 고정
  branch-alias 도메인 사용 또는 프리뷰에선 지도 비활성 권장(공식 Vercel 지침은 확인 불가).
- 출처: developers.kakao.com/(terms/ko/site-policies · docs/ko/getting-started/quota ·
  docs/ko/app-setting/app), apis.map.kakao.com/web/. 확인일 2026-09-11.

### Naver Maps (NCP)
- **geocoding**: 자사 주소 DB, road+lot, addressElements 풍부, endpoint
  `maps.apigw.ntruss.com/map-geocode/v2/geocode`.
- **지도 v3**: `idle`·`bounds_changed`·`zoom_changed`·`dragend`·`click`, `fitBounds()`/
  `getBounds()`, Polygon/Polyline/drawing. 이벤트·메서드 공식 문서 확인(우리 요구 정확 충족).
- **보안**: client `ncpKeyId`(도메인 referrer 제한, 최대 10 URL) + REST는 APIGW 키/시크릿
  (서버 전용). **`ncpClientId`→`ncpKeyId` 마이그레이션**(구예제 인증 실패 주의).
- **⚠️ 가격 불확실(핵심)**: 2025 개편 — **레거시(AI·NAVER API) 무료 지도 종료 + 신규 "Maps"
  상품 출시**(공지 #1930/#1965). 레거시 수치(웹지도 10M/월 무료·0.1원, geocoding 3M/월)는
  신제품 존속 여부 **확인 불가**. **콘솔에서 현행 단가 재확인 필수.**
- **Vercel**: 프리뷰 도메인 동적 → allowlist 마찰(안정 커스텀 도메인/와일드카드 권장).
- 출처: navermaps.github.io/maps.js.ncp, api.ncloud-docs.com/docs/en/application-maps-*,
  ncloud.com/support/notice/1930·1965·faq/2828.

### Google Maps Platform (2차)
- **한국 규제 결정타**: 지도데이터 반출 규제로 **Directions(경로/통근) 한국 미제공**
  (2026-02-27 조건부 승인, 정식 롤아웃 전). geocoding/타일/핀은 가능하나 국외 provider.
- **가격(2025-03 개편)**: $200 크레딧 폐지 → **SKU당 월 10k 무료**, Dynamic Maps $7/1k,
  Geocoding $5/1k. billing 필수.
- `@vis.gl/react-google-maps`(공식 후원, TS 지원). 폴리곤은 native 직접.
- 출처: developers.google.com/maps/billing-and-pricing/(march-2025·pricing),
  mapsplatform.google.com/pricing, visgl.github.io/react-google-maps. (Korea 규제: 위키·언론.)

### Mapbox (2차)
- **부적합 사유 2가지**: ① 공식 커버리지 표상 **한국 Address(건물)·District geocoding 미지원**
  (동/우편번호/지역명까지만) → 단지 주소→좌표 핵심 기능 불가. ② ToS상 **부동산(real estate)
  앱은 별도 상업 라이선스** 요구 → Homefit 직접 해당 가능.
- 강점: GeoJSON 폴리곤/오버레이(학군·경계), WebGL 벡터맵. **좌표 DB 저장은 permanent
  geocoding($5/1k, 무료 없음)**.
- 출처: docs.mapbox.com/help/dive-deeper/mapbox-data, www.mapbox.com/pricing·legal/tos,
  visgl.github.io/react-map-gl.

## 3. Homefit 추천

**1순위 — 지도 render: Kakao Maps · geocoding+저장: juso.go.kr(또는 VWorld)**
- **분리가 선택이 아니라 필수**: Kakao ToS(제5조 20호/30호)상 Kakao geocoding 좌표의 영구저장이
  제약되므로, **저장 대상 좌표는 저장이 허용된 공공 소스(juso.go.kr 좌표 API / VWorld)로 확보**
  하고 지도 render만 Kakao로 한다.
- Kakao render 근거: 한국 지도·마커/이벤트/폴리곤 공식 지원, 무료 쿼터 관대(web 30만/일),
  **상업/부동산 BLOCKER 없음**, 국내 provider. 자동차 route는 MVP 통근 사전계산으로 불필요.
- juso geocoding 근거: 공식·무료·**저장/재배포 허용**(도로명주소 정합성 최상). 유일 결합점은
  좌표계 변환(EPSG:5179→WGS84) — data 계층 1스텝(coordinate-data §8).

**2순위 — 지도 render: Naver(NCP) · geocoding+저장: juso/VWorld**
- Naver v3 SDK 이벤트/메서드 품질 우수(`idle`/`fitBounds`). 다만 **2025 가격 개편 현행 수치
  미확인**이라 비용 리스크로 1순위 아님. geocoding은 동일하게 저장허용 공공소스로 분리.
- ※ **Kakao Local·Naver geocoding을 "저장용"으로 쓰지 않는다** — 저장 제약 회피 목적.

**비권장(주력)**: Google(한국 route 규제·국외), Mapbox(한국 주소 geocoding 결함·부동산
라이선스). 단 Mapbox는 폴리곤/오버레이 강점이 있어 **후속 GIS 레이어 실험용**으로만 여지.

## 4. 비용/쿼터 주의점
- **Kakao**: 무료 쿼터가 크지만 **무료는 개발자 계정의 "첫 활성화 앱"에만** — 앱 분리 주의.
  월 통합 300만 상한. 2026-12-31 이후 할인 종료.
- **Naver**: **현행 신제품 단가·무료량 확인 불가** → 콘솔 계산기로 검증 전 비용 가정 금지.
  대표계정에만 레거시 무료. 프리뷰 도메인 allowlist.
- **Google**: SKU당 월 10k 무료는 소량. geocoding $5/1k → 대량 단지 지오코딩 시 비용.
  단 우리는 **ingest 시 1회 배치 + 캐시**라 총량 작음(coordinate-data §7).
- **Mapbox**: 좌표 저장=permanent geocoding(무료 없음).
- 공통: **geocoding은 render마다 호출 금지, ingest 1회 + 저장**(coordinate-data)이면 어느
  provider든 geocoding 비용은 소액.

## 5. 출시 전 반드시 재확인 (확인 불가 항목)
1. **Naver 신규 Maps 상품 현행 단가/무료량**(콘솔) — 미확인.
2. **Kakao 상업 이용 약관 명문** — 미확인(금지 문구 없음).
3. Google 한국 Directions 정식 가동 시점(우리 MVP엔 불필요).
4. 각 provider **한국 주소 geocoding 실측 정확도**(대표 단지 20개 스팟체크).
5. Kakao geocoding 권한(과거 OPEN_MAP_AND_LOCAL 비활성 이력) 재확인.

## 6. 결론(설계 판단)
- **geocoding·render 분리 구조**(adapter, coordinate-data §8)를 채택하면 provider 락인 최소화.
- **MVP 기본안: Kakao 단일**(render+geocoding). Naver는 render 대안, juso는 geocoding 대안으로
  adapter 교체만으로 전환 가능하게 설계.
- provider **확정·SDK 설치는 위 §5 재확인 이후** 진행.
