// 활성 repository. NEXT_PUBLIC_DATA_SOURCE로 mock ↔ supabase를 고른다.
// 기본은 mock — Supabase 미구성 환경(CI·테스트·로컬)에서도 그대로 동작한다.
// 소비 측은 이 모듈의 complexRepository/regionRepository에만 의존(무변경).
// (docs/design/data-phase2-supabase-catalog.md §6)

import { MOCK_AREAS, getMockArea } from "@/data/mock/areas";
import { MOCK_PRESALES } from "@/data/mock/presales";
import { APPLYHOME_PRESALES } from "@/data/mock/applyhomePresales";
import { withMockLocation } from "@/data/mock/coordinates";
import type { AreaRepository, ComplexListParams, HomeRepository } from "./types";
import { mockComplexRepository, mockRegionRepository } from "./mock";
import {
  supabaseComplexRepository,
  supabaseRegionRepository,
} from "./supabase";

export * from "./types";

const useSupabase = process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase";

export const complexRepository = useSupabase
  ? supabaseComplexRepository
  : mockComplexRepository;

export const regionRepository = useSupabase
  ? supabaseRegionRepository
  : mockRegionRepository;

// 청약홈 공고 기반 PresaleHome은 플래그(기본 off)일 때만 병합.
// (분양가·평형·lifecycle은 실데이터, metrics·통근은 placeholder라 기본 제외)
const useApplyhome = process.env.NEXT_PUBLIC_APPLYHOME_PRESALES === "1";
const allPresales = useApplyhome
  ? [...MOCK_PRESALES, ...APPLYHOME_PRESALES]
  : MOCK_PRESALES;

// 집 통합: 기존(활성 소스) + 분양(mock + 청약홈 스냅샷).
export const homeRepository: HomeRepository = {
  async list(params?: ComplexListParams) {
    const existing = await complexRepository.list(params);
    const presales = params?.regionId
      ? allPresales.filter((p) => p.regionId === params.regionId)
      : allPresales;
    // presale은 항상 mock이므로 큐레이션 좌표 병합. existing은 소스 repo가 좌표 담당.
    return [...existing, ...presales.map(withMockLocation)];
  },
  async getById(id: string) {
    const existing = await complexRepository.getById(id);
    if (existing) return existing;
    const presale = allPresales.find((p) => p.id === id);
    return presale ? withMockLocation(presale) : null;
  },
};

// 개발 예정지 — mock(실데이터는 개발계획 adapter로 후속). 대표 좌표 병합.
export const areaRepository: AreaRepository = {
  async list() {
    return MOCK_AREAS.map(withMockLocation);
  },
  async getById(id: string) {
    const found = getMockArea(id);
    return found ? withMockLocation(found) : null;
  },
};
