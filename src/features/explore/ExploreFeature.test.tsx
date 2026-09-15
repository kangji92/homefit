import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import { MOCK_AREAS } from "@/data/mock/areas";
import { MOCK_REGIONS } from "@/data/mock/regions";
import { DEFAULT_CONDITIONS, useConditionsStore } from "@/stores/conditionsStore";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { ExploreFeature } from "./ExploreFeature";

const { useHomesMock, useRegionsMock, useAreasMock, useDevelopmentsMock } = vi.hoisted(() => ({
  useHomesMock: vi.fn(),
  useRegionsMock: vi.fn(),
  useAreasMock: vi.fn(),
  useDevelopmentsMock: vi.fn(),
}));
vi.mock("@/hooks/queries", () => ({
  useHomes: () => useHomesMock(),
  useAreas: () => useAreasMock(),
  useRegions: () => useRegionsMock(),
  useDevelopments: () => useDevelopmentsMock(),
}));

const DEV_AREA = {
  id: "dev-anyang-stadium-east", name: "종합운동장 동측일원 재개발", developmentType: "redevelopment",
  stage: "in_progress", detailStage: "implementation", certainty: "confirmed", regionId: "pyeongchon",
  geometry: { kind: "point", at: { lat: 37.4, lng: 126.94 } },
  milestones: [{ kind: "implementation", label: "사업시행계획인가", date: "2026-05-19", status: "confirmed", sourceType: "official", verification: "verified" }],
} as const;

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
  useDevelopmentsMock.mockReturnValue({ data: [DEV_AREA], isLoading: false, isError: false });
});

describe("ExploreFeature", () => {
  it("집과 개발 예정지 그룹을 함께 보여준다", () => {
    render(<ExploreFeature />);
    expect(screen.getByRole("region", { name: "검토할 집 후보" })).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "검토할 개발 예정지" }),
    ).toBeInTheDocument();
  });

  it("개발예정지 유형 필터를 선택하면 집 그룹이 사라진다", async () => {
    const user = userEvent.setup();
    render(<ExploreFeature />);
    await user.click(screen.getByRole("tab", { name: "개발예정지" }));
    expect(screen.queryByRole("region", { name: "검토할 집 후보" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "검토할 개발 예정지" }),
    ).toBeInTheDocument();
  });

  it("이름 검색이 결과를 좁힌다", async () => {
    const user = userEvent.setup();
    render(<ExploreFeature />);
    const firstName = MOCK_COMPLEXES[0].name;
    await user.type(screen.getByLabelText("이름 검색"), firstName);
    expect(screen.getByText(firstName)).toBeInTheDocument();
  });

  it("'정비사업' 탭에서 정비사업 구역(비점수 판단보조)을 카드로 보여준다", async () => {
    const user = userEvent.setup();
    render(<ExploreFeature />);
    await user.click(screen.getByRole("tab", { name: "정비사업" }));
    expect(screen.getByText("종합운동장 동측일원 재개발")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "정비사업 구역" })).toBeInTheDocument();
    // 판단 보조(점수 미반영) 고지가 함께 보인다
    expect(screen.getAllByText(/적합도 점수에 반영되지 않아요/).length).toBeGreaterThan(0);
  });

  it("'현장에서 본 매물 분석하기' CTA가 지도 뷰(/strategy?view=map)로 연결된다", () => {
    render(<ExploreFeature />);
    const cta = screen.getByRole("link", { name: /현장에서 본 매물 분석하기/ });
    expect(cta).toHaveAttribute("href", "/strategy?view=map");
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
