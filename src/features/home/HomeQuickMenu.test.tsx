import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeQuickMenu } from "./HomeQuickMenu";

describe("HomeQuickMenu", () => {
  it("하단 탭에 없는 하위 기능 4개를 아이콘 링크로 노출한다", () => {
    render(<HomeQuickMenu />);
    const href = (name: RegExp) => screen.getByRole("link", { name }).getAttribute("href");
    expect(href(/청약/)).toBe("/explore?kind=presale");
    expect(href(/정비사업/)).toBe("/explore?kind=development");
    expect(href(/현장매물/)).toBe("/strategy?view=map");
    expect(href(/개발예정지/)).toBe("/explore?kind=area");
  });
});
