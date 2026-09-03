import type { Region } from "@/domain/types";

export const MOCK_REGIONS: readonly Region[] = [
  { id: "dongtan", name: "동탄2신도시", summary: "GTX·자족기능이 있는 남부 신도시" },
  { id: "misa", name: "미사강변도시", summary: "한강 인접, 강남 접근성 좋은 동부" },
  { id: "gwanggyo", name: "광교신도시", summary: "호수공원·학군의 수원 남부" },
  { id: "geomdan", name: "검단신도시", summary: "신축 대단지가 많은 인천 북서부" },
  // 안양권 — 인덕원·과천 인접, GTX-C(인덕원) 예정
  { id: "pyeongchon", name: "평촌·안양(동안구)", summary: "학군·인프라 성숙, 인덕원 개발 수혜" },
  { id: "anyang", name: "안양(만안구)", summary: "1호선 축, 재개발 신축이 늘어난 원도심" },
  { id: "gunpo", name: "군포·산본", summary: "4호선 산본신도시, 금정역 환승" },
  { id: "uiwang", name: "의왕", summary: "인덕원 인접 신축, 판교 접근성" },
  { id: "gamil", name: "하남 감일지구", summary: "강남 접근성 좋은 하남 서부 택지지구" },
];
