import { currentLocale, Locale } from "../config/locale";
import { categoryTranslations, productTranslations } from "../data/productTranslations";

type Localized = { name?: string; description?: string };

const extraTranslation = (specs: unknown, locale: Locale): Localized | undefined => {
  const extra = (specs as { extra?: { translations?: Record<string, Localized> } } | null | undefined)?.extra;
  return extra?.translations?.[locale];
};

export const localizeCategory = <T extends { slug: string; name: string }>(category: T, locale: Locale = currentLocale()): T => {
  if (locale === "az") return category;
  const translated = categoryTranslations[category.slug]?.[locale];
  return translated ? { ...category, name: translated } : category;
};

export const localizeProduct = <
  T extends { sku?: string; name?: string; description?: string; specs?: unknown; category?: { slug: string; name: string } | null },
>(
  product: T,
  locale: Locale = currentLocale(),
): T => {
  const fromAdmin = extraTranslation(product.specs, locale);
  const builtIn = locale === "en" || !product.sku ? undefined : productTranslations[product.sku];
  const name = fromAdmin?.name ?? (locale === "en" ? undefined : builtIn?.name?.[locale]);
  const description = fromAdmin?.description ?? (locale === "en" ? undefined : builtIn?.description[locale]);
  return {
    ...product,
    ...(name && { name }),
    ...(description && { description }),
    ...(product.category && { category: localizeCategory(product.category, locale) }),
  };
};
