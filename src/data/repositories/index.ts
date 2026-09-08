// 활성 repository. NEXT_PUBLIC_DATA_SOURCE로 mock ↔ supabase를 고른다.
// 기본은 mock — Supabase 미구성 환경(CI·테스트·로컬)에서도 그대로 동작한다.
// 소비 측은 이 모듈의 complexRepository/regionRepository에만 의존(무변경).
// (docs/design/data-phase2-supabase-catalog.md §6)

import { MOCK_AREAS, getMockArea } from "@/data/mock/areas";
import { MOCK_PRESALES, getMockPresale } from "@/data/mock/presales";
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

// 집 통합: 기존(활성 소스) + 분양(mock). 분양 실데이터는 청약홈 adapter로 후속.
export const homeRepository: HomeRepository = {
  async list(params?: ComplexListParams) {
    const existing = await complexRepository.list(params);
    const presales = params?.regionId
      ? MOCK_PRESALES.filter((p) => p.regionId === params.regionId)
      : MOCK_PRESALES;
    return [...existing, ...presales];
  },
  async getById(id: string) {
    return (await complexRepository.getById(id)) ?? getMockPresale(id) ?? null;
  },
};

// 개발 예정지 — mock(실데이터는 개발계획 adapter로 후속).
export const areaRepository: AreaRepository = {
  async list() {
    return [...MOCK_AREAS];
  },
  async getById(id: string) {
    return getMockArea(id) ?? null;
  },
};
