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
    await expect(page.locator('[data-plan-hero="ada"]')).toContainText(
      "Stance: Brace under pressure",
    );
    await expect(page.locator('[data-plan-hero="bo"]')).toContainText("Stance: Hit front");
    await expect(page.locator('[data-plan-hero="cy"]')).toContainText("Stance: Aid one");
    await expect(page.getByRole("group", { name: "Ada stance" }).getByRole("radio"))
      .toHaveCount(2);
    const secondAdaStance = page.getByRole("radio", {
      name: /Brace under pressure.*2 strain or 60% HP.*26 guard/i,
    });
    await secondAdaStance.scrollIntoViewIfNeeded();
    await expect(secondAdaStance).toBeVisible();
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
    await page.getByRole("button", {
      name: "Start with Bo Bruised · −12 max HP",
    }).click();
    await page.getByRole("button", { name: "Pause battle" }).click();
    await expect(page.getByRole("region", { name: "Current moment" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Your plan in action" }).locator(".plan-track-item"))
      .toHaveCount(3);
    await expectNoHorizontalPageScroll(page);
    await expectNoOverlap(
      page.getByRole("region", { name: "Current moment" }),
      page.getByRole("region", { name: "Your plan in action" }),
      "125% current moment and plan tracker must not overlap",
    );
    failures.assertNone();
  });

  test("system reduced-motion preference is honored in battle", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);
    await skipBattleToResult(page);
    const normalOutcome = await page.getByRole("region", { name: "Battle totals" }).innerText();

    await page.emulateMedia({ reducedMotion: "reduce" });
    await openFreshLab(page);
    await expect(page.getByRole("checkbox", { name: "Reduced motion" })).toBeChecked();
    await page.getByRole("button", { name: "Start battle" }).click();
    await expect(page.locator(".battle-screen")).toHaveClass(/reduce-motion/);
    await page.waitForFunction(() => {
      const delta = document.querySelector('.unit-delta.delta-primary[aria-label^="HP −"]');
      const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) => button.textContent?.trim() === "Pause battle",
      );
      if (!delta || !pause) return false;
      pause.click();
      return true;
    });
    await expect(page.getByRole("button", { name: "Resume battle" })).toBeVisible();
    const primaryDelta = page.locator('.unit-delta.delta-primary[aria-label^="HP −"]');
    const deltaLabel = await primaryDelta.getAttribute("aria-label");
    const deltaMatch = deltaLabel?.match(/^HP −(\d+) \((\d+)→(\d+)\)$/);
    expect(deltaMatch, "primary HP loss must include exact before and after values").not.toBeNull();
    expect(Number(deltaMatch?.[2]) - Number(deltaMatch?.[3])).toBe(Number(deltaMatch?.[1]));
    const momentLabel = await page.locator(".current-moment-card .moment-chain").getAttribute(
      "aria-label",
    );
    const momentDelta = momentLabel?.match(/HP −(\d+)/);
    expect(momentDelta, "current moment must name the same exact HP loss").not.toBeNull();
    expect(momentDelta?.[1]).toBe(deltaMatch?.[1]);
    await expect(page.locator(".reaction-flag")).toContainText(/Hit/i);
    await page.screenshot({
      path: "test-results/evidence/battle-impact-reduced-desktop.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Skip to result" }).click();
    await expect(page.getByRole("heading", { level: 1, name: /^Result:/ })).toBeVisible();
    expect(await page.getByRole("region", { name: "Battle totals" }).innerText()).toBe(
      normalOutcome,
    );
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
      "Bo is Bruised. This hero was knocked out and starts the next battle with Max HP reduced from 84 to 72.",
    );
    const next = page.getByRole("button", { name: "Next encounter" });
    const reward = page.getByRole("region", { name: "Choose equipment for the front slot" });
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
    await expect(priorCondition).toContainText(
      "Bo starts this battle at 72/72 HP. Bruised reduces Max HP from 84 to 72.",
    );
    await expect(page.locator('[data-plan-hero="bo"]')).toContainText(
      "Bruised: HP 72/72; Max HP −12",
    );
    const punishStart = page.getByRole("button", {
      name: "Start with Bo Bruised · −12 max HP",
    });
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
    await punishStart.click();
    await expect(page.locator('[data-unit-id="bo"] .status-bruised')).toHaveText(
      "Bruised · −12 max HP",
    );
    await expect(page.locator(".battle-screen")).toBeVisible();
    await expect(page.getByRole("region", { name: "Current moment" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Your plan in action" }).locator(".plan-track-item"))
      .toHaveCount(3);
    await expectNoHorizontalPageScroll(page);
    await expect(page.locator("img.combat-sprite")).toHaveCount(0);
    await page.getByRole("button", { name: "Pause battle" }).click();
    await expectNoOverlap(
      page.getByRole("region", { name: "Current moment" }),
      page.getByRole("region", { name: "Your plan in action" }),
      "mobile current moment and plan tracker must not overlap",
    );
    await page.screenshot({
      path: "test-results/evidence/punish-bruised-battle-mobile.png",
      fullPage: true,
    });
    failures.assertNone();
  });
});
