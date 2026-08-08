import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  collectPageFailures,
  confirmEquipment,
  expectNoHorizontalPageScroll,
  openFreshLab,
  skipBattleToResult,
  tabTo,
} from "./helpers";

const FORBIDDEN_EQUIPMENT_PHRASE = /wears it in front/i;

async function candidateBuildIds(cards: Locator): Promise<string[]> {
  const ids: string[] = [];
  for (const card of await cards.all()) {
    const text = await card.getByText(/^Build ID /).innerText();
    ids.push(text.replace(/^Build ID /, ""));
  }
  return ids;
}

async function expectStructuredCandidateCards(page: Page): Promise<Locator> {
  const cards = page.locator(".candidate-card");
  await expect(cards).toHaveCount(3);

  for (const card of await cards.all()) {
    const name = await card.getByRole("heading", { level: 2 }).innerText();
    await expect(card.getByRole("region", { name: `${name} signature` })).toBeVisible();
    await expect(card.getByRole("region", { name: `${name} techniques` })).toContainText(
      "Starting techniques",
    );
    await expect(card.getByRole("region", { name: `${name} draft scores` })).toContainText(
      /Vitality.*Power.*Guard.*Speed.*Focus/i,
    );
    const tradeoffs = card.getByRole("region", { name: `${name} tradeoffs` });
    await expect(tradeoffs).toContainText("Advantage");
    await expect(tradeoffs).toContainText("Risk");
    await expect(card).toContainText("Potential clue");
    await expect(card).toContainText("Unknown: exact late growth.");
    await expect(card).toContainText("Build fingerprint");
    await expect(card.getByText(/^Build ID [0-9a-f]{8}$/)).toBeVisible();
    await expect(card.getByRole("button", { name: new RegExp(`^Choose ${name}$`) })).toBeVisible();

    for (const paragraph of await card.locator("p").all()) {
      await expect(paragraph).toHaveText(/[.!?]$/);
    }
  }

  expect(new Set(await candidateBuildIds(cards)).size, "the three build IDs must differ").toBe(3);
  await expect(page.locator("body")).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);
  return cards;
}

test.describe("candidate draft desktop", () => {
  test.use({ viewport: { width: 1365, height: 768 } });

  test("three structured candidates support favorite and reroll while preserving the battle plan", async ({
    page,
  }) => {
    test.setTimeout(75_000);
    const failures = collectPageFailures(page);
    await openFreshLab(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "125%";
    });
    await page.evaluate(() => document.fonts.ready);

    await page.locator('[data-plan-hero="ada"]').click();
    await page.getByRole("button", { name: "Move to middle" }).click();
    await page.getByRole("radio", { name: /Cover rear/i }).check();
    const planBeforeCandidates = await page.locator(".plan-summary").innerText();
    expect(planBeforeCandidates).toMatch(/Cy starts in the front slot.*Team policy: Cover rear/i);
    await expectNoHorizontalPageScroll(page);

    await page.getByRole("button", { name: "Candidate trial" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Choose a future recruit" }))
      .toBeVisible();
    await expect(page.getByText("Comparison only.", { exact: true })).toBeVisible();
    await expect(page.getByText(/does not change the current battle team yet/i)).toBeVisible();
    const firstCards = await expectStructuredCandidateCards(page);
    const firstBuildIds = await candidateBuildIds(firstCards);
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({
      path: "test-results/evidence/candidate-lab-desktop-125.png",
      fullPage: true,
    });

    const firstName = await firstCards.first().getByRole("heading", { level: 2 }).innerText();
    const chooseFirst = firstCards.first().getByRole("button", {
      name: `Choose ${firstName}`,
    });
    await chooseFirst.click();
    await expect(page.getByRole("status")).toContainText(`Favorite recorded: ${firstName}.`);
    await expect(firstCards.first()).toHaveClass(/is-selected/);
    await expect(firstCards.first().locator('button[aria-pressed="true"]')).toHaveAccessibleName(
      `${firstName} is your favorite`,
    );

    await page.getByRole("button", { name: "Show new candidates" }).click();
    await expect(page.getByText("Candidate trial · Set 2", { exact: true })).toBeVisible();
    const secondCards = await expectStructuredCandidateCards(page);
    expect(await candidateBuildIds(secondCards)).not.toEqual(firstBuildIds);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(secondCards.locator('button[aria-pressed="true"]')).toHaveCount(0);
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({
      path: "test-results/evidence/candidate-lab-rerolled-desktop-125.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "Battle preparation" }).click();
    expect(await page.locator(".plan-summary").innerText()).toBe(planBeforeCandidates);
    await expect(page.locator("body")).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);
    await expectNoHorizontalPageScroll(page);

    await skipBattleToResult(page);
    const summary = page.getByRole("region", { name: "Battle summary" });
    await expect(summary).toContainText("Plan");
    await expect(summary).toContainText("Turning point");
    await expect(summary).toContainText("Battle result");
    for (const paragraph of await summary.locator("p").all()) {
      await expect(paragraph).toHaveText(/[.!?]$/);
    }
    await expect(page.getByRole("region", { name: "Aftermath" }).locator("p"))
      .toHaveText(/[.!?]$/);
    await expect(page.locator("body")).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);

    await confirmEquipment(page, "Heavy Pad");
    await page.getByRole("button", { name: "Next encounter" }).click();
    const equipment = page.getByRole("region", { name: "Front equipment" });
    await expect(equipment).toContainText(
      /Cy starts in the front slot with Guard \+18 and Speed -3 from Heavy Pad\./i,
    );
    await expect(equipment).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);
    await expect(page.locator("body")).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);
    failures.assertNone();
  });

  test("candidate entry, favorite selection, and new set are keyboard reachable", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);

    const candidateTrial = page.getByRole("button", { name: "Candidate trial" });
    await tabTo(page, candidateTrial);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Choose a future recruit" })).toBeVisible();

    const firstChoose = page.locator(".candidate-card").first().getByRole("button", {
      name: /^Choose /,
    });
    await tabTo(page, firstChoose, 60);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toContainText("Favorite recorded:");
    await expect(page.locator(".candidate-card").first().locator('button[aria-pressed="true"]'))
      .toHaveAccessibleName(/ is your favorite$/);

    const newSet = page.getByRole("button", { name: "Show new candidates" });
    await tabTo(page, newSet, 60);
    await page.keyboard.press("Enter");
    await expect(page.getByText("Candidate trial · Set 2", { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expectNoHorizontalPageScroll(page);
    failures.assertNone();
  });
});

test.describe("candidate draft mobile and reduced motion", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("system reduced motion keeps the full mobile candidate flow reachable", async ({ page }) => {
    const failures = collectPageFailures(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openFreshLab(page);
    await expect(page.getByRole("checkbox", { name: "Reduced motion" })).toBeChecked();
    await page.getByRole("button", { name: "Candidate trial" }).click();

    const cards = await expectStructuredCandidateCards(page);
    await expectNoHorizontalPageScroll(page);
    const thirdName = await cards.nth(2).getByRole("heading", { level: 2 }).innerText();
    await cards.nth(2).getByRole("button", { name: `Choose ${thirdName}` }).click();
    await expect(page.getByRole("status")).toContainText(`Favorite recorded: ${thirdName}.`);
    await page.screenshot({
      path: "test-results/evidence/candidate-lab-mobile-reduced.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "Show new candidates" }).click();
    await expect(page.getByText("Candidate trial · Set 2", { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expectNoHorizontalPageScroll(page);
    await expect(page.locator("body")).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);
    failures.assertNone();
  });
});
