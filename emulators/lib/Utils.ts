export function pickRandom<T>(array: T[]) {
  if (!array.length) throw new Error('Empty array provided to "pickRandom"');
  return array[Math.floor(Math.random() * array.length)];
}

export default { pickRandom };
