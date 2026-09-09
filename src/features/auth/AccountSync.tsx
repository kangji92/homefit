"use client";

import { useAccountSync } from "./useAccountSync";

/** 계정 동기화 구동용(렌더 없음). 레이아웃 SessionProvider 안에 마운트. */
export function AccountSync() {
  useAccountSync();
  return null;
}
