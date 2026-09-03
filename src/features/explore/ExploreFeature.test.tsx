import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_AREAS } from "@/data/mock/areas";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { DEFAULT_CONDITIONS, useConditionsStore } from "@/stores/conditionsStore";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { ExploreFeature } from "./ExploreFeature";

const { useHomesMock, useRegionsMock, useAreasMock } = vi.hoisted(() => ({
  useHomesMock: vi.fn(),
  useRegionsMock: vi.fn(),
  useAreasMock: vi.fn(),
}));
vi.mock("@/hooks/queries", () => ({
  useHomes: () => useHomesMock(),
  useAreas: () => useAreasMock(),
  useRegions: () => useRegionsMock(),
}));

const READY = {
  ...DEFAULT_CONDITIONS,
  maxSalePrice: 100000,
  availableFunds: 50000,
  maxCommuteMinutes: 60,
  workplaces: [
    { id: "gangnam", label: "강남", lat: 0, lng: 0, transport: "transit" as const },
    { id: "pangyo", label: "판교", lat: 0, lng: 0, transport: "car" as const },
  ],
};

beforeEach(() => {
  localStorage.clear();
  useConditionsStore.getState().reset();
  useConditionsStore.setState({
    hasHydrated: true,
    onboardingCompleted: true,
    conditions: READY,
  });
  useCandidatesStore.getState().reset();
  useCandidatesStore.setState({ hasHydrated: true });
  useHomesMock.mockReturnValue({
    data: MOCK_COMPLEXES,
    isLoading: false,
    isError: false,
  });
  useRegionsMock.mockReturnValue({
    data: MOCK_REGIONS,
    isLoading: false,
    isError: false,
  });
  useAreasMock.mockReturnValue({
    data: MOCK_AREAS,
    isLoading: false,
    isError: false,
  });
});

describe("ExploreFeature", () => {
  it("집과 개발 예정지 그룹을 함께 보여준다", () => {
    render(<ExploreFeature />);
    expect(screen.getByRole("region", { name: "집" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "개발 예정지" }),
    ).toBeInTheDocument();
  });

  it("개발예정지 유형 필터를 선택하면 집 그룹이 사라진다", async () => {
    const user = userEvent.setup();
    render(<ExploreFeature />);
    await user.click(screen.getByRole("tab", { name: "개발예정지" }));
    expect(screen.queryByRole("region", { name: "집" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "개발 예정지" }),
    ).toBeInTheDocument();
  });

  it("이름 검색이 결과를 좁힌다", async () => {
    const user = userEvent.setup();
    render(<ExploreFeature />);
    const firstName = MOCK_COMPLEXES[0].name;
    await user.type(screen.getByLabelText("이름 검색"), firstName);
    expect(screen.getByText(firstName)).toBeInTheDocument();
  });

  it("결과 카드에서 바로 관심 담기가 스토어에 반영된다", async () => {
    const user = userEvent.setup();
    render(<ExploreFeature />);
    const [firstAdd] = screen.getAllByRole("button", { name: "관심 담기" });
    await user.click(firstAdd);
    expect(useCandidatesStore.getState().candidates.length).toBe(1);
    // 토글 후 라벨이 '관심에서 빼기'로 바뀐다
    expect(
      screen.getAllByRole("button", { name: "관심에서 빼기" }).length,
    ).toBeGreaterThan(0);
  });
});
