import { expect, test } from "@playwright/test";
import {
  collectPageFailures,
  confirmEquipment,
  openFreshLab,
  skipBattleToResult,
  tabTo,
} from "./helpers";

test.use({ viewport: { width: 1365, height: 768 } });

test("prepare to readable battle to result to next encounter", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  await expect(page.getByRole("heading", { level: 1, name: "Pressure the Rear" })).toBeVisible();
  await expect(page.getByText(/marks that slot before every third action/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exact events" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/evidence/prepare-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Start battle" }).click();
  await expect(page.getByRole("button", { name: "Skip to result" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Exact events" })).toHaveCount(0);
  await expect(page.locator(".intent-label")).toBeVisible();
  await page.getByRole("button", { name: "Pause battle" }).click();
  await expect(page.getByRole("button", { name: "Resume battle" })).toBeVisible();
  await page.screenshot({ path: "test-results/evidence/battle-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Resume battle" }).click();
  await page.waitForFunction(() => {
    const fact = document.querySelector(".battle-fact-strip p");
    const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Pause battle",
    );
    if (!fact?.textContent?.match(/loses \d+ health/i) || !pause) return false;
    pause.click();
    return true;
  });
  await expect(page.getByRole("button", { name: "Resume battle" })).toBeVisible();
  await expect(page.locator(".battle-fact-strip p")).toContainText(/loses \d+ health/i);
  await expect(page.locator(".intent-card")).toContainText(/Bo to Rear Guard/i);
  await expect(page.locator(".intent-card")).toContainText(/Basic hit/i);
  await expect(page.locator(".intent-card")).toContainText(/Contact/i);
  await expect(page.locator('[data-unit-id="rear_guard"]')).toContainText(/Target/i);
  await expect(page.locator('[data-unit-id="rear_guard"]')).toContainText(/Hit/i);
  await expect(page.locator('[data-unit-id="rear_guard"]')).toContainText(/HP [−-]17/i);
  await expect(page.locator('[data-unit-id="rear_guard"]')).toHaveAttribute(
    "aria-label",
    /81 of 98 health.*current change HP [−-]17/i,
  );
  await page.screenshot({ path: "test-results/evidence/battle-impact-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Skip to result" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Result:/ })).toBeVisible();
  await expect(page.getByRole("region", { name: "What changed" })).toContainText("Plan");
  await expect(page.getByRole("region", { name: "What changed" })).toContainText("Turning point");
  await expect(page.getByRole("region", { name: "What changed" })).toContainText("Consequence");
  await expect(page.getByRole("heading", { name: "Exact events" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/evidence/result-desktop.png", fullPage: true });

  await confirmEquipment(page, "Heavy Pad");
  await page.screenshot({
    path: "test-results/evidence/reward-confirmed-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next encounter" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Punish the Front" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Front equipment" })).toContainText("Heavy Pad");
  await expect(page.locator(".enemy-rule-banner")).toContainText(/strain/i);
  await expect(page.locator(".enemy-rule-banner")).toContainText(/break/i);
  failures.assertNone();
});

test("formation and team policy produce a visible, traceable result change", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  await skipBattleToResult(page);
  const baselineFormation = await page.getByRole("region", { name: "Your formation" }).innerText();
  const baselineOutcome = await page.getByRole("region", { name: "Exact outcome" }).innerText();
  await page.getByRole("button", { name: "Change plan and replay" }).click();

  await page.getByRole("button", { name: /Ada.*guard.*HP 112/i }).click();
  await page.getByRole("button", { name: "Move to middle" }).click();
  await page.getByRole("radio", { name: /Cover rear/i }).check();
  await expect(page.getByText(/Current plan: Front Cy; Cover rear/i)).toBeVisible();
  await page.screenshot({ path: "test-results/evidence/prepare-cover-rear.png", fullPage: true });

  await skipBattleToResult(page);
  const changedFormation = await page.getByRole("region", { name: "Your formation" }).innerText();
  const changedOutcome = await page.getByRole("region", { name: "Exact outcome" }).innerText();
  expect(changedFormation).not.toBe(baselineFormation);
  expect(changedOutcome).not.toBe(baselineOutcome);
  await expect(page.getByRole("region", { name: "What changed" })).toContainText(
    /Cover rear: Ada covers/i,
  );
  await expect(page.getByRole("region", { name: "What changed" })).toContainText(
    /Ada intercepts the marked rear hit/i,
  );

  await page.getByRole("button", { name: "Exact events" }).click();
  await expect(page.getByRole("heading", { name: "Exact events" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Exact events" })).toContainText(
    /Cover rear: Ada covers/i,
  );
  await page.getByRole("button", { name: "Close exact events" }).click();
  await expect(page.getByRole("heading", { name: "Exact events" })).toHaveCount(0);
  failures.assertNone();
});

test("skip and reduced motion preserve the same deterministic outcome", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  await skipBattleToResult(page);
  const normalOutcome = await page.getByRole("region", { name: "Exact outcome" }).innerText();
  const normalHeroes = await page.getByRole("region", { name: "Your formation" }).innerText();
  const normalEnemies = await page.getByRole("region", { name: "Enemy formation" }).innerText();

  await page.getByRole("button", { name: "Change plan and replay" }).click();
  await page.getByRole("checkbox", { name: "Reduced motion" }).check();
  await expect(page.getByRole("checkbox", { name: "Reduced motion" })).toBeChecked();
  await skipBattleToResult(page);

  expect(await page.getByRole("region", { name: "Exact outcome" }).innerText()).toBe(normalOutcome);
  expect(await page.getByRole("region", { name: "Your formation" }).innerText()).toBe(normalHeroes);
  expect(await page.getByRole("region", { name: "Enemy formation" }).innerText()).toBe(normalEnemies);
  failures.assertNone();
});

test("keyboard-only flow reaches battle, result, and encounter two", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  const start = page.getByRole("button", { name: "Start battle" });
  await tabTo(page, start);
  await expect(start).toBeFocused();
  await page.keyboard.press("Enter");

  const skip = page.getByRole("button", { name: "Skip to result" });
  await expect(skip).toBeVisible();
  await tabTo(page, skip);
  await page.keyboard.press("Enter");

  const resultHeading = page.getByRole("heading", { level: 1, name: /^Result:/ });
  await expect(resultHeading).toBeVisible();
  await expect(resultHeading).toBeFocused();
  const heavyPad = page.getByRole("radio", { name: /Heavy Pad/i });
  const quickShoes = page.getByRole("radio", { name: /Quick Shoes/i });
  await tabTo(page, heavyPad);
  await page.keyboard.press("ArrowDown");
  await expect(quickShoes).toBeChecked();
  const confirm = page.getByRole("button", { name: "Confirm equipment" });
  await tabTo(page, confirm);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Quick Shoes is ready");
  const next = page.getByRole("button", { name: "Next encounter" });
  await tabTo(page, next);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1, name: "Punish the Front" })).toBeVisible();
  failures.assertNone();
});

test("normal-speed playback reaches its result inside the 45 to 90 second target", async ({ page }) => {
  test.setTimeout(100_000);
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  const startedAt = Date.now();
  await page.getByRole("button", { name: "Start battle" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Result:/ })).toBeVisible({
    timeout: 95_000,
  });
  const durationSeconds = (Date.now() - startedAt) / 1_000;
  console.log(`Normal-speed browser playback: ${durationSeconds.toFixed(1)} seconds`);
  expect(durationSeconds).toBeGreaterThanOrEqual(45);
  expect(durationSeconds).toBeLessThanOrEqual(90);
  failures.assertNone();
});
