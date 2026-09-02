import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageContainer } from "./PageContainer";

describe("PageContainer", () => {
  it("자식을 렌더링한다", () => {
    render(
      <PageContainer>
        <p>내용</p>
      </PageContainer>,
    );
    expect(screen.getByText("내용")).toBeInTheDocument();
  });

  it("className으로 폭을 확장할 수 있다", () => {
    render(
      <PageContainer className="max-w-4xl">
        <p>넓은 내용</p>
      </PageContainer>,
    );
    // max-w-md 기본이 max-w-4xl로 병합(치환)된다
    expect(screen.getByText("넓은 내용").parentElement).toHaveClass("max-w-4xl");
  });
});
