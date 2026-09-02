import { describe, it, expect } from "vitest";
import { cn } from "./utils";

// 스모크 테스트: 테스트 파이프라인(vitest + tailwind-merge)이 동작하는지 확인.
describe("cn", () => {
  it("클래스를 병합하고 tailwind 충돌을 해소한다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe(
      "text-sm font-bold",
    );
  });
});
