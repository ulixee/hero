export function pickRandom<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

export default { pickRandom };
