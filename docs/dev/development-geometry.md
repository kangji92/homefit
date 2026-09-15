# 정비구역 실 경계(official_boundary) 추가 파이프라인

어떤 지역이든 **NSDI 정비구역 SHP + 구역명**만 있으면 실 경계 polygon을 뽑아
`DevelopmentArea`에 붙일 수 있다. 안양 종합운동장 동측/북측이 이 방식으로 official_boundary.

## 원리
- 소스: **NSDI 도시정비 정비구역 레이어 `LSMD_CONT_UD602`**(시도별 SHP, 좌표계 **EPSG:5174**
  = Korean 1985 / 중부원점, Bessel TM).
- 변환: `scripts/extract-development-geometry.py`가 **TM 역투영 + 3-param datum shift**
  (dx=-146.43, dy=507.89, dz=681.46)로 **WGS84**(EPSG:4326)로 변환. GDAL/pyproj 불필요(stdlib).
- 검증: SHP 면적(EPSG:5174 미터, shoelace)과 공식 면적을 대조 → **ratio≈1.000이면 올바른
  피처·좌표**.

## 원본 SHP는 저장소에 넣지 않는다
전국/광역 통계 GIS 바이너리(수백 KB~수 MB)라 커밋하지 않는다. **추출된 좌표 TS만** 커밋
(`src/data/real/geometry.*.ts`). 다운로드: NSDI 오픈마켓/공공데이터에서 `LSMD_CONT_UD602`
해당 시도 SHP(예: `_41`=경기, `_11`=서울, `_28`=인천, `_44`=충남).

## 절차
```bash
BASE=/path/to/LSMD_CONT_UD602_5174_41_202608   # 확장자 제외

# 1) 구역명 탐색(ALIAS 확인 — 무명 피처는 지번코드만이라 이름검색 불가)
python3 scripts/extract-development-geometry.py --shp "$BASE" --search 종합운동장

# 2) 추출: "정확 ALIAS=TS const" (+ 선택: 면적 검증)
python3 scripts/extract-development-geometry.py --shp "$BASE" \
  --out src/data/real/geometry.anyang.ts \
  --match "종합운동장 동측 일원=EAST_RING" --area "종합운동장 동측 일원=91267" \
  --match "종합운동장 북측 일원=NORTH_RING" --area "종합운동장 북측 일원=64375.3"
# (인자 없이 실행하면 안양 기본값으로 geometry.anyang.ts 재생성)
```

## DevelopmentArea에 연결
```ts
import { EAST_RING } from "./geometry.anyang";
geometry: { kind: "polygon", rings: [EAST_RING] },
geometryAccuracy: "official_boundary",
```
KakaoMapAdapter가 폴리곤을 마커 아래 layer로 렌더한다.

## 공식 사업단계(공공데이터 CSV) 병행
경계(SHP)는 위치·구역명만 준다. **사업단계·세대·인가일자**는 공공데이터포털
"경기도 안양시_일반 정비사업 추진현황" CSV(공식)가 출처다.
- 원본 CSV는 `src/data/real/sources/`에 UTF-8로 커밋(소량·공개).
- `scripts/generate-anyang-developments.py`가 CSV → `developments.anyang.csv.ts`(DevelopmentArea[])
  생성. 사업단계→stage/detailStage 매핑, 인가일자→official milestone, 세대→official plan.
  경계는 SHP 확보 6곳만 official_boundary, 나머지는 CSV 위/경도 point(centroid_only).
- 무명(ALIAS 빈) 피처는 추출기 `--match-index "레코드인덱스=CONST"`로 지정(‌--search로 인덱스 확인).

## 주의(현재 한계)
- **multipart/holes**: 여러 파트면 **최대 면적 파트를 외곽**으로 사용(존치부 hole 미모델).
  어댑터도 `rings[0]`만 렌더.
- **무명 피처**: ALIAS가 빈 레코드(지번코드만)는 이름으로 못 찾음 → 지번/인덱스로 지정 필요.
- **정밀도**: datum 3-param 변환 ~1–3m(표시용 충분). 더 정밀하면 7-param/공식 grid 필요.
- provenance: 위 절차로 얻은 좌표는 `geometryAccuracy: "official_boundary"`(공식 GIS 소스).
