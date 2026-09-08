import { test, expect } from "@playwright/test";

// 플로우 1: 온보딩 → 조건 저장 → 홈 진입
test("온보딩을 완료하면 홈으로 이동하고 추천이 보인다", async ({ page }) => {
  await page.goto("/onboarding");

  // 스텝 1 예산 (기본 거래유형: 매매)
  await page.getByLabel("최대 매매 예산 (만원)").fill("100000");
  await page.getByLabel("보유 자금 (만원)").fill("50000");
  await page.getByRole("button", { name: "다음" }).click();

  // 스텝 2 직장·통근 (통근시간 기본값 유효)
  await page.getByLabel("직장 A 근무지역").selectOption("gangnam");
  await page.getByLabel("직장 B 근무지역").selectOption("pangyo");
  await page.getByRole("button", { name: "다음" }).click();

  // 스텝 3 평형·가족, 스텝 4 우선순위 (기본값 유효)
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByRole("button", { name: "다음" }).click();

  // 스텝 5 절대조건 → 완료
  await page.getByRole("button", { name: "완료" }).click();

  // 홈
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: "우리 조건" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "추천 주택" })).toBeVisible();
});
