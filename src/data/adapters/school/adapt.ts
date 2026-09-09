// 학교 위치 표준데이터 → 시군구별 초/중/고 집계 (순수). raw는 adapter만 안다.
// (전국초중등학교위치표준데이터, api.data.go.kr/openapi/tn_pubr_public_elesch_mskul_lc_api)

export interface SchoolRaw {
  schoolNm?: string;
  schoolSe?: string; // 초등학교 | 중학교 | 고등학교 | ...
  lnmadr?: string; // 지번주소
  rdnmadr?: string; // 도로명주소
}

export type SchoolLevel = "elementary" | "middle" | "high";

export interface SigunguSchools {
  elementary: number;
  middle: number;
  high: number;
  names: Record<SchoolLevel, string[]>;
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
      });
    s[level] += 1;
    if (s.names[level].length < NAME_CAP) s.names[level].push(r.schoolNm);
  }
  return out;
}
