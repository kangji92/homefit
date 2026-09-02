// TanStack Query 훅 — repository 호출을 감싸 로딩/에러/캐시를 일관 처리.
// (docs/standards/state-and-data.md)

import { useQuery } from "@tanstack/react-query";
import {
  complexRepository,
  regionRepository,
  type ComplexListParams,
} from "@/data/repositories";

export const complexKeys = {
  all: ["complexes"] as const,
  list: (params?: ComplexListParams) => ["complexes", params ?? {}] as const,
  detail: (id: string) => ["complex", id] as const,
};

export const regionKeys = {
  all: ["regions"] as const,
};

export function useComplexes(params?: ComplexListParams) {
  return useQuery({
    queryKey: complexKeys.list(params),
    queryFn: () => complexRepository.list(params),
  });
}

export function useComplex(id: string) {
  return useQuery({
    queryKey: complexKeys.detail(id),
    queryFn: () => complexRepository.getById(id),
    enabled: id.length > 0,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: regionKeys.all,
    queryFn: () => regionRepository.list(),
  });
}
