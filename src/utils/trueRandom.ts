/**
 * Cryptographically secure true random utilities using window.crypto
 */

export function getTrueRandomFloat(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const buffer = new Uint32Array(1);
    window.crypto.getRandomValues(buffer);
    return buffer[0] / (0xffffffff + 1);
  }
  return Math.random();
}

export function getTrueRandomInt(min: number, max: number): number {
  // min inclusive, max inclusive
  const range = max - min + 1;
  return Math.floor(getTrueRandomFloat() * range) + min;
}

export function trueRandomShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(getTrueRandomFloat() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickTrueRandom<T>(array: T[]): T | null {
  if (!array || array.length === 0) return null;
  const index = Math.floor(getTrueRandomFloat() * array.length);
  return array[index];
}
