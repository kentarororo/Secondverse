import { expect, test, type Page } from "@playwright/test";
import {
  collectPageFailures,
  openFreshLab,
  reachPunishPreparation,
  skipBattleToResult,
} from "./helpers";

test.use({ viewport: { width: 1365, height: 768 } });

const stanceCases = [
  {
    heroId: "ada",
    heroName: "Ada",
    defaultName: "Brace under pressure",
    alternativeName: "Brace early",
    options: [
      /Brace under pressure.*At 2 Points.*waits for 2 Strain or 60% HP.*At 3 Points.*spends 2 Points and gains 26 Guard/i,
      /Brace early.*At 2 Points, Ada spends 2 Points and gains 18 Guard/i,
    ],
  },
  {
    heroId: "bo",
    heroName: "Bo",
    defaultName: "Hit front",
    alternativeName: "Finish weak",
    options: [
      /Hit front.*At 2 Points, Bo spends 2 Points and uses Heavy Hit against the front enemy/i,
      /Finish weak.*At 2 Points.*waits for an enemy below half HP.*At 3 Points.*uses Heavy Hit against the weakest enemy/i,
    ],
  },
  {
    heroId: "cy",
    heroName: "Cy",
    defaultName: "Aid one",
    alternativeName: "Aid two",
    options: [
      /Aid one.*At 2 Points, Cy spends 2 Points and restores 24 HP to the most injured ally/i,
      /Aid two.*At 3 Points, Cy spends 3 Points and restores 16 HP to each of up to two injured allies/i,
    ],
  },
] as const;

async function pauseOnStatusAtGroupedMoment(
  page: Page,
  unitId: string,
  statusClass: string,
): Promise<void> {
  const status = page.locator(`[data-unit-id="${unitId}"] .status-${statusClass}`);
  await page.waitForFunction(
    ({ statusSelector }) => {
      const cue = document.querySelector(statusSelector);
      const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
        (button) => button.textContent?.trim() === "Pause battle",
      );
      if (!cue || !pause) return false;
      pause.click();
      return true;
    },
    {
      statusSelector: `[data-unit-id="${unitId}"] .status-${statusClass}`,
    },
  );
  await expect(page.getByRole("button", { name: "Resume battle" })).toBeVisible();
  await expect(status).toBeVisible();
  await expect(page.locator(".battle-fact-strip")).toContainText(
    /Review every action and number from this moment/i,
  );
}

async function exactEventsText(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Battle details" }).click();
  const inspector = page.getByRole("complementary", { name: "Battle details" });
  await expect(inspector).toBeVisible();
  const text = await inspector.innerText();
  await page.getByRole("button", { name: "Close battle details" }).click();
  return text;
}

test("each hero owns exactly two forecasted stance choices and every card shows the selection", async ({
  page,
}) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  for (const stanceCase of stanceCases) {
    const heroCard = page.locator(`[data-plan-hero="${stanceCase.heroId}"]`);
    await expect(heroCard).toContainText(`Stance: ${stanceCase.defaultName}`);
    await heroCard.click();

    const group = page.getByRole("group", { name: `${stanceCase.heroName} stance` });
    await expect(group.getByRole("radio")).toHaveCount(2);
    await expect(group.getByRole("radio", { name: stanceCase.options[0] })).toBeChecked();
    await expect(group.getByRole("radio", { name: stanceCase.options[1] })).toBeVisible();

    await group.getByRole("radio", { name: stanceCase.options[1] }).check();
    await expect(heroCard).toContainText(`Stance: ${stanceCase.alternativeName}`);
  }

  await expect(page.locator(".plan-hero-silhouette[data-visual-source='css']")).toHaveCount(3);
  await expect(page.locator(".plan-hero-silhouette[data-resolved-visual-id='fallback.css']"))
    .toHaveCount(3);
  await expect(page.locator("img.combat-sprite")).toHaveCount(0);
  await expect(page.locator(".stance-summary")).toContainText(
    "Stances: Ada — Brace early; Bo — Finish weak; Cy — Aid two.",
  );
  await page.screenshot({
    path: "test-results/evidence/stances-all-selected-desktop.png",
    fullPage: true,
  });
  failures.assertNone();
});

test("changing only Cy's stance changes the authoritative result events", async ({ page }) => {
  const failures = collectPageFailures(page);
  await openFreshLab(page);

  // Keep Cy in middle while swapping Ada and Bo, matching the reliable two-ally healing fixture.
  await page.locator('[data-plan-hero="ada"]').click();
  await page.getByRole("button", { name: "Move to rear" }).click();
  await expect(page.locator('[data-plan-hero="bo"]')).toContainText("front");
  await expect(page.locator('[data-plan-hero="cy"]')).toContainText("Stance: Aid one");

  await skipBattleToResult(page);
  const baselineEvents = await exactEventsText(page);
  expect(baselineEvents).toContain(
    "Cy uses Aid one. Restores 24 HP to one ally and spends 2 Points.",
  );

  await page.getByRole("button", { name: "Change plan and replay" }).click();
  await page.locator('[data-plan-hero="cy"]').click();
  await page.getByRole("radio", {
    name: /Aid two.*restores 16 HP to each of up to two injured allies/i,
  }).check();
  await expect(page.locator(".stance-summary")).toContainText("Cy — Aid two");

  await skipBattleToResult(page);
  const changedEvents = await exactEventsText(page);
  expect(changedEvents).toContain(
    "Cy uses Aid two. Restores 16 HP to each of up to two allies and spends 3 Points.",
  );
  expect(changedEvents).not.toBe(baselineEvents);
  await page.screenshot({
    path: "test-results/evidence/stance-aid-two-result-desktop.png",
    fullPage: true,
  });
  failures.assertNone();
});

test("a conditional stance is rendered at its actor and primary HP change dominates secondary facts", async ({
  page,
}) => {
  test.setTimeout(60_000);
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await page.locator('[data-plan-hero="bo"]').click();
  await page.getByRole("radio", {
    name: /Finish weak.*enemy below half HP.*weakest enemy/i,
  }).check();
  await page.getByRole("button", { name: "Start battle" }).click();
  await page.getByRole("button", { name: "2x" }).click();

  await page.waitForFunction(() => {
    const ribbon = document.querySelector('[data-unit-id="bo"] .stance-ribbon');
    const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Pause battle",
    );
    if (!ribbon?.textContent?.includes("Finish weak") || !pause) return false;
    pause.click();
    return true;
  });
  const ribbon = page.locator('[data-unit-id="bo"] .stance-ribbon');
  await expect(ribbon).toHaveAttribute("aria-label", "Finish weak stance used");
  await expect(ribbon).toContainText(/Condition met|Used at the Points cap/i);
  await expect(ribbon).toContainText("Finish weak");
  await expect(ribbon).toContainText(
    "Uses Heavy Hit against the weakest enemy and spends 2 Points.",
  );
  await page.screenshot({
    path: "test-results/evidence/stance-finish-weak-trigger-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Resume battle" }).click();
  await page.waitForFunction(() => {
    const primary = document.querySelector(".unit-delta.delta-primary");
    const secondary = document.querySelector(".unit-delta.delta-secondary");
    const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Pause battle",
    );
    if (!primary || !secondary || !pause) return false;
    pause.click();
    return true;
  });
  const prominence = await page.evaluate(() => {
    const primaryNumber = document.querySelector<HTMLElement>(".unit-delta.delta-primary strong");
    const primary = document.querySelector<HTMLElement>(".unit-delta.delta-primary");
    const secondary = document.querySelector<HTMLElement>(".unit-delta.delta-secondary");
    if (!primaryNumber || !primary || !secondary) return null;
    return {
      primaryFontSize: Number.parseFloat(getComputedStyle(primaryNumber).fontSize),
      secondaryFontSize: Number.parseFloat(getComputedStyle(secondary).fontSize),
      primaryWeight: Number.parseInt(getComputedStyle(primaryNumber).fontWeight, 10),
      secondaryWeight: Number.parseInt(getComputedStyle(secondary).fontWeight, 10),
    };
  });
  expect(prominence).not.toBeNull();
  expect(prominence?.primaryFontSize).toBeGreaterThan((prominence?.secondaryFontSize ?? 0) * 1.5);
  expect(prominence?.primaryWeight).toBeGreaterThanOrEqual(prominence?.secondaryWeight ?? 0);
  await page.screenshot({
    path: "test-results/evidence/primary-delta-prominence-desktop.png",
    fullPage: true,
  });
  failures.assertNone();
});

test("Marked and Defeated cues survive the event that introduced them", async ({ page }) => {
  test.setTimeout(70_000);
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await page.getByRole("button", { name: "Start battle" }).click();
  await page.getByRole("button", { name: "2x" }).click();

  await pauseOnStatusAtGroupedMoment(page, "bo", "marked");
  await expect(page.locator('[data-unit-id="bo"] .status-marked')).toHaveText("Marked");
  await page.screenshot({
    path: "test-results/evidence/status-marked-persistent-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Resume battle" }).click();
  await pauseOnStatusAtGroupedMoment(page, "bo", "defeated");
  await expect(page.locator('[data-unit-id="bo"] .status-defeated')).toHaveText("Defeated");
  await page.screenshot({
    path: "test-results/evidence/status-defeated-persistent-desktop.png",
    fullPage: true,
  });
  failures.assertNone();
});

test("Bruised remains visible and Broken survives its source event in Punish", async ({ page }) => {
  test.setTimeout(60_000);
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await reachPunishPreparation(page, "Heavy Pad");
  await page.getByRole("button", {
    name: "Start with Bo Bruised · −12 max HP",
  }).click();
  await expect(page.locator('[data-unit-id="bo"] .status-bruised')).toHaveText(
    "Bruised · −12 max HP",
  );
  await page.getByRole("button", { name: "2x" }).click();

  await pauseOnStatusAtGroupedMoment(page, "ada", "broken");
  await expect(page.locator('[data-unit-id="ada"] .status-broken')).toHaveText("Broken");
  await expect(page.locator('[data-unit-id="bo"] .status-bruised')).toHaveText(
    "Bruised · −12 max HP",
  );
  await page.screenshot({
    path: "test-results/evidence/status-broken-bruised-persistent-desktop.png",
    fullPage: true,
  });
  failures.assertNone();
});
