// Supabase 카탈로그 repository (읽기 전용).
// 행(snake_case) → 도메인 타입 매핑은 순수 함수로 분리해 단위 테스트한다.
// (docs/design/data-phase2-supabase-catalog.md §5)

import { getSupabaseClient } from "@/lib/supabase";
import type {
  Complex,
  ComplexMetrics,
  ComplexPrice,
  Region,
} from "@/domain/types";
import type {
  ComplexListParams,
  ComplexRepository,
  RegionRepository,
} from "./types";

// ===== 행 타입 (테이블 컬럼과 1:1) =====
export interface RegionRow {
  id: string;
  name: string;
  summary: string | null;
}

export interface ComplexRow {
  id: string;
  region_id: string;
  name: string;
  price: ComplexPrice;
  sizes_pyeong: number[];
  completion_year: number;
  households: number;
  station_distance_m: number;
  commute_minutes: Record<string, number>;
  metrics: ComplexMetrics;
  school_nearby: boolean | null;
  images: string[] | null;
}

// ===== 순수 매핑 =====
export function mapRegion(row: RegionRow): Region {
  return {
    id: row.id,
    name: row.name,
    ...(row.summary != null ? { summary: row.summary } : {}),
  };
}

export function mapComplex(row: ComplexRow): Complex {
  return {
    id: row.id,
    name: row.name,
    regionId: row.region_id,
    price: row.price,
    sizesPyeong: row.sizes_pyeong,
    completionYear: row.completion_year,
    households: row.households,
    stationDistanceM: row.station_distance_m,
    commuteMinutes: row.commute_minutes,
    metrics: row.metrics,
    ...(row.school_nearby != null ? { schoolNearby: row.school_nearby } : {}),
    ...(row.images != null ? { images: row.images } : {}),
  };
}

// ===== repository =====
export const supabaseRegionRepository: RegionRepository = {
  async list() {
    const { data, error } = await getSupabaseClient()
      .from("regions")
      .select("*");
    if (error) throw error;
    return (data as RegionRow[]).map(mapRegion);
  },
};

export const supabaseComplexRepository: ComplexRepository = {
  async list(params?: ComplexListParams) {
    let query = getSupabaseClient().from("complexes").select("*");
    if (params?.regionId) query = query.eq("region_id", params.regionId);
    const { data, error } = await query;
    if (error) throw error;
    return (data as ComplexRow[]).map(mapComplex);
  },
  async getById(id: string) {
    const { data, error } = await getSupabaseClient()
      .from("complexes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? mapComplex(data as ComplexRow) : null;
  },
};
