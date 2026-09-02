import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useComplex, useComplexes, useRegions } from "./queries";

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("query hooks", () => {
  it("useRegions는 지역 목록을 로드한다", async () => {
    const { result } = renderHook(() => useRegions(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.length).toBeGreaterThan(0);
  });

  it("useComplexes는 regionId로 필터링한다", async () => {
    const { result } = renderHook(() => useComplexes({ regionId: "misa" }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.every((c) => c.regionId === "misa")).toBe(true);
  });

  it("useComplex는 단일 단지를 로드한다", async () => {
    const { result } = renderHook(() => useComplex("misa-central"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("misa-central");
  });
});
