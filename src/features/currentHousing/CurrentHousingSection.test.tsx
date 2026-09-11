import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useLivingContextStore } from "@/stores/livingContextStore";
import { CurrentHousingSection } from "./CurrentHousingSection";

vi.mock("@/hooks/queries", () => ({
  useRegions: () => ({ data: [{ id: "anyang", name: "안양" }, { id: "hanam", name: "하남" }] }),
  useHomes: () => ({ data: [] }),
}));

beforeEach(() => {
  localStorage.clear();
  useLivingContextStore.getState().reset();
  useLivingContextStore.setState({ hasHydrated: true });
});

describe("CurrentHousingSection", () => {
  it("점유형태를 고르면 스토어에 저장된다", () => {
    render(<CurrentHousingSection />);
    fireEvent.click(screen.getByRole("button", { name: "전세" }));
    expect(useLivingContextStore.getState().current?.tenure).toBe("jeonse");
  });

  it("제외 지역을 토글하면 hard 제약으로 저장된다", () => {
    render(<CurrentHousingSection />);
    // 제외 칩(하남) 클릭 — 관심/제외 각각에 하남 버튼이 있어 마지막(제외 섹션) 선택
    const hanamButtons = screen.getAllByRole("button", { name: "하남" });
    fireEvent.click(hanamButtons[hanamButtons.length - 1]);
    expect(useLivingContextStore.getState().regionPrefs.excluded.map((r) => r.id)).toContain("hanam");
  });
});
