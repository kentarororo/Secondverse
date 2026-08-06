export const RNG_STREAM_NAMES = ["initiative", "damage"] as const;
export type RngStreamName = (typeof RNG_STREAM_NAMES)[number];

export interface DeterministicRng {
  readonly name: RngStreamName;
  nextUint32(): number;
  nextIntInclusive(min: number, max: number): number;
}

function hashText(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return hash >>> 0;
}

export function createRngStream(seed: string, name: RngStreamName): DeterministicRng {
  let state = hashText(`${name}:${seed}`) || 0x6d2b79f5;

  const nextUint32 = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };

  return {
    name,
    nextUint32,
    nextIntInclusive(min: number, max: number): number {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
        throw new RangeError(`Invalid integer range ${min}..${max}`);
      }

      const span = max - min + 1;
      return min + (nextUint32() % span);
    },
  };
}
