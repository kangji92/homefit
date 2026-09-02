import { beforeEach, describe, it, expect } from "vitest";
import { useCandidatesStore } from "./candidatesStore";

beforeEach(() => {
  localStorage.clear();
  useCandidatesStore.getState().reset();
  useCandidatesStore.setState({ hasHydrated: false });
});

const get = () => useCandidatesStore.getState();

describe("candidatesStore — 후보", () => {
  it("후보를 기본값으로 추가한다", () => {
    get().addCandidate("c1");
    const c = get().getCandidate("c1");
    expect(c).toBeDefined();
    expect(c?.favorite).toBe(false);
    expect(c?.notes).toEqual({ pros: [], cons: [] });
    expect(typeof c?.addedAt).toBe("string");
    expect(get().isCandidate("c1")).toBe(true);
  });

  it("같은 complexId는 중복 추가되지 않는다", () => {
    get().addCandidate("c1");
    get().addCandidate("c1");
    expect(get().candidates).toHaveLength(1);
  });

  it("후보를 제거한다", () => {
    get().addCandidate("c1");
    get().removeCandidate("c1");
    expect(get().isCandidate("c1")).toBe(false);
    expect(get().candidates).toHaveLength(0);
  });

  it("favorite을 토글한다", () => {
    get().addCandidate("c1");
    get().toggleFavorite("c1");
    expect(get().getCandidate("c1")?.favorite).toBe(true);
    get().toggleFavorite("c1");
    expect(get().getCandidate("c1")?.favorite).toBe(false);
  });

  it("notes를 병합 수정하고 다른 필드를 보존한다", () => {
    get().addCandidate("c1");
    get().toggleFavorite("c1");
    const addedAt = get().getCandidate("c1")?.addedAt;

    get().updateNotes("c1", { pros: ["역세권"] });
    get().updateNotes("c1", { visitMemo: "채광 좋음" });

    const c = get().getCandidate("c1");
    expect(c?.notes.pros).toEqual(["역세권"]);
    expect(c?.notes.cons).toEqual([]); // 덮어쓰지 않음
    expect(c?.notes.visitMemo).toBe("채광 좋음");
    expect(c?.favorite).toBe(true); // 보존
    expect(c?.addedAt).toBe(addedAt); // 보존
  });
});

describe("candidatesStore — 관심 지역", () => {
  it("관심 지역을 추가/중복방지/삭제한다", () => {
    get().addRegionInterest("r1");
    expect(get().isRegionInterested("r1")).toBe(true);
    get().addRegionInterest("r1");
    expect(get().regionInterests).toHaveLength(1);
    get().removeRegionInterest("r1");
    expect(get().isRegionInterested("r1")).toBe(false);
  });
});

describe("candidatesStore — 격리 & 영속", () => {
  it("한 후보 변경이 다른 후보에 영향을 주지 않는다", () => {
    get().addCandidate("c1");
    get().addCandidate("c2");
    get().toggleFavorite("c1");
    get().updateNotes("c2", { pros: ["신축"] });

    const c1 = get().getCandidate("c1");
    const c2 = get().getCandidate("c2");
    expect(c1?.favorite).toBe(true);
    expect(c1?.notes.pros).toEqual([]);
    expect(c2?.favorite).toBe(false);
    expect(c2?.notes.pros).toEqual(["신축"]);
  });

  it("localStorage에 영속하되 hasHydrated는 저장하지 않는다", () => {
    get().addCandidate("c1");
    get().addRegionInterest("r1");
    get().setHasHydrated(true);

    const raw = localStorage.getItem("homefit-candidates");
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!);
    expect(persisted.state.candidates).toHaveLength(1);
    expect(persisted.state.regionInterests).toHaveLength(1);
    expect(persisted.state).not.toHaveProperty("hasHydrated");
  });

  it("setHasHydrated로 복원 완료를 표시한다", () => {
    expect(get().hasHydrated).toBe(false);
    get().setHasHydrated(true);
    expect(get().hasHydrated).toBe(true);
  });
});
