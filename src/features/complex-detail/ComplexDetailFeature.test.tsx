import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { DEFAULT_CONDITIONS, useConditionsStore } from "@/stores/conditionsStore";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { ComplexDetailFeature } from "./ComplexDetailFeature";

const { useComplexMock, useRegionsMock } = vi.hoisted(() => ({
  useComplexMock: vi.fn(),
  useRegionsMock: vi.fn(),
}));
vi.mock("@/hooks/queries", () => ({
  useComplex: () => useComplexMock(),
  useHome: () => useComplexMock(),
  useRegions: () => useRegionsMock(),
}));

const COMPLEX = MOCK_COMPLEXES.find((c) => c.id === "misa-central")!;

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
    dealbreakers: {},
  });
  useCandidatesStore.getState().reset();
  useCandidatesStore.setState({ hasHydrated: true });
  useComplexMock.mockReturnValue({
    data: COMPLEX,
    isLoading: false,
    isError: false,
  });
  useRegionsMock.mockReturnValue({
    data: MOCK_REGIONS,
    isLoading: false,
    isError: false,
  });
});

describe("ComplexDetailFeature", () => {
  it("단지와 적합도를 렌더링한다", () => {
    render(<ComplexDetailFeature id="misa-central" />);
    expect(
      screen.getByRole("heading", { name: "미사강변센트럴" }),
    ).toBeInTheDocument();
    expect(screen.getByText("미사강변도시")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /적합도 \d+점/ })).toBeInTheDocument();
    expect(screen.getByText("가격")).toBeInTheDocument();
  });

  it("존재하지 않는 id면 안내를 표시한다", () => {
    useComplexMock.mockReturnValue({ data: null, isLoading: false, isError: false });
    render(<ComplexDetailFeature id="nope" />);
    expect(screen.getByText("단지를 찾을 수 없어요.")).toBeInTheDocument();
  });

  it("로딩 상태를 표시한다", () => {
    useComplexMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    render(<ComplexDetailFeature id="misa-central" />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("에러 상태를 표시한다", () => {
    useComplexMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<ComplexDetailFeature id="misa-central" />);
    expect(screen.getByText("단지 정보를 불러오지 못했어요.")).toBeInTheDocument();
  });

  it("절대조건 실패를 경고로 표시한다", () => {
    useConditionsStore.setState({ dealbreakers: { maxPrice: 1 } });
    render(<ComplexDetailFeature id="misa-central" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("절대조건 미충족");
    expect(alert).toHaveTextContent("최대 가격 초과");
  });

  it("candidatesStore hydration 전에는 후보 버튼을 렌더링하지 않는다", () => {
    useCandidatesStore.setState({ hasHydrated: false });
    render(<ComplexDetailFeature id="misa-central" />);
    expect(screen.queryByRole("button", { name: "후보에 담기" })).toBeNull();
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("후보 담기/제거와 비교 링크가 동작한다", async () => {
    const user = userEvent.setup();
    render(<ComplexDetailFeature id="misa-central" />);

    await user.click(screen.getByRole("button", { name: "후보에 담기" }));
    expect(useCandidatesStore.getState().isCandidate("misa-central")).toBe(true);

    const compareLink = screen.getByRole("link", { name: "비교하기" });
    expect(compareLink).toHaveAttribute("href", "/compare?a=misa-central");

    await user.click(screen.getByRole("button", { name: "후보에서 제거" }));
    expect(useCandidatesStore.getState().isCandidate("misa-central")).toBe(false);
  });

  it("favorite을 토글한다", async () => {
    const user = userEvent.setup();
    render(<ComplexDetailFeature id="misa-central" />);
    await user.click(screen.getByRole("button", { name: "후보에 담기" }));
    await user.click(screen.getByRole("button", { name: /즐겨찾기/ }));
    expect(useCandidatesStore.getState().getCandidate("misa-central")?.favorite).toBe(
      true,
    );
  });

  it("메모(장점)를 추가한다", async () => {
    const user = userEvent.setup();
    render(<ComplexDetailFeature id="misa-central" />);
    await user.click(screen.getByRole("button", { name: "후보에 담기" }));

    await user.type(screen.getByLabelText("장점 입력"), "역세권");
    // 장점/단점 각각 "추가" 버튼이 있으므로 첫 번째(장점)를 사용
    await user.click(screen.getAllByRole("button", { name: "추가" })[0]);

    expect(
      useCandidatesStore.getState().getCandidate("misa-central")?.notes.pros,
    ).toContain("역세권");
  });
});
