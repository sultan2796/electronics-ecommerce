export const passwordProblems = (password: string) => {
  const problems: string[] = [];
  if (password.length < 8) problems.push("ən az 8 simvol olmalıdır");
  if (password.length > 128) problems.push("128 simvoldan uzun olmamalıdır");
  return problems;
};

export const passwordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
};
