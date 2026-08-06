import { describe, expect, it } from "vitest";
import { createRngStream } from "../../src/sim";

describe("named random streams", () => {
  it("reproduces a stream from seed and name", () => {
    const first = createRngStream("same-seed", "damage");
    const second = createRngStream("same-seed", "damage");
    expect(Array.from({ length: 8 }, () => first.nextUint32())).toEqual(
      Array.from({ length: 8 }, () => second.nextUint32()),
    );
  });

  it("separates streams with the same seed", () => {
    const initiative = createRngStream("same-seed", "initiative");
    const damage = createRngStream("same-seed", "damage");
    expect(initiative.nextUint32()).not.toBe(damage.nextUint32());
  });
});
