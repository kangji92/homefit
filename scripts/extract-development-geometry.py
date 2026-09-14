#!/usr/bin/env python3
# NSDI 정비구역 SHP → WGS84 polygon 추출기 (stdlib only, no GDAL/pyproj).
# src/data/real/geometry.anyang.ts 를 재생성한다. 원본 SHP(전국/광역 통계 GIS 대용량 바이너리)는
# 저장소에 넣지 않고, 추출된 좌표(TS)만 커밋한다.
#
# 사용:
#   python3 scripts/extract-development-geometry.py <SHP_BASE_PATH>
#   (SHP_BASE_PATH = 확장자 없는 경로. .shp/.dbf/.prj 동일 basename)
# 기본값은 경기 UD602(안양). 대상 피처는 DBF ALIAS로 매칭.
#
# 좌표계: EPSG:5174(Korean 1985 / Modified Central Belt, Bessel 1841 TM)
#   → WGS84: TM 역투영 + 3-param datum shift(dx=-146.43, dy=507.89, dz=681.46).
#   면적(shoelace, EPSG:5174 미터)으로 공식 면적과 교차검증한다.

import struct, math, sys

DEFAULT_BASE = "/Users/imac/Downloads/LSMD_CONT_UD602_5174_경기/LSMD_CONT_UD602_5174_41_202608"
# DBF ALIAS 값 → (const 이름, 검증용 공식 면적 ㎡)
TARGETS = {"종합운동장 동측 일원": ("EAST_RING", 91267), "종합운동장 북측 일원": ("NORTH_RING", 64375.3)}
OUT = "src/data/real/geometry.anyang.ts"
DATUM = (-146.43, 507.89, 681.46)

def dec(b):
    for e in ("euc-kr", "cp949"):
        try: return b.decode(e).strip("\x00 ").strip()
        except Exception: pass
    return b.decode("latin1").strip()

def read_dbf_aliases(base):
    with open(base + ".dbf", "rb") as f:
        hdr = f.read(32); nrec = struct.unpack("<I", hdr[4:8])[0]
        hsize = struct.unpack("<H", hdr[8:10])[0]; rsize = struct.unpack("<H", hdr[10:12])[0]
        fields = []
        while True:
            d = f.read(32)
            if d[0:1] == b"\x0d": break
            fields.append((dec(d[0:11]), d[11:12].decode(), d[16]))
        f.seek(hsize); aliases = {}
        for i in range(nrec):
            rec = f.read(rsize)
            if len(rec) < rsize: break
            off = 1; v = {}
            for n, t, l in fields: v[n] = dec(rec[off:off + l]); off += l
            aliases[i] = v.get("ALIAS", "")
    return aliases

def read_polys(base, want_idx):
    polys = {}
    with open(base + ".shp", "rb") as f:
        f.seek(100); idx = 0
        while True:
            rh = f.read(8)
            if len(rh) < 8: break
            clen = struct.unpack(">i", rh[4:8])[0] * 2
            content = f.read(clen)
            if idx in want_idx:
                nparts = struct.unpack("<i", content[36:40])[0]; npts = struct.unpack("<i", content[40:44])[0]
                parts = list(struct.unpack("<%di" % nparts, content[44:44 + 4 * nparts])) + [npts]
                pbase = 44 + 4 * nparts
                pts = [struct.unpack("<dd", content[pbase + 16 * k:pbase + 16 * k + 16]) for k in range(npts)]
                polys[idx] = [pts[parts[j]:parts[j + 1]] for j in range(nparts)]
            idx += 1
    return polys

# EPSG:5174 TM inverse
a, f = 6377397.155, 1 / 299.1528128; e2 = f * (2 - f)
lat0 = math.radians(38.0); lon0 = math.radians(127.0028902777778); k0 = 1.0; FE = 200000.0; FN = 500000.0
def M(phi):
    return a * ((1 - e2 / 4 - 3 * e2**2 / 64 - 5 * e2**3 / 256) * phi
        - (3 * e2 / 8 + 3 * e2**2 / 32 + 45 * e2**3 / 1024) * math.sin(2 * phi)
        + (15 * e2**2 / 256 + 45 * e2**3 / 1024) * math.sin(4 * phi)
        - (35 * e2**3 / 3072) * math.sin(6 * phi))
M0 = M(lat0); e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
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
# datum shift Bessel(Korean1985) -> WGS84
aB, fB = 6377397.155, 1 / 299.1528128; aW, fW = 6378137.0, 1 / 298.257223563
def g2e(lat, lon, a, f):
    e2 = f * (2 - f); N = a / math.sqrt(1 - e2 * math.sin(lat)**2)
    return (N * math.cos(lat) * math.cos(lon), N * math.cos(lat) * math.sin(lon), N * (1 - e2) * math.sin(lat))
def e2g(X, Y, Z, a, f):
    e2 = f * (2 - f); lon = math.atan2(Y, X); p = math.hypot(X, Y); lat = math.atan2(Z, p * (1 - e2))
    for _ in range(6):
        N = a / math.sqrt(1 - e2 * math.sin(lat)**2); lat = math.atan2(Z + e2 * N * math.sin(lat), p)
    return math.degrees(lat), math.degrees(lon)
def to_wgs(E, N):
    la, lo = tm_inv(E, N); X, Y, Z = g2e(la, lo, aB, fB)
    return e2g(X + DATUM[0], Y + DATUM[1], Z + DATUM[2], aW, fW)
def area(pts):
    return abs(sum(pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1] for i in range(len(pts) - 1))) / 2

def main():
    base = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_BASE
    aliases = read_dbf_aliases(base)
    idx_of = {i: TARGETS[al] for i, al in aliases.items() if al in TARGETS}
    if len(idx_of) != len(TARGETS):
        print("경고: 일부 대상 미발견", [al for al in TARGETS if al not in aliases.values()])
    polys = read_polys(base, set(idx_of))
    lines = ['// AUTO-GENERATED by scripts/extract-development-geometry.py — 편집 금지.',
             '// NSDI 정비구역 SHP(LSMD_CONT_UD602_5174_41, 경기) → WGS84 변환. 공식 GIS 경계.',
             'import type { Location } from "@/domain/types";', '']
    for i, (const, off) in idx_of.items():
        ring = polys[i][0]; ar = area(ring)
        print(f"{const}: SHP area={ar:.0f}㎡ official={off}㎡ ratio={ar/off:.3f} pts={len(ring)}")
        ll = [(round(la, 6), round(lo, 6)) for (E, N) in ring for (la, lo) in [to_wgs(E, N)]]
        body = ", ".join("{lat:%s,lng:%s}" % (la, lo) for la, lo in ll)
        lines.append(f"export const {const}: Location[] = [{body}];")
    open(OUT, "w").write("\n".join(lines) + "\n")
    print("wrote", OUT)

if __name__ == "__main__":
    main()
