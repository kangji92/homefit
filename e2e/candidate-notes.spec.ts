import { test, expect } from "@playwright/test";
import { seedConditions } from "./fixtures";

// 플로우 2: 후보 담기 → 즐겨찾기 → 단지 상세 메모 작성(+ persist 확인)
test("단지를 담고 즐겨찾기·메모를 남기면 새로고침해도 유지된다", async ({
  page,
}) => {
  await seedConditions(page);
  await page.goto("/complex/misa-central");

  // 후보 담기 → 즐겨찾기 토글
  await page.getByRole("button", { name: "후보에 담기" }).click();
  await page.getByRole("button", { name: "☆ 즐겨찾기" }).click();
  await expect(page.getByRole("button", { name: "★ 즐겨찾기" })).toBeVisible();

  // 장점 메모 추가 (Enter 제출)
  await page.getByLabel("장점 입력").fill("역세권");
  await page.getByLabel("장점 입력").press("Enter");
  await expect(page.getByText("역세권")).toBeVisible();

  // 임장 메모
  await page.getByLabel("임장 메모").fill("주말 방문 예정");

  // 새로고침해도 유지(localStorage persist)
  await page.reload();
  await expect(page.getByRole("button", { name: "★ 즐겨찾기" })).toBeVisible();
  await expect(page.getByText("역세권")).toBeVisible();
  await expect(page.getByLabel("임장 메모")).toHaveValue("주말 방문 예정");
});
