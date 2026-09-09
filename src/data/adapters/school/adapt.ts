// 학교 위치 표준데이터 → 시군구별 초/중/고 집계 (순수). raw는 adapter만 안다.
// (전국초중등학교위치표준데이터, api.data.go.kr/openapi/tn_pubr_public_elesch_mskul_lc_api)

export interface SchoolRaw {
  schoolNm?: string;
  schoolSe?: string; // 초등학교 | 중학교 | 고등학교 | ...
  lnmadr?: string; // 지번주소
  rdnmadr?: string; // 도로명주소
  latitude?: string;
  longitude?: string;
}

export type SchoolLevel = "elementary" | "middle" | "high";

/** 개별 학교 좌표(최근접 배정후보 계산용). la=위도, lo=경도 */
export interface SchoolPoint {
  nm: string;
  lv: SchoolLevel;
  la: number;
  lo: number;
}

export interface SigunguSchools {
  elementary: number;
  middle: number;
  high: number;
  names: Record<SchoolLevel, string[]>;
  points: SchoolPoint[];
}

const LEVEL: Record<string, SchoolLevel> = {
  초등학교: "elementary",
  중학교: "middle",
  고등학교: "high",
};

/** 주소에서 시군구 키(시도 다음 토큰: ○○시/군/구) 추출. */
export function sigunguKey(addr: string | undefined): string | undefined {
  if (!addr) return undefined;
  const t = addr.trim().split(/\s+/);
  return t[1] && /(시|군|구)$/.test(t[1]) ? t[1] : undefined;
}

const NAME_CAP = 6;

/** 수도권 학교 rows → 시군구별 집계 */
export function aggregateBySigungu(
  rows: SchoolRaw[],
): Record<string, SigunguSchools> {
  const out: Record<string, SigunguSchools> = {};
  for (const r of rows) {
    const level = r.schoolSe ? LEVEL[r.schoolSe] : undefined;
    const key = sigunguKey(r.lnmadr ?? r.rdnmadr);
    if (!level || !key || !r.schoolNm) continue;
    const s =
      out[key] ??
      (out[key] = {
        elementary: 0,
        middle: 0,
        high: 0,
        names: { elementary: [], middle: [], high: [] },
        points: [],
      });
    s[level] += 1;
    if (s.names[level].length < NAME_CAP) s.names[level].push(r.schoolNm);
    const la = Number(r.latitude);
    const lo = Number(r.longitude);
    if (Number.isFinite(la) && Number.isFinite(lo)) {
      s.points.push({ nm: r.schoolNm, lv: level, la, lo });
    }
  }
  return out;
}

function haversineKm(a: { la: number; lo: number }, b: { la: number; lo: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.la - a.la);
  const dLng = toRad(b.lo - a.lo);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.la)) * Math.cos(toRad(b.la)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** 좌표에서 급별 가장 가까운 학교(배정 후보, 배정과 다를 수 있음). */
export function nearestByLevel(
  point: { la: number; lo: number },
  schools: SchoolPoint[],
): Partial<Record<SchoolLevel, { nm: string; km: number }>> {
  const out: Partial<Record<SchoolLevel, { nm: string; km: number }>> = {};
  for (const s of schools) {
    const km = haversineKm(point, s);
    const cur = out[s.lv];
    if (!cur || km < cur.km) out[s.lv] = { nm: s.nm, km: Math.round(km * 10) / 10 };
  }
  return out;
}
