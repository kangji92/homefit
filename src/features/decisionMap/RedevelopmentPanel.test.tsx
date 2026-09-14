import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { makeComplex } from "@/domain/__fixtures__";
import type { Home } from "@/domain/types";
import type { DevelopmentArea } from "@/domain/development";
import { RedevelopmentPanel } from "./RedevelopmentPanel";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });
const area: DevelopmentArea = {
  id: "dev-east", name: "동측 재개발", developmentType: "redevelopment",
  stage: "in_progress", detailStage: "implementation", certainty: "confirmed",
  geometry: { kind: "polygon", rings: [[]] },
};
const villa = {
  ...makeComplex({ id: "v1", name: "A빌라" }),
  housingType: "villa",
  listing: { askingPrice: won(92000), recentTransactionPrice: won(78000), landShareM2: 33 },
  redevelopment: { areaId: "dev-east", inside: true }, // 입주권·분담금 미지정
} as Home;

describe("RedevelopmentPanel", () => {
  it("실거주+투자대상 프레이밍과 프리미엄(계산값)·사업단계를 보여준다", () => {
    render(<RedevelopmentPanel home={villa} area={area} />);
    expect(screen.getByText("실거주 + 정비사업 투자대상")).toBeInTheDocument();
    expect(screen.getByText(/사업시행인가/)).toBeInTheDocument(); // detailStage 라벨
    // 프리미엄 +18% (14000/78000)
    expect(screen.getByText(/\+18%/)).toBeInTheDocument();
  });

  it("미상은 '정보 없음'/'확인 필요'로 명시(임의 추정·자동판정 안 함)", () => {
    render(<RedevelopmentPanel home={villa} area={area} />);
    expect(screen.getAllByText("정보 없음").length).toBeGreaterThan(0); // 추가분담금 등
    expect(screen.getByText("확인 필요")).toBeInTheDocument(); // 입주권 unknown
  });

  it("listing/redevelopment 없으면 렌더하지 않는다", () => {
    const { container } = render(<RedevelopmentPanel home={makeComplex({ id: "plain" }) as Home} />);
    expect(container).toBeEmptyDOMElement();
  });
});
