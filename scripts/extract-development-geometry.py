#!/usr/bin/env python3
# NSDI 정비구역 SHP → WGS84 polygon 추출기 (stdlib only, no GDAL/pyproj).
# **재사용 파이프라인**: 어떤 지역(경기/서울/인천/충남 …) SHP든, 구역명(ALIAS)만 주면
# 실 경계를 뽑아 TS(Location[])로 생성한다. 원본 SHP(대용량 통계 GIS)는 저장소에 넣지
# 않고, 추출 좌표 TS만 커밋한다. 절차: docs/dev/development-geometry.md
#
# 좌표계: EPSG:5174(Korean 1985 / Modified Central Belt, Bessel 1841 TM)
#   → WGS84: TM 역투영 + 3-param datum shift(기본 dx=-146.43, dy=507.89, dz=681.46).
#   면적(shoelace, EPSG:5174 미터)과 공식 면적을 대조해 검증 가능.
#
# 사용:
#   # 1) 구역명 탐색(어떤 ALIAS가 있는지)
#   python3 scripts/extract-development-geometry.py --shp <BASE> --search 종합운동장
#   # 2) 추출(정확 ALIAS = TS const 이름)
#   python3 scripts/extract-development-geometry.py --shp <BASE> --out src/data/real/geometry.foo.ts \
#       --match "종합운동장 동측 일원=EAST_RING" --area "종합운동장 동측 일원=91267"
#   # 3) 인자 없으면 안양(경기) 기본 재생성 → src/data/real/geometry.anyang.ts
import struct, math, sys, argparse

DEFAULT_BASE = "/Users/imac/Downloads/LSMD_CONT_UD602_5174_경기/LSMD_CONT_UD602_5174_41_202608"
DEFAULT_OUT = "src/data/real/geometry.anyang.ts"
DEFAULT_MATCH = {"종합운동장 동측 일원": "EAST_RING", "종합운동장 북측 일원": "NORTH_RING"}
DEFAULT_AREA = {"종합운동장 동측 일원": 91267, "종합운동장 북측 일원": 64375.3}
DATUM = (-146.43, 507.89, 681.46)


def dec(b):
    for e in ("euc-kr", "cp949"):
        try:
            return b.decode(e).strip("\x00 ").strip()
        except Exception:
            pass
    return b.decode("latin1").strip()


def read_dbf(base):
    """→ [(index, {field: value})]"""
    with open(base + ".dbf", "rb") as f:
        hdr = f.read(32)
        nrec = struct.unpack("<I", hdr[4:8])[0]
        hsize = struct.unpack("<H", hdr[8:10])[0]
        rsize = struct.unpack("<H", hdr[10:12])[0]
        fields = []
        while True:
            d = f.read(32)
            if d[0:1] == b"\x0d":
                break
            fields.append((dec(d[0:11]), d[11:12].decode(), d[16]))
        f.seek(hsize)
        out = []
        for i in range(nrec):
            rec = f.read(rsize)
            if len(rec) < rsize:
                break
            off = 1
            v = {}
            for n, t, l in fields:
                v[n] = dec(rec[off:off + l])
                off += l
            out.append((i, v))
        return out


def read_polys(base, want_idx):
    polys = {}
    with open(base + ".shp", "rb") as f:
        f.seek(100)
        idx = 0
        while True:
            rh = f.read(8)
            if len(rh) < 8:
                break
            clen = struct.unpack(">i", rh[4:8])[0] * 2
            content = f.read(clen)
            if idx in want_idx:
                nparts = struct.unpack("<i", content[36:40])[0]
                npts = struct.unpack("<i", content[40:44])[0]
                parts = list(struct.unpack("<%di" % nparts, content[44:44 + 4 * nparts])) + [npts]
                pbase = 44 + 4 * nparts
                pts = [struct.unpack("<dd", content[pbase + 16 * k:pbase + 16 * k + 16]) for k in range(npts)]
                polys[idx] = [pts[parts[j]:parts[j + 1]] for j in range(nparts)]
            idx += 1
    return polys


# ── EPSG:5174 TM inverse (Bessel 1841, Korean 1985) ──
a, f = 6377397.155, 1 / 299.1528128
e2 = f * (2 - f)
lat0, lon0 = math.radians(38.0), math.radians(127.0028902777778)
k0, FE, FN = 1.0, 200000.0, 500000.0
def _M(phi):
    return a * ((1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256) * phi
        - (3 * e2 / 8 + 3 * e2**2 / 32 + 45 * e2**3 / 1024) * math.sin(2 * phi)
        + (15 * e2**2 / 256 + 45 * e2**3 / 1024) * math.sin(4 * phi)
        - (35 * e2**3 / 3072) * math.sin(6 * phi))
M0 = _M(lat0)
e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
def tm_inv(E, N):
    mu = (M0 + (N - FN) / k0) / (a * (1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256))
    phi1 = (mu + (3 * e1 / 2 - 27 * e1**3 / 32) * math.sin(2 * mu) + (21 * e1**2 / 16 - 55 * e1**4 / 32) * math.sin(4 * mu)
        + (151 * e1**3 / 96) * math.sin(6 * mu) + (1097 * e1**4 / 512) * math.sin(8 * mu))
    ep2 = e2 / (1 - e2); C1 = ep2 * math.cos(phi1)**2; T1 = math.tan(phi1)**2
    N1 = a / math.sqrt(1 - e2 * math.sin(phi1)**2); R1 = a * (1 - e2) / (1 - e2 * math.sin(phi1)**2)**1.5
    D = (E - FE) / (N1 * k0)
    lat = phi1 - (N1 * math.tan(phi1) / R1) * (D**2 / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1**2 - 9 * ep2) * D**4 / 24
        + (61 + 90 * T1 + 298 * C1 + 45 * T1**2 - 252 * ep2 - 3 * C1**2) * D**6 / 720)
    lon = lon0 + (D - (1 + 2 * T1 + C1) * D**3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1**2 + 8 * ep2 + 24 * T1**2) * D**5 / 120) / math.cos(phi1)
    return lat, lon
aB, fB = 6377397.155, 1 / 299.1528128
aW, fW = 6378137.0, 1 / 298.257223563
def _g2e(lat, lon, a, f):
    e2 = f * (2 - f); N = a / math.sqrt(1 - e2 * math.sin(lat)**2)
    return (N * math.cos(lat) * math.cos(lon), N * math.cos(lat) * math.sin(lon), N * (1 - e2) * math.sin(lat))
def _e2g(X, Y, Z, a, f):
    e2 = f * (2 - f); lon = math.atan2(Y, X); p = math.hypot(X, Y); lat = math.atan2(Z, p * (1 - e2))
    for _ in range(6):
        N = a / math.sqrt(1 - e2 * math.sin(lat)**2); lat = math.atan2(Z + e2 * N * math.sin(lat), p)
    return math.degrees(lat), math.degrees(lon)
def to_wgs(E, N):
    la, lo = tm_inv(E, N); X, Y, Z = _g2e(la, lo, aB, fB)
    return _e2g(X + DATUM[0], Y + DATUM[1], Z + DATUM[2], aW, fW)
def poly_area(pts):
    return abs(sum(pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1] for i in range(len(pts) - 1))) / 2


def main():
    ap = argparse.ArgumentParser(description="NSDI 정비구역 SHP → WGS84 polygon (재사용)")
    ap.add_argument("--shp", default=DEFAULT_BASE, help="SHP basename(확장자 제외)")
    ap.add_argument("--search", help="ALIAS/REMARK에 이 키워드 포함 레코드 나열(추출 안 함)")
    ap.add_argument("--match", action="append", default=[], help='"ALIAS정확값=CONST" (반복). 미지정 시 안양 기본')
    ap.add_argument("--area", action="append", default=[], help='"ALIAS=공식면적㎡" (검증용, 선택)')
    ap.add_argument("--out", default=None, help="출력 TS 경로")
    args = ap.parse_args()
    recs = read_dbf(args.shp)

    if args.search:
        hits = [(i, v) for i, v in recs if args.search in (v.get("ALIAS", "") + " " + v.get("REMARK", ""))]
        print(f"'{args.search}' 매칭 {len(hits)}건:")
        for i, v in hits[:60]:
            print(f"  #{i} ADM={v.get('COL_ADM_SE')} ALIAS={v.get('ALIAS')!r} REMARK={v.get('REMARK')!r}")
        return

    match = dict(m.split("=", 1) for m in args.match) if args.match else DEFAULT_MATCH
    areas = dict((k, float(v)) for k, v in (m.split("=", 1) for m in args.area)) if args.area else (DEFAULT_AREA if not args.match else {})
    out = args.out or (DEFAULT_OUT if not args.match else None)
    if not out:
        sys.exit("--out 필요")
    alias_to_idx = {v.get("ALIAS", ""): i for i, v in recs}
    want = {}
    for alias, const in match.items():
        if alias not in alias_to_idx:
            print(f"경고: ALIAS 미발견 {alias!r}")
            continue
        want[alias_to_idx[alias]] = (alias, const)
    polys = read_polys(args.shp, set(want))
    lines = ['// AUTO-GENERATED by scripts/extract-development-geometry.py — 편집 금지.',
             '// NSDI 정비구역 SHP → WGS84(EPSG:5174→4326). 공식 GIS 경계.',
             'import type { Location } from "@/domain/types";', '']
    for idx, (alias, const) in want.items():
        rings = polys.get(idx)
        if not rings:
            continue
        ring = max(rings, key=poly_area)  # 최대 면적 파트를 외곽으로
        ar = poly_area(ring)
        chk = f" official={areas[alias]} ratio={ar/areas[alias]:.3f}" if alias in areas else ""
        print(f"{const}({alias}): area={ar:.0f}㎡{chk} pts={len(ring)}")
        ll = [(round(la, 6), round(lo, 6)) for (E, N) in ring for (la, lo) in [to_wgs(E, N)]]
        body = ", ".join("{lat:%s,lng:%s}" % (la, lo) for la, lo in ll)
        lines.append(f"export const {const}: Location[] = [{body}];")
    open(out, "w").write("\n".join(lines) + "\n")
    print("wrote", out)


if __name__ == "__main__":
    main()
