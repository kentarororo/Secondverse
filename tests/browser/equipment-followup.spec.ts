import { expect, test, type Page } from "@playwright/test";
import {
  collectPageFailures,
  COMBAT_LAB_SAVE_KEY,
  confirmEquipment,
  openFreshLab,
  reachPunishPreparation,
  skipBattleToResult,
  waitForRenderedLab,
} from "./helpers";

test.use({ viewport: { width: 1365, height: 768 } });

async function seedStoredValue(page: Page, raw: string): Promise<void> {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: COMBAT_LAB_SAVE_KEY, value: raw },
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForRenderedLab(page);
}

async function resultSnapshot(page: Page): Promise<string> {
  return [
    await page.getByRole("region", { name: "Exact outcome" }).innerText(),
    await page.getByRole("region", { name: "Your formation" }).innerText(),
    await page.getByRole("region", { name: "Enemy formation" }).innerText(),
    await page.getByRole("region", { name: "What changed" }).innerText(),
  ].join("\n---\n");
}

test("reward gate shows exact options, reversible selection, and required confirmation", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await skipBattleToResult(page);

  const reward = page.getByRole("region", { name: "Choose front equipment" });
  const heavy = page.getByRole("radio", {
    name: /Heavy Pad.*Starting guard \+18.*Speed -3/i,
  });
  const quick = page.getByRole("radio", {
    name: /Quick Shoes.*Starting guard \+0.*Speed \+4/i,
  });
  const confirm = page.getByRole("button", { name: "Confirm equipment" });
  const next = page.getByRole("button", { name: "Next encounter" });

  await expect(reward).toBeVisible();
  await expect(heavy).toBeVisible();
  await expect(quick).toBeVisible();
  await expect(confirm).toBeDisabled();
  await expect(next).toBeDisabled();
  await expect(next).toHaveAccessibleDescription(
    "Choose and confirm equipment before the next encounter.",
  );
  await page.screenshot({ path: "test-results/evidence/reward-unselected-desktop.png", fullPage: true });

  await heavy.check();
  await expect(heavy).toBeChecked();
  await expect(reward.getByText("Selected")).toHaveCount(1);
  await quick.check();
  await expect(heavy).not.toBeChecked();
  await expect(quick).toBeChecked();
  await expect(reward.getByText("Selected")).toHaveCount(1);

  await confirm.click();
  await expect(page.getByRole("status")).toContainText("Quick Shoes is ready for the front slot.");
  await expect(next).toBeEnabled();
  await expect(quick).toBeChecked();
  await page.screenshot({ path: "test-results/evidence/reward-confirmed-quick-desktop.png", fullPage: true });
  failures.assertNone();
});

test("confirmed Heavy Pad is truthful in Punish preparation and authoritative exact events", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await reachPunishPreparation(page, "Heavy Pad");

  const equipped = page.getByRole("region", { name: "Front equipment" });
  await expect(equipped).toContainText("Heavy Pad");
  await expect(equipped).toContainText(/Ada wears it in front/i);
  await expect(equipped).toContainText(/Starting guard \+18; Speed -3/i);
  await expect(page.getByText(/Current plan: Front Ada; Hold front; Heavy Pad/i)).toBeVisible();
  await page.screenshot({ path: "test-results/evidence/punish-prepare-heavy-desktop.png", fullPage: true });

  await skipBattleToResult(page);
  const equipmentFact =
    "Heavy Pad applies to Ada in front: starting guard +18; speed -3, from 10 to 7.";
  await expect(page.getByRole("region", { name: "What changed" })).toContainText(
    "Bo starts Bruised: health 84 to 72; maximum health 84 to 72.",
  );
  await page.screenshot({ path: "test-results/evidence/punish-result-heavy-desktop.png", fullPage: true });

  await page.getByRole("button", { name: "Exact events" }).click();
  await expect(page.getByRole("complementary", { name: "Exact events" })).toContainText(equipmentFact);
  await page.getByRole("button", { name: "Close exact events" }).click();
  failures.assertNone();
});

test("reload after confirmation resumes Punish the Front with the saved item", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await skipBattleToResult(page);
  await confirmEquipment(page, "Heavy Pad");

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForRenderedLab(page);
  await expect(page.getByRole("heading", { level: 1, name: "Punish the Front" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Front equipment" })).toContainText(
    /Heavy Pad.*Starting guard \+18; Speed -3/i,
  );
  await expect(page.getByRole("region", { name: "Prior condition" })).toContainText(
    /Bo: Bruised.*Next battle HP 72\/72.*Maximum health −12 from 84/i,
  );
  const save = await page.evaluate((key) => window.localStorage.getItem(key), COMBAT_LAB_SAVE_KEY);
  expect(save).toContain('"selectedEquipment":"heavy_pad"');
  expect(save).toContain('"aftermathCondition":{"kind":"bruised","heroId":"bo"');
  await page.screenshot({ path: "test-results/evidence/punish-resume-heavy-desktop.png", fullPage: true });
  failures.assertNone();
});

test("saved display and playback preferences do not alter deterministic Punish result", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await reachPunishPreparation(page, "Quick Shoes");
  await expect(page.getByRole("region", { name: "Prior condition" })).toContainText("Bo: Bruised");

  await skipBattleToResult(page);
  const defaultPreferencesResult = await resultSnapshot(page);
  expect(defaultPreferencesResult).toContain(
    "Bo starts Bruised: health 84 to 72; maximum health 84 to 72.",
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForRenderedLab(page);
  await page.getByRole("checkbox", { name: "Reduced motion" }).check();
  await page.getByRole("button", { name: "Mute sound" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();
  await page.getByRole("button", { name: "2x" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Result:/ })).toBeVisible();
  expect(await resultSnapshot(page)).toBe(defaultPreferencesResult);

  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForRenderedLab(page);
  await expect(page.getByRole("checkbox", { name: "Reduced motion" })).toBeChecked();
  await expect(page.getByRole("button", { name: "Unmute sound" })).toBeVisible();
  await page.getByRole("button", { name: "Start battle" }).click();
  await expect(page.getByRole("button", { name: "2x" })).toHaveAttribute("aria-pressed", "true");
  failures.assertNone();
});

test("malformed save offers recovery and Continue clean opens a clean lab", async ({ page }) => {
  const failures = collectPageFailures(page);
  await seedStoredValue(page, "not-json");

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Saved data needs attention");
  await expect(alert).toContainText("Saved data is damaged. Clear it to start clean.");
  await expect(page.getByRole("button", { name: "Clear saved data" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue clean" })).toBeVisible();
  await page.screenshot({ path: "test-results/evidence/save-recovery-malformed.png", fullPage: true });
  await page.getByRole("button", { name: "Continue clean" }).click();
  await expect(alert).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Pressure the Rear" })).toBeVisible();
  failures.assertNone();
});

test("incompatible save offers recovery and Clear saved data removes it", async ({ page }) => {
  const failures = collectPageFailures(page);
  await seedStoredValue(page, JSON.stringify({ version: 2 }));

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Saved data uses a different version. Clear it to start clean.");
  await expect(page.getByRole("button", { name: "Continue clean" })).toBeVisible();
  await page.screenshot({ path: "test-results/evidence/save-recovery-incompatible.png", fullPage: true });
  await page.getByRole("button", { name: "Clear saved data" }).click();
  await expect(alert).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Pressure the Rear" })).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), COMBAT_LAB_SAVE_KEY)).toBeNull();
  failures.assertNone();
});
