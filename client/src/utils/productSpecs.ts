import type { Locale } from "../i18n/dictionary";
import { Product, TechSpecification } from "../types";
import { formatStorage } from "./format";

const units = {
  az: { month: "ay", year: "il", week: "həftə", day: "gün" },
  ru: { month: "мес.", year: "г.", week: "нед.", day: "дн." },
  en: { month: "month(s)", year: "year(s)", week: "week(s)", day: "day(s)" },
} as const;

export const translatePolicy = (value: string | null | undefined, locale: Locale): string | null => {
  if (!value) return null;
  const text = value.trim();
  if (locale === "en") return text;
  const u = units[locale];
  const az = locale === "az";
  let match: RegExpMatchArray | null;
  if (/^lifetime warranty$/i.test(text)) return az ? "Ömürlük zəmanət" : "Пожизненная гарантия";
  if (/^no warranty$/i.test(text)) return az ? "Zəmanət yoxdur" : "Без гарантии";
  if ((match = text.match(/^(\d+) (month|year|week)s? warranty$/i))) {
    return az ? `${match[1]} ${u[match[2].toLowerCase() as "month"]} zəmanət` : `Гарантия ${match[1]} ${u[match[2].toLowerCase() as "month"]}`;
  }
  if (/^ships overnight$/i.test(text)) return az ? "Növbəti gün göndərilir" : "Отправка на следующий день";
  if ((match = text.match(/^ships in (\d+)-(\d+) business days$/i))) {
    return az ? `${match[1]}-${match[2]} iş günü ərzində göndərilir` : `Отправка за ${match[1]}–${match[2]} рабочих дня`;
  }
  if ((match = text.match(/^ships in (\d+) (week|month)s?$/i))) {
    return az ? `${match[1]} ${u[match[2].toLowerCase() as "week"]} ərzində göndərilir` : `Отправка в течение ${match[1]} ${u[match[2].toLowerCase() as "week"]}`;
  }
  if (/^no return policy$/i.test(text)) return az ? "Qaytarılma mümkün deyil" : "Возврат не предусмотрен";
  if ((match = text.match(/^(\d+) days return policy$/i))) return az ? `${match[1]} gün ərzində qaytarılma` : `Возврат в течение ${match[1]} дн.`;
  return text;
};

const round = (value: number) => Math.round(value * 10) / 10;

export interface SpecGroup {
  title: string;
  rows: [string, string][];
}

export const productSpecGroups = (product: Product, locale: Locale): SpecGroup[] => {
  const specs: TechSpecification | null = product.specs;
  const extra = specs?.extra ?? null;
  const technical: [string, string | null][] = specs
    ? [
        ["Prosessor (CPU)", specs.cpu],
        ["Qrafik (GPU)", specs.gpu],
        ["Operativ yaddaş", specs.ramGb ? `${specs.ramGb} GB` : null],
        ["Daxili yaddaş", specs.storageGb ? `${formatStorage(specs.storageGb)} ${specs.storageType ?? ""}`.trim() : null],
        ["Ekran", specs.screenSizeInch ? `${Number(specs.screenSizeInch)}″` : null],
        ["Ölçü (piksel)", specs.resolution],
        ["Yenilənmə tezliyi", specs.refreshRateHz ? `${specs.refreshRateHz} Hz` : null],
        ["Batareya", specs.batteryMah ? `${specs.batteryMah} mAh` : null],
        ["Əməliyyat sistemi", specs.os],
        ["Bağlantı", specs.connectivity.length ? specs.connectivity.join(", ") : null],
      ]
    : [];

  const dims = extra?.dimensions;
  const length = extra?.lengthCm ?? null;
  const width = extra?.widthCm ?? (dims ? dims.width : null);
  const height = extra?.heightCm ?? (dims ? dims.height : null);
  const depth = dims ? dims.depth : null;
  const physical: [string, string | null][] = [
    ["Rəng", extra?.color ?? null],
    ["Material", extra?.material ?? null],
    ["Ölçülər (E × H × D)", width && height && depth ? `${round(width)} × ${round(height)} × ${round(depth)} sm` : null],
    ["Uzunluq", length ? `${round(length)} sm` : null],
    ["En", width ? `${round(width)} sm` : null],
    ["Hündürlük", height ? `${round(height)} sm` : null],
    ["Dərinlik", depth ? `${round(depth)} sm` : null],
    ["Çəki", specs?.weightGrams ? `${specs.weightGrams} q` : null],
  ];

  const service: [string, string | null][] = [
    ["Zəmanət", translatePolicy(extra?.warranty, locale)],
    ["Çatdırılma", translatePolicy(extra?.shipping, locale)],
    ["Qaytarılma", translatePolicy(extra?.returnPolicy, locale)],
  ];

  const general: [string, string | null][] = [
    ["Brend", product.brand],
    ["Kateqoriya", product.category?.name ?? null],
    ["SKU", product.sku],
  ];

  const clean = (rows: [string, string | null][]) => rows.filter((row): row is [string, string] => Boolean(row[1]));
  return [
    { title: "Əsas məlumatlar", rows: clean(general) },
    { title: "Texniki göstəricilər", rows: clean(technical) },
    { title: "Ölçü və görünüş", rows: clean(physical) },
    { title: "Zəmanət və çatdırılma", rows: clean(service) },
  ].filter((group) => group.rows.length > 0);
};
