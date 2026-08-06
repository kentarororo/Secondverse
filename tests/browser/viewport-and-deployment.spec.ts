import { expect, test } from "@playwright/test";
import {
  collectPageFailures,
  confirmEquipment,
  expectMinimumTarget,
  expectNoOverlap,
  expectNoHorizontalPageScroll,
  openFreshLab,
  skipBattleToResult,
} from "./helpers";

test.describe("desktop presentation", () => {
  test.use({ viewport: { width: 1365, height: 768 } });

  test("125 percent text keeps planning controls reachable", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "125%";
    });
    await page.evaluate(() => document.fonts.ready);

    await expectNoHorizontalPageScroll(page);
    const start = page.getByRole("button", { name: "Start battle" });
    await expect(start).toBeVisible();
    await expectMinimumTarget(start);
    const lastPolicy = page.getByRole("radio", { name: /Wait for need/i });
    await lastPolicy.scrollIntoViewIfNeeded();
    await expect(lastPolicy).toBeVisible();
    await page.screenshot({ path: "test-results/evidence/prepare-desktop-125.png", fullPage: true });

    await skipBattleToResult(page);
    await confirmEquipment(page, "Heavy Pad");
    await page.getByRole("button", { name: "Next encounter" }).click();
    await expect(page.getByRole("region", { name: "Prior condition" })).toContainText(
      "Bo: Bruised",
    );
    await expectNoHorizontalPageScroll(page);
    const footer = page.locator(".prepare-footer");
    for (const moveControl of await page.getByRole("button", { name: /^Move to / }).all()) {
      await expectNoOverlap(
        footer,
        moveControl,
        "125% text Punish footer must not cover a formation move control",
      );
    }
    await page.screenshot({
      path: "test-results/evidence/punish-prepare-bruised-desktop-125.png",
      fullPage: true,
    });
    failures.assertNone();
  });

  test("system reduced-motion preference is honored in battle", async ({ page }) => {
    const failures = collectPageFailures(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openFreshLab(page);
    await expect(page.getByRole("checkbox", { name: "Reduced motion" })).toBeChecked();
    await page.getByRole("button", { name: "Start battle" }).click();
    await expect(page.locator(".battle-screen")).toHaveClass(/reduce-motion/);
    await page.waitForFunction(() => {
      const delta = document.querySelector(".unit-delta");
      const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) => button.textContent?.trim() === "Pause battle",
      );
      if (!delta?.textContent?.match(/HP [−-]\d+/i) || !pause) return false;
      pause.click();
      return true;
    });
    await expect(page.getByRole("button", { name: "Resume battle" })).toBeVisible();
    await expect(page.locator(".unit-delta")).toContainText(/HP [−-]17/i);
    await expect(page.locator(".reaction-flag")).toContainText(/Hit/i);
    await page.screenshot({
      path: "test-results/evidence/battle-impact-reduced-desktop.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Skip to result" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /^Result:/ })).toBeVisible();
    failures.assertNone();
  });

  test("built app loads from a GitHub Pages-style project path", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);
    await expect(page.getByRole("heading", { level: 1, name: "Pressure the Rear" })).toBeVisible();
    failures.assertNone();
  });
});

test.describe("mobile presentation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mobile keeps the complete journey reachable without horizontal scroll", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);

    await expectNoHorizontalPageScroll(page);
    const start = page.getByRole("button", { name: "Start battle" });
    await expectMinimumTarget(start);
    await page.screenshot({ path: "test-results/evidence/prepare-mobile.png", fullPage: true });
    const footerBox = await page.locator(".prepare-footer").boundingBox();
    const formationControlBox = await page.getByRole("button", { name: "Move to middle" }).boundingBox();
    expect(footerBox).not.toBeNull();
    expect(formationControlBox).not.toBeNull();
    const footerCoversFormationControl =
      footerBox !== null &&
      formationControlBox !== null &&
      formationControlBox.x < footerBox.x + footerBox.width &&
      formationControlBox.x + formationControlBox.width > footerBox.x &&
      formationControlBox.y < footerBox.y + footerBox.height &&
      formationControlBox.y + formationControlBox.height > footerBox.y;
    expect.soft(
      footerCoversFormationControl,
      "the sticky footer must not cover a formation control",
    ).toBe(false);

    await start.click();
    await expect(page.getByRole("button", { name: "Skip to result" })).toBeVisible();
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({ path: "test-results/evidence/battle-mobile.png", fullPage: true });
    await page.getByRole("button", { name: "Skip to result" }).click();

    await expect(page.getByRole("heading", { level: 1, name: /^Result:/ })).toBeVisible();
    await expectNoHorizontalPageScroll(page);
    const aftermath = page.getByRole("region", { name: "Aftermath" });
    await expect(aftermath).toContainText(
      "Bo: Bruised. This hero was knocked out. Next battle maximum health −12.",
    );
    const next = page.getByRole("button", { name: "Next encounter" });
    const reward = page.getByRole("region", { name: "Choose front equipment" });
    const quick = page.getByRole("radio", { name: /Quick Shoes/i });
    const confirm = page.getByRole("button", { name: "Confirm equipment" });
    await expect(reward).toBeVisible();
    await expectMinimumTarget(quick.locator("xpath=.."));
    await quick.check();
    await expectMinimumTarget(confirm);
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({ path: "test-results/evidence/reward-mobile.png", fullPage: true });
    await confirmEquipment(page, "Quick Shoes");
    await next.scrollIntoViewIfNeeded();
    await expectMinimumTarget(next);
    await page.screenshot({ path: "test-results/evidence/result-mobile.png", fullPage: true });
    await next.click();
    await expect(page.getByRole("heading", { level: 1, name: "Punish the Front" })).toBeVisible();
    await expectNoHorizontalPageScroll(page);
    const priorCondition = page.getByRole("region", { name: "Prior condition" });
    await expect(priorCondition).toContainText("Bo: Bruised");
    await expect(priorCondition).toContainText("Next battle HP 72/72");
    const punishStart = page.getByRole("button", { name: "Start battle" });
    await expectMinimumTarget(punishStart);
    const punishFooter = page.locator(".prepare-footer");
    for (const moveControl of await page.getByRole("button", { name: /^Move to / }).all()) {
      await expectNoOverlap(
        punishFooter,
        moveControl,
        "mobile Punish footer must not cover a formation move control",
      );
    }
    await page.screenshot({
      path: "test-results/evidence/punish-prepare-bruised-mobile.png",
      fullPage: true,
    });
    failures.assertNone();
  });
});
