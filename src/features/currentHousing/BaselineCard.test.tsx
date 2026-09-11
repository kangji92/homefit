import { beforeEach, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useLivingContextStore } from "@/stores/livingContextStore";
import { BaselineCard } from "./BaselineCard";

beforeEach(() => {
  localStorage.clear();
  useLivingContextStore.getState().reset();
  useLivingContextStore.setState({ hasHydrated: true });
});

describe("BaselineCard", () => {
  it("현재 주거가 없으면 렌더하지 않는다", () => {
    const { container } = render(<BaselineCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("현재 주거가 있으면 status·점수 없이 baseline을 보여준다", () => {
    useLivingContextStore.setState({
      current: { tenure: "jeonse", regionRef: { id: "anyang", label: "평촌" }, movePreference: "open_to_move" },
    });
    render(<BaselineCard />);
    expect(screen.getByText("기준 · 현재 유지")).toBeInTheDocument();
    expect(screen.getByText(/평촌 · 전세/)).toBeInTheDocument();
    expect(screen.getByText("· 추가 필요현금 없음")).toBeInTheDocument();
  });
});
