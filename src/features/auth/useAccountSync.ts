"use client";

// 로그인 시 계정 상태를 서버에서 불러와 스토어에 적용하고, 이후 변경을 디바운스
// 저장한다. 비로그인/Supabase 미설정이면 아무것도 하지 않는다(게스트).

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useConditionsStore } from "@/stores/conditionsStore";
import { useHouseholdStore } from "@/stores/householdStore";
import { loadUserState, saveUserState } from "./sync-actions";
import type { UserState } from "./userState";

function snapshot(): UserState {
  const c = useConditionsStore.getState();
  const cand = useCandidatesStore.getState();
  const h = useHouseholdStore.getState();
  return {
    conditions: c.conditions,
    priorities: c.priorities,
    dealbreakers: c.dealbreakers,
    onboardingCompleted: c.onboardingCompleted,
    candidates: cand.candidates,
    regionInterests: cand.regionInterests,
    profile: h.profile,
  };
}

function applyState(s: UserState) {
  useConditionsStore.setState((p) => ({
    conditions: s.conditions ?? p.conditions,
    priorities: s.priorities ?? p.priorities,
    dealbreakers: s.dealbreakers ?? p.dealbreakers,
    onboardingCompleted: s.onboardingCompleted ?? p.onboardingCompleted,
  }));
  useCandidatesStore.setState((p) => ({
    candidates: s.candidates ?? p.candidates,
    regionInterests: s.regionInterests ?? p.regionInterests,
  }));
  useHouseholdStore.setState((p) => ({ profile: s.profile ?? p.profile }));
}

export function useAccountSync() {
  const { status } = useSession();
  const loaded = useRef(false);

  // 로그인 → 서버 상태 적용(없으면 로컬로 seed)
  useEffect(() => {
    if (status === "unauthenticated") {
      loaded.current = false;
      return;
    }
    if (status !== "authenticated" || loaded.current) return;
    let cancelled = false;
    void (async () => {
      const remote = await loadUserState();
      if (cancelled) return;
      if (remote) applyState(remote);
      else await saveUserState(snapshot()); // 게스트 데이터를 계정에 초기 저장
      loaded.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // 변경 시 디바운스 저장(로드 완료 후에만 → 루프 방지)
  useEffect(() => {
    if (status !== "authenticated") return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const save = () => {
      if (!loaded.current) return;
      clearTimeout(t);
      t = setTimeout(() => void saveUserState(snapshot()), 1200);
    };
    const unsubs = [
      useConditionsStore.subscribe(save),
      useCandidatesStore.subscribe(save),
      useHouseholdStore.subscribe(save),
    ];
    return () => {
      clearTimeout(t);
      unsubs.forEach((u) => u());
    };
  }, [status]);
}
