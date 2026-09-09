// 카탈로그 region → 학군 조회용 시군구 키(SCHOOL_BY_SIGUNGU 키와 일치).
// 학교 데이터는 시군구 단위 집계라, 단지의 region을 시군구로 매핑한다.

export const REGION_TO_SIGUNGU: Record<string, string> = {
  dongtan: "화성시",
  misa: "하남시",
  gwanggyo: "수원시",
  geomdan: "서구", // 인천 서구
  pyeongchon: "안양시",
  anyang: "안양시",
  gunpo: "군포시",
  uiwang: "의왕시",
  gamil: "하남시",
};

export function sigunguForRegion(regionId: string): string | undefined {
  return REGION_TO_SIGUNGU[regionId];
}
