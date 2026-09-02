// 카탈로그 단지 → 실제 아파트 매핑 (국토부 실거래 조회용).
// PoC는 1~2개만. 확대 단계에서 나머지 단지의 실제 아파트를 채운다.
// ⚠️ lawdCd/aptName은 실제 조회로 검증 필요(값은 실단지 기준으로 지정).

export interface MolitSource {
  complexId: string; // 카탈로그 id
  lawdCd: string; // 시군구 법정동코드 5자리
  aptName: string; // 매칭용 실제 아파트명(aptNm)
}

export const MOLIT_SOURCES: MolitSource[] = [
  // PoC 대상 — 하남 미사강변도시 (라이브 조회로 검증됨: 매매/전월세 실거래 확인)
  { complexId: "misa-central", lawdCd: "41450", aptName: "미사강변센트럴자이" },
  // 확대 대상(실아파트·검증 후속) — 화성 동탄2
  { complexId: "dongtan-lake-xi", lawdCd: "41590", aptName: "동탄역시범한화꿈에그린" },
];

export function getMolitSource(complexId: string): MolitSource | undefined {
  return MOLIT_SOURCES.find((s) => s.complexId === complexId);
}
