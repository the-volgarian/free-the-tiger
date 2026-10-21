export function shuffle(items: readonly number[]): number[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    const currentNumber = shuffled[i];
    shuffled[i] = shuffled[randomIndex];
    shuffled[randomIndex] = currentNumber;
  }

  return shuffled;
}