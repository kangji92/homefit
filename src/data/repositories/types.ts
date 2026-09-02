// 데이터 접근 인터페이스 (docs/design/domain-model.md §8).
// UI·features는 구현체가 아닌 이 인터페이스에만 의존한다.
// MVP는 mock 구현, 이후 Supabase 구현으로 교체.

import type { Complex, Home, Region } from "@/domain/types";

export interface ComplexListParams {
  regionId?: string;
}

export interface ComplexRepository {
  list(params?: ComplexListParams): Promise<Complex[]>;
  getById(id: string): Promise<Complex | null>;
}

/** 집(기존+분양) 통합 조회 — HomeFit 대상 전체. */
export interface HomeRepository {
  list(params?: ComplexListParams): Promise<Home[]>;
  getById(id: string): Promise<Home | null>;
}

export interface RegionRepository {
  list(): Promise<Region[]>;
}
