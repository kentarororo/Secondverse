import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  collectPageFailures,
  expectNoHorizontalPageScroll,
  openFreshLab,
  tabTo,
} from "./helpers";

const FORBIDDEN_EQUIPMENT_PHRASE = /wears it in front/i;

async function candidateBuildIds(cards: Locator): Promise<string[]> {
  const ids: string[] = [];
  for (const card of await cards.all()) {
    const id = await card.getAttribute("data-build-id");
    if (!id) throw new Error("Candidate card is missing its stable build ID");
    ids.push(id);
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
    await expect(card.getByRole("region", { name: `${name} starting stats` })).toContainText(
      /Vitality.*Power.*Guard.*Speed.*Focus/i,
    );
    await expect(card.getByRole("region", { name: `${name} starting stats` })).toContainText(
      "Starting stats",
    );
    const tradeoffs = card.getByRole("region", { name: `${name} tradeoffs` });
    await expect(tradeoffs).toContainText("Advantage");
    await expect(tradeoffs).toContainText("Risk");
    const details = card.locator("details");
    await expect(details.getByText("Candidate details", { exact: true })).toBeVisible();
    await expect(details.getByRole("region", { name: `${name} candidate details` })).not.toBeVisible();
    await details.getByText("Candidate details", { exact: true }).click();
    await expect(details).toContainText("Growth clue");
    await expect(details).toContainText("Exact later growth is still unknown.");
    await expect(details).toContainText("Build fingerprint");
    await expect(details.getByText(/^Build ID [0-9a-f]{8}$/)).toBeVisible();
    await details.getByText("Candidate details", { exact: true }).click();
    await expect(card.getByRole("button", { name: new RegExp(`^Select ${name}$`) })).toBeVisible();

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

    await page.getByRole("button", { name: "Candidates" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Choose a fighter" }))
      .toBeVisible();
    await expect(page.getByText("Candidate set 1", { exact: true })).toBeVisible();
    await expect(page.getByText(/current team stays unchanged/i)).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/trial/i);
    const firstCards = await expectStructuredCandidateCards(page);
    const firstBuildIds = await candidateBuildIds(firstCards);
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({
      path: "test-results/evidence/candidate-lab-desktop-125.png",
      fullPage: true,
    });

    const firstName = await firstCards.first().getByRole("heading", { level: 2 }).innerText();
    const chooseFirst = firstCards.first().getByRole("button", {
      name: `Select ${firstName}`,
    });
    await chooseFirst.click();
    await expect(page.getByRole("status", { name: "Selected fighter" })).toContainText(
      `Selected exact build${firstName}`,
    );
    await expect(page.getByRole("status", { name: "Selected fighter" })).toContainText(
      "This exact build stays selected",
    );
    await expect(page.getByRole("button", { name: /trial/i })).toHaveCount(0);
    await expect(firstCards.first()).toHaveClass(/is-selected/);
    await expect(firstCards.first().locator('button[aria-pressed="true"]')).toHaveAccessibleName(
      `${firstName} selected`,
    );

    await page.getByRole("button", { name: "Show new candidates" }).click();
    await expect(page.getByText("Candidate set 2", { exact: true })).toBeVisible();
    const secondCards = await expectStructuredCandidateCards(page);
    expect(await candidateBuildIds(secondCards)).not.toEqual(firstBuildIds);
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(secondCards.locator('button[aria-pressed="true"]')).toHaveCount(0);
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({
      path: "test-results/evidence/candidate-lab-rerolled-desktop-125.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "Return to team preparation" }).click();
    expect(await page.locator(".plan-summary").innerText()).toBe(planBeforeCandidates);
    await expect(page.getByRole("navigation", { name: "Lab sections" })).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);
    await expectNoHorizontalPageScroll(page);
    failures.assertNone();
  });

  test("candidate entry, favorite selection, and new set are keyboard reachable", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);

    const candidates = page.getByRole("button", { name: "Candidates" });
    await tabTo(page, candidates);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { name: "Choose a fighter" })).toBeVisible();

    const firstChoose = page.locator(".candidate-card").first().getByRole("button", {
      name: /^Select /,
    });
    await tabTo(page, firstChoose, 60);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status", { name: "Selected fighter" })).toContainText(
      "Selected exact build",
    );
    await expect(page.locator(".candidate-card").first().locator('button[aria-pressed="true"]'))
      .toHaveAccessibleName(/ selected$/);

    const newSet = page.getByRole("button", { name: "Show new candidates" });
    await tabTo(page, newSet, 60);
    await page.keyboard.press("Enter");
    await expect(page.getByText("Candidate set 2", { exact: true })).toBeVisible();
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
    await page.getByRole("button", { name: "Candidates" }).click();

    const cards = await expectStructuredCandidateCards(page);
    await expectNoHorizontalPageScroll(page);
    const thirdName = await cards.nth(2).getByRole("heading", { level: 2 }).innerText();
    await cards.nth(2).getByRole("button", { name: `Select ${thirdName}` }).click();
    await expect(page.getByRole("status", { name: "Selected fighter" })).toContainText(
      `Selected exact build${thirdName}`,
    );
    await page.screenshot({
      path: "test-results/evidence/candidate-lab-mobile-reduced.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: "Show new candidates" }).click();
    await expect(page.getByText("Candidate set 2", { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toHaveCount(0);
    await expectNoHorizontalPageScroll(page);
    await expect(page.locator("body")).not.toContainText(FORBIDDEN_EQUIPMENT_PHRASE);
    failures.assertNone();
  });
});
