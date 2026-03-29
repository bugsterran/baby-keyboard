export const GAME = {
  totalRounds: 10,
  timeLimit: 60,
};

export function generateProblems(count) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 8) + 2; // 2~9
    const b = Math.floor(Math.random() * 8) + 2;
    problems.push({ a, b, answer: a * b });
  }
  return problems;
}
