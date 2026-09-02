// 활성 repository. NEXT_PUBLIC_DATA_SOURCE로 mock ↔ supabase를 고른다.
// 기본은 mock — Supabase 미구성 환경(CI·테스트·로컬)에서도 그대로 동작한다.
// 소비 측은 이 모듈의 complexRepository/regionRepository에만 의존(무변경).
// (docs/design/data-phase2-supabase-catalog.md §6)

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
