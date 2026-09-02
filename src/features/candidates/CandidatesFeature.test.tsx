import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { DEFAULT_CONDITIONS, useConditionsStore } from "@/stores/conditionsStore";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { CandidatesFeature } from "./CandidatesFeature";

const { useComplexesMock, useRegionsMock } = vi.hoisted(() => ({
  useComplexesMock: vi.fn(),
  useRegionsMock: vi.fn(),
}));
vi.mock("@/hooks/queries", () => ({
  useComplexes: () => useComplexesMock(),
  useRegions: () => useRegionsMock(),
}));

const READY = {
  ...DEFAULT_CONDITIONS,
  maxBudget: 100000,
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

describe("CandidatesFeature", () => {
  it("hydration 전에는 로딩을 표시한다", () => {
    useCandidatesStore.setState({ hasHydrated: false });
    render(<CandidatesFeature />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("쿼리 로딩/에러 상태를 표시한다", () => {
    useComplexesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    const { rerender } = render(<CandidatesFeature />);
    expect(screen.getByText("단지를 불러오는 중이에요…")).toBeInTheDocument();

    useComplexesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    rerender(<CandidatesFeature />);
    expect(screen.getByText("단지를 불러오지 못했어요.")).toBeInTheDocument();
  });

  it("후보가 없으면 빈 안내와 둘러보기 목록을 표시한다", () => {
    render(<CandidatesFeature />);
    expect(
      screen.getByText("담은 후보가 없어요. 아래에서 둘러보고 담아보세요."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "담기" }).length).toBeGreaterThan(0);
  });

  it("둘러보기에서 후보를 담을 수 있다", async () => {
    const user = userEvent.setup();
    render(<CandidatesFeature />);
    await user.click(screen.getAllByRole("button", { name: "담기" })[0]);
    expect(useCandidatesStore.getState().candidates).toHaveLength(1);
  });

  it("담은 후보를 카드로 표시하고 favorite을 토글한다", async () => {
    const user = userEvent.setup();
    useCandidatesStore.getState().addCandidate("misa-central");
    render(<CandidatesFeature />);

    expect(
      screen.getByRole("heading", { name: "미사강변센트럴" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "즐겨찾기" }));
    expect(
      useCandidatesStore.getState().getCandidate("misa-central")?.favorite,
    ).toBe(true);
  });

  it("즐겨찾기 필터는 favorite 후보만 남긴다", async () => {
    const user = userEvent.setup();
    useCandidatesStore.setState({
      candidates: [
        { complexId: "misa-central", favorite: true, notes: { pros: [], cons: [] }, addedAt: "2026-01-01T00:00:00.000Z" },
        { complexId: "geomdan-paragon", favorite: false, notes: { pros: [], cons: [] }, addedAt: "2026-01-02T00:00:00.000Z" },
      ],
    });
    render(<CandidatesFeature />);

    expect(screen.getByRole("heading", { name: "미사강변센트럴" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "검단파라곤" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "★ 즐겨찾기만" }));
    expect(screen.getByRole("heading", { name: "미사강변센트럴" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "검단파라곤" })).not.toBeInTheDocument();
  });

  it("최근 추가순은 addedAt 내림차순으로 정렬한다", async () => {
    const user = userEvent.setup();
    useCandidatesStore.setState({
      candidates: [
        { complexId: "misa-central", favorite: false, notes: { pros: [], cons: [] }, addedAt: "2026-01-01T00:00:00.000Z" },
        { complexId: "geomdan-paragon", favorite: false, notes: { pros: [], cons: [] }, addedAt: "2026-02-01T00:00:00.000Z" },
      ],
    });
    render(<CandidatesFeature />);
    await user.click(screen.getByRole("button", { name: "최근 추가순" }));

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("검단파라곤");
  });

  it("관심 지역 탭에서 지역을 등록/해제한다", async () => {
    const user = userEvent.setup();
    render(<CandidatesFeature />);

    await user.click(screen.getByRole("button", { name: "관심 지역" }));
    const registerButtons = screen.getAllByRole("button", { name: "관심 등록" });
    await user.click(registerButtons[0]);

    expect(useCandidatesStore.getState().regionInterests).toHaveLength(1);
  });
});
