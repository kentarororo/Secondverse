import { expect, test, type Page } from "@playwright/test";
import {
  collectPageFailures,
  expectNoHorizontalPageScroll,
  openFreshLab,
} from "./helpers";

async function selectCandidateAndStart(page: Page, index = 0): Promise<string> {
  await page.getByRole("button", { name: "Candidate trial" }).click();
  const card = page.locator(".candidate-card").nth(index);
  const name = await card.getByRole("heading", { level: 2 }).innerText();
  await card.getByRole("button", { name: `Select ${name}` }).click();
  await page.getByRole("button", { name: `Start ${name}'s trial` }).click();
  return name;
}

test.describe("fielded candidate trial", () => {
  test.use({ viewport: { width: 1365, height: 768 } });

  test("selected candidate reaches a battlefield and exact kit report", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);
    const name = await selectCandidateAndStart(page);

    await expect(page.getByRole("heading", { name: `${name}'s battle trial` })).toBeVisible();
    const battlefield = page.getByRole("region", { name: "Candidate trial battlefield" });
    await expect(battlefield.locator(".candidate-trial-unit")).toHaveCount(6);
    await expect(battlefield.locator(".candidate-trial-unit.is-candidate")).toHaveCount(1);
    await expect(battlefield.locator("[data-visual-profile]")).toHaveCount(1);
    await expect(page.getByText(/A round ends after every living fighter has one action/i)).toBeVisible();
    await expect(page.getByRole("region", { name: "Current trial moment" })).toContainText(
      "Key moment 1 of",
    );
    await expect(page.getByRole("heading", { name: "Rule tracker" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Round 0/i);
    await expectNoHorizontalPageScroll(page);

    await page.getByRole("button", { name: "Skip to trial result" }).click();
    await expect(page.getByRole("heading", { name: /Trial result: (Win|Loss|Draw)/ })).toBeFocused();
    const report = page.getByRole("region", { name: `What ${name}'s kit did` });
    await expect(report.locator(".candidate-trial-rule-result")).toHaveCount(3);
    await expect(report).toContainText("Signature");
    await expect(report).toContainText("Advantage");
    await expect(report).toContainText("Risk");
    await expect(report).toContainText(/Triggered \d+ (time|times)|required action|threshold|did not reach/i);
    await expect(report).toContainText("Combat outcome:");
    await expect(page.getByText("How starting stats became battle values")).toBeVisible();
    await expect(page.locator("details.candidate-trial-details")).not.toHaveAttribute("open", "");
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({
      path: "test-results/evidence/candidate-trial-result-desktop.png",
      fullPage: true,
    });
    failures.assertNone();
  });

  test("reduced-motion key moments complete without the raw details log", async ({ page }) => {
    test.setTimeout(45_000);
    const failures = collectPageFailures(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openFreshLab(page);
    await selectCandidateAndStart(page, 1);

    await expect(page.getByRole("checkbox", { name: "Reduced motion" })).toBeChecked();
    await expect(page.getByRole("heading", { name: /Trial result: (Win|Loss|Draw)/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("details.candidate-trial-details")).not.toHaveAttribute("open", "");
    failures.assertNone();
  });
});

test.describe("fielded candidate trial mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the selection, battlefield, and result remain reachable without horizontal scroll", async ({ page }) => {
    const failures = collectPageFailures(page);
    await openFreshLab(page);
    const name = await selectCandidateAndStart(page, 2);

    await expect(page.getByRole("heading", { name: `${name}'s battle trial` })).toBeVisible();
    await expect(page.getByRole("region", { name: "Candidate trial battlefield" })).toBeVisible();
    await expectNoHorizontalPageScroll(page);

    const ribbon = page.locator(".candidate-trial-ribbon");
    await expect(ribbon).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Pause trial" }).click();
    const ribbonBox = await ribbon.boundingBox();
    const unitBoxes = await page.locator(".candidate-trial-unit").evaluateAll((units) =>
      units.map((unit) => {
        const box = unit.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      }),
    );
    expect(ribbonBox).not.toBeNull();
    for (const unitBox of unitBoxes) {
      const overlaps = ribbonBox !== null &&
        ribbonBox.x < unitBox.right && ribbonBox.x + ribbonBox.width > unitBox.left &&
        ribbonBox.y < unitBox.bottom && ribbonBox.y + ribbonBox.height > unitBox.top;
      expect(overlaps).toBe(false);
    }

    await page.getByRole("button", { name: "Skip to trial result" }).click();
    await expect(page.getByRole("region", { name: `What ${name}'s kit did` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Keep ${name} selected` })).toBeVisible();
    await expectNoHorizontalPageScroll(page);
    await page.screenshot({
      path: "test-results/evidence/candidate-trial-result-mobile.png",
      fullPage: true,
    });
    failures.assertNone();
  });
});
