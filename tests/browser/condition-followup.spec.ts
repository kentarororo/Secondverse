import { expect, test, type Page } from "@playwright/test";
import {
  collectPageFailures,
  COMBAT_LAB_SAVE_KEY,
  confirmEquipment,
  expectNoOverlap,
  openFreshLab,
  skipBattleToResult,
  waitForRenderedLab,
} from "./helpers";

test.use({ viewport: { width: 1365, height: 768 } });

const BRUISED_RESULT_COPY =
  "Bo: Bruised. This hero was knocked out. Next battle maximum health −12.";
const BRUISED_PREP_COPY =
  "Next battle HP 72/72. Maximum health −12 from 84.";
const BRUISED_PLAN_FACT =
  "Bo starts Bruised: health 84 to 72; maximum health 84 to 72.";

async function seedStoredValue(page: Page, value: object): Promise<void> {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ key, raw }) => window.localStorage.setItem(key, raw),
    { key: COMBAT_LAB_SAVE_KEY, raw: JSON.stringify(value) },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForRenderedLab(page);
}

test("default Pressure aftermath links Bo's Bruised condition to the defeating event", async ({
  page,
}) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await skipBattleToResult(page);

  const aftermath = page.getByRole("region", { name: "Aftermath" });
  await expect(aftermath).toContainText(BRUISED_RESULT_COPY);
  await page.screenshot({
    path: "test-results/evidence/aftermath-bruised-desktop.png",
    fullPage: true,
  });

  const sourceButton = aftermath.getByRole("button", { name: "Show source event" });
  await sourceButton.click();
  const inspector = page.getByRole("complementary", { name: "Exact events" });
  await expect(inspector).toBeVisible();
  const focusedSource = inspector.locator("li.is-focused");
  await expect(focusedSource).toContainText("event-0073");
  await expect(focusedSource).toContainText("Rear Attacker defeats Bo.");
  await page.keyboard.press("Escape");
  await expect(inspector).toHaveCount(0);
  await expect(sourceButton).toBeFocused();
  failures.assertNone();
});

test("confirmed equipment and Bruised persist into Punish and produce an authoritative plan fact", async ({
  page,
}) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await skipBattleToResult(page);
  await confirmEquipment(page, "Heavy Pad");

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForRenderedLab(page);
  await expect(page.getByRole("heading", { level: 1, name: "Punish the Front" })).toBeVisible();
  const priorCondition = page.getByRole("region", { name: "Prior condition" });
  await expect(priorCondition).toContainText("Bo: Bruised");
  await expect(priorCondition).toContainText(BRUISED_PREP_COPY);
  await expect(page.getByRole("button", { name: /rear Bo/i })).toContainText(
    "Bruised: HP 72/72, Max HP −12",
  );
  const save = await page.evaluate((key) => window.localStorage.getItem(key), COMBAT_LAB_SAVE_KEY);
  expect(save).not.toBeNull();
  expect(JSON.parse(save ?? "null")).toMatchObject({
    selectedEquipment: "heavy_pad",
    aftermathCondition: {
      kind: "bruised",
      heroId: "bo",
      healthPenalty: 12,
      sourceEventId: "event-0073",
    },
  });
  await page.screenshot({
    path: "test-results/evidence/punish-prepare-bruised-desktop.png",
    fullPage: true,
  });
  const footer = page.locator(".prepare-footer");
  for (const moveControl of await page.getByRole("button", { name: /^Move to / }).all()) {
    await expectNoOverlap(
      footer,
      moveControl,
      "desktop Punish footer must not cover a formation move control",
    );
  }

  await page.getByRole("checkbox", { name: "Reduced motion" }).check();
  await page.getByRole("button", { name: "Start battle" }).click();
  await expect(page.locator(".battle-screen")).toHaveClass(/reduce-motion/);
  await page.waitForFunction((factCopy) => {
    const fact = document.querySelector(".battle-fact-strip p");
    const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Pause battle",
    );
    if (fact?.textContent?.trim() !== factCopy || !pause) return false;
    pause.click();
    return true;
  }, BRUISED_PLAN_FACT);
  await expect(page.getByRole("button", { name: "Resume battle" })).toBeVisible();
  await expect(page.locator('[data-unit-id="bo"]')).toHaveAttribute(
    "aria-label",
    /72 of 72 health.*current change Max HP −12, HP −12/i,
  );
  await expect(page.locator('[data-unit-id="bo"] .unit-deltas')).toContainText("Max HP −12");
  await expect(page.locator('[data-unit-id="bo"] .unit-deltas')).toContainText("HP −12");
  await page.screenshot({
    path: "test-results/evidence/punish-bruised-impact-reduced-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Skip to result" }).click();
  const changed = page.getByRole("region", { name: "What changed" });
  await expect(changed.getByRole("heading", { name: "Plan" })).toBeVisible();
  await expect(changed).toContainText(BRUISED_PLAN_FACT);
  await changed.getByRole("button", { name: "Show exact event" }).first().click();
  await expect(page.getByRole("complementary", { name: "Exact events" }).locator("li.is-focused"))
    .toContainText(BRUISED_PLAN_FACT);
  failures.assertNone();
});

test("a version-one save without aftermathCondition loads as no prior condition", async ({ page }) => {
  const failures = collectPageFailures(page);
  await seedStoredValue(page, {
    version: 1,
    selectedEquipment: "quick_shoes",
    progress: { pressureRearCompleted: true, punishFrontCompleted: false },
    preferences: { reducedMotion: false, audioEnabled: true, battleSpeed: 1 },
  });

  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Punish the Front" })).toBeVisible();
  const priorCondition = page.getByRole("region", { name: "Prior condition" });
  await expect(priorCondition).toContainText("No injury");
  await expect(priorCondition).toContainText("Starting health is unchanged");
  await expect(priorCondition).not.toContainText("Bruised");

  // A normal preference write serialises the schema default, proving the old shape loaded as null.
  await page.getByRole("checkbox", { name: "Reduced motion" }).check();
  const updatedSave = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    COMBAT_LAB_SAVE_KEY,
  );
  expect(JSON.parse(updatedSave ?? "null")).toMatchObject({
    selectedEquipment: "quick_shoes",
    aftermathCondition: null,
  });
  await page.screenshot({
    path: "test-results/evidence/punish-old-save-no-condition-desktop.png",
    fullPage: true,
  });
  failures.assertNone();
});

test("Ada in middle with Cover rear avoids injury and carries no condition into Punish", async ({
  page,
}) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  await page.getByRole("button", { name: /front Ada/i }).click();
  await page.getByRole("button", { name: "Move to middle" }).click();
  await page.getByRole("button", { name: /rear Bo/i }).click();
  await page.getByRole("button", { name: "Move to front" }).click();
  await page.getByRole("radio", { name: /Cover rear/i }).check();
  await expect(page.getByText(/Current plan: Front Bo; Cover rear/i)).toBeVisible();

  await skipBattleToResult(page);
  const aftermath = page.getByRole("region", { name: "Aftermath" });
  await expect(aftermath).toContainText("No injury. No hero was knocked out.");
  await expect(aftermath).not.toContainText("Bruised");
  await page.screenshot({
    path: "test-results/evidence/aftermath-no-injury-desktop.png",
    fullPage: true,
  });

  await confirmEquipment(page, "Quick Shoes");
  await page.getByRole("button", { name: "Next encounter" }).click();
  const priorCondition = page.getByRole("region", { name: "Prior condition" });
  await expect(priorCondition).toContainText("No injury");
  await expect(priorCondition).not.toContainText("Bruised");
  await page.screenshot({
    path: "test-results/evidence/punish-prepare-no-injury-desktop.png",
    fullPage: true,
  });

  await skipBattleToResult(page);
  await expect(page.getByRole("region", { name: "What changed" })).not.toContainText(
    "starts Bruised",
  );
  await page.getByRole("button", { name: "Exact events" }).click();
  await expect(page.getByRole("complementary", { name: "Exact events" })).not.toContainText(
    "starts Bruised",
  );
  failures.assertNone();
});
