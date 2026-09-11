"use client";

// 관심/선호 지역의 **권위 source = livingContextStore.regionPrefs.preferred**.
// 기존 candidatesStore.regionInterests는 Supabase 동기화 호환을 위해 당분간 dual-write.
// (docs/design/current-housing.md §8.1, migration 1~2단계)

import { useEffect } from "react";
import type { RegionRef } from "@/domain/types";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useLivingContextStore } from "@/stores/livingContextStore";

/** preferred 읽기/토글 어댑터. 토글 시 preferred(권위) + regionInterests(호환) 동시 갱신. */
export function usePreferredRegions() {
  const preferred = useLivingContextStore((s) => s.regionPrefs.preferred);
  const excluded = useLivingContextStore((s) => s.regionPrefs.excluded);
  const setRegionPrefs = useLivingContextStore((s) => s.setRegionPrefs);
  const addRegionInterest = useCandidatesStore((s) => s.addRegionInterest);
  const removeRegionInterest = useCandidatesStore((s) => s.removeRegionInterest);

  const isPreferred = (id: string) => preferred.some((r) => r.id === id);

  const toggle = (ref: RegionRef) => {
    const on = isPreferred(ref.id);
    const next = on
      ? preferred.filter((r) => r.id !== ref.id)
      : // 중복 RegionRef 방지
        [...preferred.filter((r) => r.id !== ref.id), ref];
    setRegionPrefs({
      preferred: next,
      // preferred/excluded 상호배타
      excluded: excluded.filter((r) => r.id !== ref.id),
    });
    // dual-write (Supabase 호환) — 서버 데이터 파괴 없음
    if (on) removeRegionInterest(ref.id);
    else addRegionInterest(ref.id);
  };

  return { preferred, isPreferred, toggle };
}

/**
 * 비파괴 seed: 두 스토어 하이드레이션 후 preferred가 비어 있고 legacy regionInterests가
 * 있으면 1회 복사. preferred에 값이 있으면 **덮지 않는다**(race/overwrite 방지).
 * 로그인 후 계정 동기화로 regionInterests가 나중에 채워지는 경우도 커버(길이 변화 감지).
 */
export function useSeedPreferredFromInterests() {
  const lcHydrated = useLivingContextStore((s) => s.hasHydrated);
  const candHydrated = useCandidatesStore((s) => s.hasHydrated);
  const preferredLen = useLivingContextStore((s) => s.regionPrefs.preferred.length);
  const interestsLen = useCandidatesStore((s) => s.regionInterests.length);

  useEffect(() => {
    if (!lcHydrated || !candHydrated) return;
    if (preferredLen > 0) return; // 이미 값 있으면 덮지 않음
    const interests = useCandidatesStore.getState().regionInterests;
    if (interests.length === 0) return;
    // 중복 제거 후 seed
    const seen = new Set<string>();
    const preferred: RegionRef[] = [];
    for (const ri of interests) {
      if (seen.has(ri.regionId)) continue;
      seen.add(ri.regionId);
      preferred.push({ id: ri.regionId });
    }
    useLivingContextStore.getState().setRegionPrefs({ preferred });
  }, [lcHydrated, candHydrated, preferredLen, interestsLen]);
}
