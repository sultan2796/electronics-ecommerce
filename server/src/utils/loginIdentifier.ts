export const USERNAME_DOMAIN = "admin.local";

export const loginIdentifierToEmail = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized.includes("@") ? normalized : `${normalized}@${USERNAME_DOMAIN}`;
};
