import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_REGIONS } from "@/data/mock/regions";
import {
  DEFAULT_CONDITIONS,
  useConditionsStore,
} from "@/stores/conditionsStore";
import { HomeFeature } from "./HomeFeature";

const { replaceMock, useComplexesMock, useRegionsMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  useComplexesMock: vi.fn(),
  useRegionsMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));
vi.mock("@/hooks/queries", () => ({
  useComplexes: () => useComplexesMock(),
  useHomes: () => useComplexesMock(),
  useRegions: () => useRegionsMock(),
  useAreas: () => ({ data: [], isLoading: false, isError: false }),
}));

const READY_CONDITIONS = {
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
    conditions: READY_CONDITIONS,
  });
  replaceMock.mockClear();
  useComplexesMock.mockReturnValue({
    data: MOCK_COMPLEXES,
    isLoading: false,
    isError: false,
  });
  useRegionsMock.mockReturnValue({
    data: MOCK_REGIONS,
    isLoading: false,
    isError: false,
  });
});

describe("HomeFeature", () => {
  it("hydration 전에는 redirect하지 않고 로딩을 표시한다", () => {
    useConditionsStore.setState({ hasHydrated: false, onboardingCompleted: false });
    render(<HomeFeature />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("온보딩 미완료면 /onboarding으로 유도한다", () => {
    useConditionsStore.setState({ hasHydrated: true, onboardingCompleted: false });
    render(<HomeFeature />);
    expect(replaceMock).toHaveBeenCalledWith("/onboarding");
  });

  it("쿼리 로딩 상태를 표시한다", () => {
    useComplexesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<HomeFeature />);
    expect(screen.getByText("추천을 불러오는 중이에요…")).toBeInTheDocument();
  });

  it("쿼리 에러 상태를 표시한다", () => {
    useComplexesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<HomeFeature />);
    expect(screen.getByText("추천을 불러오지 못했어요.")).toBeInTheDocument();
  });

  it("단지 데이터가 없으면 빈 상태를 표시한다", () => {
    useComplexesMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    render(<HomeFeature />);
    expect(screen.getByText("표시할 단지가 없어요.")).toBeInTheDocument();
  });

  it("조건 미완성이면 조건 설정 안내를 표시한다", () => {
    useConditionsStore.setState({ conditions: DEFAULT_CONDITIONS }); // maxBudget 0
    render(<HomeFeature />);
    expect(screen.getByText("우리 조건을 먼저 완성해주세요.")).toBeInTheDocument();
  });

  it("정상 추천을 상위 5개 이하로 카드에 표시한다", () => {
    render(<HomeFeature />);
    const cards = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href")?.startsWith("/complex/"));
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(5);
  });
});
