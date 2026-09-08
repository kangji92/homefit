import { beforeEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { DEFAULT_CONDITIONS, useConditionsStore } from "@/stores/conditionsStore";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { CompareFeature } from "./CompareFeature";

const { params, replaceMock, useComplexesMock, useRegionsMock } = vi.hoisted(
  () => ({
    params: { current: new URLSearchParams() },
    replaceMock: vi.fn(),
    useComplexesMock: vi.fn(),
    useRegionsMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  useSearchParams: () => params.current,
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/compare",
}));
vi.mock("@/hooks/queries", () => ({
  useComplexes: () => useComplexesMock(),
  useHomes: () => useComplexesMock(),
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
  params.current = new URLSearchParams();
  replaceMock.mockClear();
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

function addTwoCandidates() {
  useCandidatesStore.getState().addCandidate("misa-central");
  useCandidatesStore.getState().addCandidate("geomdan-paragon");
}

describe("CompareFeature", () => {
  it("hydration 전에는 로딩을 표시한다", () => {
    useCandidatesStore.setState({ hasHydrated: false });
    render(<CompareFeature />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("후보가 2개 미만이면 안내를 표시한다", () => {
    render(<CompareFeature />);
    expect(
      screen.getByText("비교하려면 후보를 2개 이상 담아주세요."),
    ).toBeInTheDocument();
  });

  it("선택이 없으면 선택 안내를 표시한다", () => {
    addTwoCandidates();
    render(<CompareFeature />);
    expect(screen.getByText("비교할 후보 2개를 선택하세요.")).toBeInTheDocument();
  });

  it("A/B가 선택되면 비교 결과를 렌더링한다", () => {
    addTwoCandidates();
    params.current = new URLSearchParams("a=misa-central&b=geomdan-paragon");
    render(<CompareFeature />);
    expect(
      screen.getByRole("heading", { name: "미사강변센트럴" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "검단파라곤" }),
    ).toBeInTheDocument();
    expect(screen.getByText("항목별 적합도")).toBeInTheDocument();
    expect(screen.getByText("절대조건")).toBeInTheDocument();
    expect(screen.getByText("세대수")).toBeInTheDocument();
    // 두 후보의 ScoreGauge
    expect(screen.getAllByRole("img", { name: /적합도 \d+점/ })).toHaveLength(2);
  });

  it("후보에서 제거된(또는 직접 입력한) URL id는 무시한다", () => {
    // a는 후보지만 b는 후보 아님 → 비교 불가 안내
    useCandidatesStore.getState().addCandidate("misa-central");
    useCandidatesStore.getState().addCandidate("geomdan-paragon");
    params.current = new URLSearchParams("a=misa-central&b=gwanggyo-lakepark");
    render(<CompareFeature />);
    expect(
      screen.getByText("비교할 후보 2개를 선택하세요."),
    ).toBeInTheDocument();
  });

  it("선택 변경 시 URL 쿼리를 갱신한다", async () => {
    const user = userEvent.setup();
    addTwoCandidates();
    render(<CompareFeature />);
    await user.selectOptions(screen.getByLabelText("비교 후보 A"), "misa-central");
    expect(replaceMock).toHaveBeenCalledWith("/compare?a=misa-central");
  });

  describe("우선순위 시뮬레이션", () => {
    function renderWithPair() {
      addTwoCandidates();
      params.current = new URLSearchParams("a=misa-central&b=geomdan-paragon");
      render(<CompareFeature />);
    }

    it("변경 전에는 저장/초기화 버튼이 없다", () => {
      renderWithPair();
      expect(
        screen.queryByRole("button", { name: "이 우선순위로 저장" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "초기화" }),
      ).not.toBeInTheDocument();
    });

    it("슬라이더를 조정해 저장하면 우선순위가 갱신되고 변경 상태가 해제된다", async () => {
      const user = userEvent.setup();
      renderWithPair();

      fireEvent.change(screen.getByLabelText("가격"), { target: { value: "100" } });
      const saveBtn = screen.getByRole("button", { name: "이 우선순위로 저장" });
      await user.click(saveBtn);

      expect(useConditionsStore.getState().priorities.price).toBe(100);
      expect(
        screen.queryByRole("button", { name: "이 우선순위로 저장" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText("우선순위를 저장했어요.")).toBeInTheDocument();
    });

    it("초기화는 저장값으로 되돌리고 스토어는 건드리지 않는다", () => {
      renderWithPair();
      const before = useConditionsStore.getState().priorities.price;

      fireEvent.change(screen.getByLabelText("가격"), { target: { value: "13" } });
      expect(screen.getByLabelText("가격")).toHaveValue("13");

      fireEvent.click(screen.getByRole("button", { name: "초기화" }));
      expect(
        screen.queryByRole("button", { name: "초기화" }),
      ).not.toBeInTheDocument();
      expect(useConditionsStore.getState().priorities.price).toBe(before);
    });
  });
});
