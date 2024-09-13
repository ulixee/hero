export function average(numbers: number[]): number {
  if (!numbers.length) return 0;
  return Math.floor(numbers.reduce((t, c) => t + c, 0) / numbers.length);
}
