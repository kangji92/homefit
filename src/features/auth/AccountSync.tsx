"use client";

import { useAccountSync } from "./useAccountSync";
import { useSeedPreferredFromInterests } from "@/features/currentHousing/usePreferredRegions";

/** 계정 동기화 구동용(렌더 없음). 레이아웃 SessionProvider 안에 마운트. */
export function AccountSync() {
  useAccountSync();
  // 관심지역 legacy(regionInterests) → regionPrefs.preferred 비파괴 seed.
  useSeedPreferredFromInterests();
  return null;
}
