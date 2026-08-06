import { expect, type Locator, type Page } from "@playwright/test";

export const COMBAT_LAB_SAVE_KEY = "anotherverse.combat-lab.v1";
export type EquipmentName = "Heavy Pad" | "Quick Shoes";

export interface FailureCollector {
  readonly messages: string[];
  assertNone(): void;
}

export function collectPageFailures(page: Page): FailureCollector {
  const messages: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") messages.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => {
    messages.push(
      `requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
    );
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && new URL(response.url()).origin === "http://127.0.0.1:4173") {
      messages.push(`response: ${response.status()} ${response.url()}`);
    }
  });

  return {
    messages,
    assertNone: () => expect(messages, "unexpected browser or same-origin request failures").toEqual([]),
  };
}

export async function openFreshLab(page: Page, path = "./"): Promise<void> {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#root").locator(":scope > *")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

export async function skipBattleToResult(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Start battle" }).click();
  await expect(page.getByRole("button", { name: "Skip to result" })).toBeVisible();
  await page.getByRole("button", { name: "Skip to result" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Result:/ })).toBeVisible();
}

export async function confirmEquipment(page: Page, name: EquipmentName): Promise<void> {
  const reward = page.getByRole("region", { name: "Choose front equipment" });
  await expect(reward).toBeVisible();
  await page.getByRole("radio", { name: new RegExp(name, "i") }).check();
  const confirm = page.getByRole("button", { name: "Confirm equipment" });
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByRole("status")).toContainText(`${name} is ready for the front slot.`);
  await expect(page.getByRole("button", { name: "Next encounter" })).toBeEnabled();
}

export async function reachPunishPreparation(
  page: Page,
  equipment: EquipmentName,
): Promise<void> {
  await skipBattleToResult(page);
  await confirmEquipment(page, equipment);
  await page.getByRole("button", { name: "Next encounter" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Punish the Front" })).toBeVisible();
}

export async function waitForRenderedLab(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#root").locator(":scope > *")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
}

export async function tabTo(page: Page, target: Locator, limit = 40): Promise<void> {
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(`Keyboard focus did not reach target within ${limit} Tab presses.`);
}

export async function expectNoHorizontalPageScroll(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

export async function expectMinimumTarget(locator: Locator): Promise<void> {
  const box = await locator.boundingBox();
  expect(box, "target must have a rendered box").not.toBeNull();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

export async function expectNoOverlap(
  first: Locator,
  second: Locator,
  message: string,
): Promise<void> {
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(firstBox, `${message}: first element must have a rendered box`).not.toBeNull();
  expect(secondBox, `${message}: second element must have a rendered box`).not.toBeNull();
  if (!firstBox || !secondBox) return;
  const intersects =
    firstBox.x < secondBox.x + secondBox.width &&
    firstBox.x + firstBox.width > secondBox.x &&
    firstBox.y < secondBox.y + secondBox.height &&
    firstBox.y + firstBox.height > secondBox.y;
  expect(intersects, message).toBe(false);
}
