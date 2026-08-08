import { expect, test, type Page } from "@playwright/test";
import {
  collectPageFailures,
  expectNoHorizontalPageScroll,
  openFreshLab,
} from "./helpers";

test.use({ viewport: { width: 1365, height: 768 } });

function momentHeading(page: Page) {
  return page.locator(".current-moment-card .moment-heading-row strong");
}

function momentCount(text: string): number {
  const match = text.match(/(?:Key moment|Moment) \d+ of (\d+)/);
  if (!match) throw new Error(`Missing moment count in: ${text}`);
  return Number(match[1]);
}

async function exactEventsText(page: Page): Promise<string> {
  await expect(page.getByRole("heading", { name: "Battle details" })).toHaveCount(0);
  await page.getByRole("button", { name: "Battle details" }).click();
  const inspector = page.getByRole("complementary", { name: "Battle details" });
  await expect(inspector).toBeVisible();
  const text = await inspector.innerText();
  await page.getByRole("button", { name: "Close battle details" }).click();
  return text;
}

async function chooseKeyMomentStances(page: Page): Promise<void> {
  await page.locator('[data-plan-hero="ada"]').click();
  await page.getByRole("radio", { name: /Brace early.*gains 18 guard/i }).check();
  await page.locator('[data-plan-hero="bo"]').click();
  await page.getByRole("radio", { name: /Finish weak.*weakest enemy/i }).check();
  await page.locator('[data-plan-hero="cy"]').click();
  await page.getByRole("radio", { name: /Aid two.*up to two injured allies/i }).check();
}

test("focused Key moments keeps every raw event available without changing the outcome", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await page.getByRole("button", { name: "Start battle" }).click();

  await expect(page.getByRole("button", { name: "Key moments" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Every action" })).toHaveCount(0);
  await expect(page.getByText(/A round ends after every living fighter has one action/i)).toBeVisible();
  await page.getByRole("button", { name: "Pause battle" }).click();

  const firstKeyHeading = await momentHeading(page).innerText();
  expect(firstKeyHeading).toMatch(/^Key moment 1 of \d+$/);
  const keyCount = momentCount(firstKeyHeading);
  const initialDetails = await exactEventsText(page);
  const rawEventCount = (initialDetails.match(/event-\d{4}/g) ?? []).length;
  expect(rawEventCount).toBeGreaterThan(keyCount);
  await expect(page.locator(".current-moment-card .moment-chain")).toHaveAttribute(
    "aria-label",
    /.+\..+\./,
  );

  const initialMoment = await momentHeading(page).innerText();
  const startedAt = Date.now();
  await page.getByRole("button", { name: "Resume battle" }).click();
  await expect.poll(() => momentHeading(page).innerText(), { timeout: 5_000 })
    .not.toBe(initialMoment);
  const firstHoldMs = Date.now() - startedAt;
  expect(firstHoldMs).toBeGreaterThanOrEqual(1_750);
  await page.getByRole("button", { name: "Pause battle" }).click();
  expect(await momentHeading(page).innerText()).not.toBe(firstKeyHeading);

  await page.getByRole("button", { name: "Skip to result" }).click();
  const keyOutcome = await page.getByRole("region", { name: "Battle totals" }).innerText();
  const keyEvents = await exactEventsText(page);
  expect(await page.getByRole("complementary", { name: "Battle details" }).count()).toBe(0);
  expect((keyEvents.match(/event-\d{4}/g) ?? []).length).toBe(rawEventCount);

  await page.getByRole("button", { name: "Change plan and replay" }).click();
  await page.getByRole("button", { name: "Start battle" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
  expect(await page.getByRole("region", { name: "Battle totals" }).innerText()).toBe(keyOutcome);
  expect(await exactEventsText(page)).toBe(keyEvents);
  failures.assertNone();
});

test("plan tracker keeps all three chosen stances visible through routine compression and activation", async ({
  page,
}) => {
  test.setTimeout(75_000);
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await chooseKeyMomentStances(page);
  await expect(page.locator(".stance-summary")).toContainText(
    "Stances: Ada — Brace early; Bo — Finish weak; Cy — Aid two.",
  );
  await page.screenshot({
    path: "test-results/evidence/key-moments-setup-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Start battle" }).click();
  const tracker = page.getByRole("region", { name: "Your plan in action" });
  await expect(tracker.locator(".plan-track-item")).toHaveCount(3);
  for (const [name, stance] of [
    ["Ada", "Brace early"],
    ["Bo", "Finish weak"],
    ["Cy", "Aid two"],
  ] as const) {
    const item = tracker.locator(".plan-track-item").filter({ hasText: name });
    await expect(item).toContainText(stance);
    await expect(item).toContainText(/Not used yet|Ready/);
  }
  await expect(page.getByRole("heading", { name: "Battle details" })).toHaveCount(0);
  await page.getByRole("button", { name: "2x" }).click();

  await page.waitForFunction(() => {
    const routine = document.querySelector(".routine-advance");
    const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Pause battle",
    );
    if (!routine || !pause) return false;
    pause.click();
    return true;
  });
  await expect(page.locator(".routine-advance")).toContainText(/\d+ routine actions? (?:has|have) passed\./);
  await expect(page.locator(".current-moment-card .moment-chain")).toHaveAttribute(
    "aria-label",
    /.+\..+\./,
  );
  await page.screenshot({
    path: "test-results/evidence/key-moments-routine-advance-desktop.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Resume battle" }).click();
  await page.waitForFunction(() => {
    const activated = document.querySelectorAll(".plan-track-item.state-activated");
    const pause = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
      (button) => button.textContent?.trim() === "Pause battle",
    );
    if (activated.length !== 3 || !pause) return false;
    pause.click();
    return true;
  });
  await expect(tracker.locator(".plan-track-item.state-activated")).toHaveCount(3);

  const ada = tracker.locator(".plan-track-item").filter({ hasText: "Ada" });
  await expect(ada).toContainText(/Brace early.*Used in round \d+.*Gains 18 Guard and spends 2 Points.*Guard \+18/i);
  const bo = tracker.locator(".plan-track-item").filter({ hasText: "Bo" });
  await expect(bo).toContainText(/Finish weak.*Used in round \d+.*Heavy Hit against the weakest enemy and spends 2 Points.*HP −\d+/i);
  const cy = tracker.locator(".plan-track-item").filter({ hasText: "Cy" });
  await expect(cy).toContainText(/Aid two.*Used in round \d+.*Restores 16 HP to each of up to two allies and spends 3 Points.*HP \+\d+/i);
  await expect(page.locator(".current-moment-card .moment-chain")).toHaveAttribute(
    "aria-label",
    /Brace early|Finish weak|Aid two/,
  );
  await expectNoHorizontalPageScroll(page);
  await page.screenshot({
    path: "test-results/evidence/key-moments-stance-tracker-desktop.png",
    fullPage: true,
  });
  failures.assertNone();
});

test("in-app reduced motion preserves moment facts, reading hold, and authoritative outcome", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const failures = collectPageFailures(page);
  await openFreshLab(page);
  await page.getByRole("button", { name: "Start battle" }).click();
  await page.getByRole("button", { name: "Skip to result" }).click();
  const normalOutcome = await page.getByRole("region", { name: "Battle totals" }).innerText();

  await page.getByRole("button", { name: "Change plan and replay" }).click();
  await page.getByRole("checkbox", { name: "Reduced motion" }).check();
  await page.getByRole("button", { name: "Start battle" }).click();
  await expect(page.locator(".battle-screen")).toHaveClass(/reduce-motion/);
  const firstMoment = await momentHeading(page).innerText();
  const startedAt = Date.now();
  await expect.poll(() => momentHeading(page).innerText(), { timeout: 5_000 })
    .not.toBe(firstMoment);
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1_550);
  await page.getByRole("button", { name: "Pause battle" }).click();
  await expect(page.locator(".current-moment-card .moment-chain")).toHaveAttribute(
    "aria-label",
    /.+\..+\./,
  );
  await expect(page.getByRole("region", { name: "Your plan in action" }).locator(".plan-track-item"))
    .toHaveCount(3);
  await page.screenshot({
    path: "test-results/evidence/key-moments-reduced-motion-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Skip to result" }).click();
  expect(await page.getByRole("region", { name: "Battle totals" }).innerText())
    .toBe(normalOutcome);
  failures.assertNone();
});
