// 활성 repository. MVP는 mock 구현을 노출한다.
// Supabase 도입 시 여기 export만 교체하면 소비 측은 무변경.

export * from "./types";
export {
  mockComplexRepository as complexRepository,
  mockRegionRepository as regionRepository,
} from "./mock";
