import { test, expect } from "@playwright/test";
import { seedConditions } from "./fixtures";

// 플로우 3: 후보 2개 → /compare 비교 결과 확인
test("후보 2개를 선택하면 비교 결과가 보인다", async ({ page }) => {
  await seedConditions(page);

  // 두 단지를 후보로 담는다
  await page.goto("/complex/misa-central");
  await page.getByRole("button", { name: "후보에 담기" }).click();
  await expect(page.getByRole("button", { name: /즐겨찾기/ })).toBeVisible();

  await page.goto("/complex/geomdan-paragon");
  await page.getByRole("button", { name: "후보에 담기" }).click();
  await expect(page.getByRole("button", { name: /즐겨찾기/ })).toBeVisible();

  // 비교
  await page.goto("/compare");
  // A 선택이 URL(상태)에 반영된 뒤 B를 선택한다(상태 전파 대기)
  await page.getByLabel("비교 후보 A").selectOption("misa-central");
  await expect(page).toHaveURL(/[?&]a=misa-central/);
  await page.getByLabel("비교 후보 B").selectOption("geomdan-paragon");
  await expect(page).toHaveURL(/[?&]b=geomdan-paragon/);

  await expect(
    page.getByRole("heading", { name: "미사강변센트럴" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "검단파라곤" })).toBeVisible();
  await expect(page.getByText("항목별 적합도")).toBeVisible();
  // 두 후보의 적합도 게이지
  await expect(page.getByRole("img", { name: /적합도 \d+점/ })).toHaveCount(2);
});
