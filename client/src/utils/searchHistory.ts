const KEY = "electroshop:search-history";
const LIMIT = 6;

export const readSearchHistory = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, LIMIT) : [];
  } catch {
    return [];
  }
};

export const rememberSearch = (query: string) => {
  const value = query.trim();
  if (value.length < 2) return readSearchHistory();
  const next = [value, ...readSearchHistory().filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, LIMIT);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    return next;
  }
  return next;
};

export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {
    return;
  }
};
