import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListCardShell } from "./ListCardShell";

describe("ListCardShell", () => {
  it("href 링크로 감싸고 본문·action 슬롯을 렌더한다", () => {
    render(
      <ListCardShell href="/area/x" action={<button type="button">담기</button>}>
        <h3>동네</h3>
      </ListCardShell>,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/area/x");
    expect(screen.getByRole("heading", { name: "동네" })).toBeInTheDocument();
    // action은 링크와 분리된 슬롯(중첩 아님)
    expect(screen.getByRole("button", { name: "담기" })).toBeInTheDocument();
  });

  it("action 없으면 슬롯을 그리지 않는다", () => {
    render(<ListCardShell href="/x"><span>본문</span></ListCardShell>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
