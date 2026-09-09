import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { useSessionMock } = vi.hoisted(() => ({ useSessionMock: vi.fn() }));
vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

import { LoginButton } from "./LoginButton";

describe("LoginButton", () => {
  it("비로그인이면 카카오·네이버 로그인 버튼", () => {
    useSessionMock.mockReturnValue({ data: null, status: "unauthenticated" });
    render(<LoginButton />);
    expect(
      screen.getByRole("button", { name: "카카오로 로그인" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "네이버로 로그인" }),
    ).toBeInTheDocument();
  });

  it("로그인이면 이름·provider·로그아웃 (네이버면 네이버로 표시)", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "홍길동", id: "naver:12345" } },
      status: "authenticated",
    });
    render(<LoginButton />);
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("네이버 계정으로 로그인")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });

  it("카카오 provider면 카카오로 표시", () => {
    useSessionMock.mockReturnValue({
      data: { user: { name: "김철수", id: "kakao:999" } },
      status: "authenticated",
    });
    render(<LoginButton />);
    expect(screen.getByText("카카오 계정으로 로그인")).toBeInTheDocument();
  });
});
