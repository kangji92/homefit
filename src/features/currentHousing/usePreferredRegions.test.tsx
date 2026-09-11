import { beforeEach, describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useLivingContextStore } from "@/stores/livingContextStore";
import { usePreferredRegions, useSeedPreferredFromInterests } from "./usePreferredRegions";

beforeEach(() => {
  localStorage.clear();
  useCandidatesStore.getState().reset();
  useLivingContextStore.getState().reset();
  useCandidatesStore.setState({ hasHydrated: true });
  useLivingContextStore.setState({ hasHydrated: true });
});

describe("usePreferredRegions — 권위 preferred + dual-write", () => {
  it("토글하면 preferred(권위)와 regionInterests(호환)에 함께 반영된다", () => {
    const { result } = renderHook(() => usePreferredRegions());
    act(() => result.current.toggle({ id: "anyang", label: "안양" }));
    expect(useLivingContextStore.getState().regionPrefs.preferred.map((r) => r.id)).toEqual(["anyang"]);
    expect(useCandidatesStore.getState().regionInterests.map((r) => r.regionId)).toEqual(["anyang"]);
  });

  it("다시 토글하면 양쪽에서 제거된다", () => {
    const { result } = renderHook(() => usePreferredRegions());
    act(() => result.current.toggle({ id: "anyang" }));
    act(() => result.current.toggle({ id: "anyang" }));
    expect(useLivingContextStore.getState().regionPrefs.preferred).toHaveLength(0);
    expect(useCandidatesStore.getState().regionInterests).toHaveLength(0);
  });

  it("excluded에 있던 지역을 preferred로 토글하면 excluded에서 제거된다(상호배타)", () => {
    useLivingContextStore.setState({ regionPrefs: { preferred: [], excluded: [{ id: "hanam" }] } });
    const { result } = renderHook(() => usePreferredRegions());
    act(() => result.current.toggle({ id: "hanam" }));
    expect(useLivingContextStore.getState().regionPrefs.excluded).toHaveLength(0);
    expect(useLivingContextStore.getState().regionPrefs.preferred.map((r) => r.id)).toEqual(["hanam"]);
  });
});

describe("useSeedPreferredFromInterests — 비파괴 seed", () => {
  it("preferred가 비고 legacy regionInterests가 있으면 1회 seed(중복 제거)", () => {
    useCandidatesStore.setState({
      regionInterests: [
        { regionId: "anyang", addedAt: "2026-01-01" },
        { regionId: "anyang", addedAt: "2026-01-02" },
        { regionId: "uiwang", addedAt: "2026-01-03" },
      ],
    });
    renderHook(() => useSeedPreferredFromInterests());
    expect(useLivingContextStore.getState().regionPrefs.preferred.map((r) => r.id)).toEqual(["anyang", "uiwang"]);
  });

  it("preferred에 이미 값이 있으면 legacy로 덮지 않는다", () => {
    useLivingContextStore.setState({ regionPrefs: { preferred: [{ id: "keep" }], excluded: [] } });
    useCandidatesStore.setState({ regionInterests: [{ regionId: "legacy", addedAt: "2026-01-01" }] });
    renderHook(() => useSeedPreferredFromInterests());
    expect(useLivingContextStore.getState().regionPrefs.preferred.map((r) => r.id)).toEqual(["keep"]);
  });

  it("하이드레이션 전에는 seed하지 않는다(race 방지)", () => {
    useLivingContextStore.setState({ hasHydrated: false });
    useCandidatesStore.setState({ regionInterests: [{ regionId: "x", addedAt: "2026-01-01" }] });
    renderHook(() => useSeedPreferredFromInterests());
    expect(useLivingContextStore.getState().regionPrefs.preferred).toHaveLength(0);
  });
});
