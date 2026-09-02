// 카탈로그 단지 → 실제 아파트 매핑 (국토부 실거래 조회용).
// aptName은 정규화(공백 제거) 비교라 표기 그대로 둬도 매칭된다.

export interface MolitSource {
  complexId: string; // 카탈로그 id
  lawdCd: string; // 시군구 법정동코드 5자리
  aptName: string; // 매칭용 실제 아파트명(aptNm)
  /** 라이브 조회로 실거래 확인 여부 */
  verified: boolean;
}

export const MOLIT_SOURCES: MolitSource[] = [
  // 하남 미사강변도시 (LAWD_CD 41450) — 검증됨
  { complexId: "misa-central", lawdCd: "41450", aptName: "미사강변센트럴자이", verified: true },
  { complexId: "misa-riverview", lawdCd: "41450", aptName: "미사강변골든센트로", verified: true },
  { complexId: "misa-thesharp", lawdCd: "41450", aptName: "미사레스티아", verified: true },
  // 수원 광교신도시 (LAWD_CD 41117) — 검증됨
  { complexId: "gwanggyo-natureN-hills", lawdCd: "41117", aptName: "자연앤힐스테이트", verified: true },
  { complexId: "gwanggyo-lakepark", lawdCd: "41117", aptName: "광교중흥에스클래스", verified: true },
  // 화성 동탄 (LAWD_CD 41595) — 검증됨
  { complexId: "dongtan-lake-xi", lawdCd: "41595", aptName: "신동탄포레자이", verified: true },
  { complexId: "dongtan-thesharp-central", lawdCd: "41595", aptName: "서동탄역파크자이", verified: true },
  { complexId: "dongtan-woonam", lawdCd: "41595", aptName: "서동탄역우남퍼스트빌아파트", verified: true },
  // 인천 검단신도시 — 서구 코드가 이 API에서 조회되지 않음(갭). 코드 확인 필요.
  { complexId: "geomdan-paragon", lawdCd: "28260", aptName: "검단파라곤", verified: false },
  { complexId: "geomdan-prugio", lawdCd: "28260", aptName: "검단신도시푸르지오", verified: false },
];

export function getMolitSource(complexId: string): MolitSource | undefined {
  return MOLIT_SOURCES.find((s) => s.complexId === complexId);
}
