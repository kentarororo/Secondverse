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
  "Bo is Bruised. This hero was knocked out and starts the next battle with Max HP reduced from 84 to 72.";
const BRUISED_PREP_COPY =
  "Bo starts this battle at 72/72 HP. Bruised reduces Max HP from 84 to 72.";
const BRUISED_EVENT_FACT =
  "Bo starts Bruised. HP 84 to 72; Max HP 84 to 72.";

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

  const sourceButton = aftermath.getByRole("button", { name: "Show knockout detail" });
  await sourceButton.click();
  const inspector = page.getByRole("complementary", { name: "Battle details" });
  await expect(inspector).toBeVisible();
  const focusedSource = inspector.locator("li.is-focused");
  await expect(focusedSource.locator("code")).toHaveText(/^event-\d{4}$/);
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
  const bruisedStart = page.getByRole("button", {
    name: "Start with Bo Bruised · −12 max HP",
  });
  await expect(bruisedStart).toBeVisible();
  await expect(page.getByRole("button", { name: /rear Bo/i })).toContainText(
    "Bruised: HP 72/72; Max HP −12",
  );
  const save = await page.evaluate((key) => window.localStorage.getItem(key), COMBAT_LAB_SAVE_KEY);
  expect(save).not.toBeNull();
  expect(JSON.parse(save ?? "null")).toMatchObject({
    selectedEquipment: "heavy_pad",
    aftermathCondition: {
      kind: "bruised",
      heroId: "bo",
      healthPenalty: 12,
      sourceEventId: expect.stringMatching(/^event-\d{4}$/),
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
  await bruisedStart.click();
  await expect(page.locator(".battle-screen")).toHaveClass(/reduce-motion/);
  await page.getByRole("button", { name: "Pause battle" }).click();
  await expect(page.getByRole("button", { name: "Resume battle" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Current moment" })).toContainText(
    /The battle begins.*Your team takes its starting positions.*Bo Max HP −12.*Bo HP −12.*Bo is Bruised/i,
  );
  await expect(page.locator('[data-unit-id="bo"]')).toHaveAttribute(
    "aria-label",
    /HP 72 of 72.*current change: Max HP −12 \(84→72\), HP −12 \(84→72\)\./i,
  );
  await expect(page.locator('[data-unit-id="bo"] .unit-deltas')).toContainText("Max HP −12");
  await expect(page.locator('[data-unit-id="bo"] .unit-deltas')).toContainText("HP −12");
  await page.screenshot({
    path: "test-results/evidence/punish-bruised-impact-reduced-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Skip to result" }).click();
  const changed = page.getByRole("region", { name: "What your plan did" });
  const planFact = changed.locator(".battle-setup-result");
  await expect(planFact.locator("p")).toContainText("Bo starts Bruised.");
  await page.getByRole("button", { name: "Battle details" }).click();
  await expect(page.getByRole("complementary", { name: "Battle details" }).locator("li").filter({
    hasText: BRUISED_EVENT_FACT,
  })).toHaveCount(1);
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
  await expect(priorCondition).toContainText(
    "No hero was knocked out in Pressure the Rear. The team starts with full Max HP.",
  );
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
  await expect(page.getByText(/Current plan: Bo starts in the front slot.*Team policy: Cover rear/i)).toBeVisible();

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
  await expect(page.getByRole("button", { name: "Start battle", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^Start with .* Bruised/ })).toHaveCount(0);
  await page.screenshot({
    path: "test-results/evidence/punish-prepare-no-injury-desktop.png",
    fullPage: true,
  });

  await skipBattleToResult(page);
  await expect(page.getByRole("region", { name: "What your plan did" })).not.toContainText(
    "starts Bruised",
  );
  await page.getByRole("button", { name: "Battle details" }).click();
  await expect(page.getByRole("complementary", { name: "Battle details" })).not.toContainText(
    "starts Bruised",
  );
  failures.assertNone();
});
