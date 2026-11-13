export const isSafeUrl = (value: string) => {
  if (/[\\\s\u0000-\u001f]/.test(value)) return false;
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};
