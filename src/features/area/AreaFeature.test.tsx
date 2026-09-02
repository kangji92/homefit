import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_AREAS } from "@/data/mock/areas";
import { useConditionsStore } from "@/stores/conditionsStore";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { AreaFeature } from "./AreaFeature";

const { useAreaMock } = vi.hoisted(() => ({ useAreaMock: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ useArea: () => useAreaMock() }));

const AREA = MOCK_AREAS[0];

beforeEach(() => {
  localStorage.clear();
  useConditionsStore.getState().reset();
  useConditionsStore.setState({ hasHydrated: true });
  useCandidatesStore.getState().reset();
  useCandidatesStore.setState({ hasHydrated: true });
  useAreaMock.mockReturnValue({ data: AREA, isLoading: false, isError: false });
});

describe("AreaFeature", () => {
  it("지역 적합도·지표를 표시한다", () => {
    render(<AreaFeature id={AREA.id} />);
    expect(screen.getByRole("heading", { name: AREA.name })).toBeInTheDocument();
    expect(screen.getByText("지역 지표")).toBeInTheDocument();
    expect(screen.getByText("계획 인프라")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /적합도 \d+점/ })).toBeInTheDocument();
  });

  it("관심 지역으로 담고 뺄 수 있다 (kind:area)", async () => {
    const user = userEvent.setup();
    render(<AreaFeature id={AREA.id} />);
    await user.click(screen.getByRole("button", { name: "관심 지역으로 담기" }));
    expect(useCandidatesStore.getState().isCandidate(AREA.id, "area")).toBe(true);
    await user.click(screen.getByRole("button", { name: "관심 지역에서 제거" }));
    expect(useCandidatesStore.getState().isCandidate(AREA.id, "area")).toBe(false);
  });
});
