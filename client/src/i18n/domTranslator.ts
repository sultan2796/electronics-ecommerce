import { monthRows, phraseRows } from "./phrases";
import type { Locale } from "./dictionary";

type Target = "ru" | "en";

const exact: Record<Target, Map<string, string>> = { ru: new Map(), en: new Map() };
const patterns: Record<Target, { regex: RegExp; template: string }[]> = { ru: [], en: [] };
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

for (const [az, ru, en] of phraseRows) {
  if (az.includes("{}")) {
    const regex = new RegExp(`^${az.split("{}").map(escape).join("(.+?)")}$`);
    patterns.ru.push({ regex, template: ru });
    patterns.en.push({ regex, template: en });
  } else {
    exact.ru.set(az, ru);
    exact.en.set(az, en);
  }
}
patterns.ru.sort((a, b) => b.regex.source.length - a.regex.source.length);
patterns.en.sort((a, b) => b.regex.source.length - a.regex.source.length);

const monthRegex = new RegExp(`(\\d{1,2}) (${monthRows.map(([az]) => az).join("|")})\\b`, "g");

const fill = (template: string, values: string[]) => {
  let index = 0;
  return template.replace(/\{\}/g, () => values[index++] ?? "");
};

export const translatePhrase = (text: string, locale: Locale): string => {
  if (locale === "az") return text;
  const trimmed = text.trim();
  if (!trimmed || !/[A-Za-zƏəĞğİıÖöŞşÜüÇç]/.test(trimmed)) return text;
  const lead = text.slice(0, text.indexOf(trimmed));
  const tail = text.slice(lead.length + trimmed.length);
  const direct = exact[locale].get(trimmed);
  if (direct !== undefined) return lead + direct + tail;
  for (const { regex, template } of patterns[locale]) {
    const match = trimmed.match(regex);
    if (match) return lead + fill(template, match.slice(1).map((part) => translatePhrase(part, locale))) + tail;
  }
  const column = locale === "ru" ? 1 : 2;
  const dated = trimmed.replace(monthRegex, (_, day: string, month: string) => {
    const row = monthRows.find(([az]) => az === month);
    return `${day} ${row ? row[column] : month}`;
  });
  return dated === trimmed ? text : lead + dated + tail;
};

const ATTRIBUTES = ["placeholder", "aria-label", "title"] as const;
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE", "NOSCRIPT"]);

const textSource = new WeakMap<Text, string>();
const textApplied = new WeakMap<Text, string>();
const attrSource = new WeakMap<Element, Map<string, string>>();

let current: Locale = "az";
let observer: MutationObserver | null = null;

const skipped = (element: Element | null) => {
  for (let node = element; node; node = node.parentElement) {
    if (SKIP.has(node.tagName) || node.getAttribute("translate") === "no") return true;
  }
  return false;
};

const translateText = (node: Text) => {
  const value = node.nodeValue ?? "";
  if (textApplied.get(node) === value) {
    const source = textSource.get(node) ?? value;
    const next = translatePhrase(source, current);
    if (next !== value) {
      textApplied.set(node, next);
      node.nodeValue = next;
    }
    return;
  }
  if (skipped(node.parentElement)) return;
  textSource.set(node, value);
  const next = translatePhrase(value, current);
  textApplied.set(node, next);
  if (next !== value) node.nodeValue = next;
};

const translateAttributes = (element: Element) => {
  if (skipped(element)) return;
  let sources = attrSource.get(element);
  for (const name of ATTRIBUTES) {
    const value = element.getAttribute(name);
    if (value === null) continue;
    if (!sources) {
      sources = new Map();
      attrSource.set(element, sources);
    }
    const known = sources.get(name);
    const source = known !== undefined && translatePhrase(known, current) === value ? known : value;
    sources.set(name, source);
    const next = translatePhrase(source, current);
    if (next !== value) element.setAttribute(name, next);
  }
};

const walk = (root: Node) => {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) {
    if (SKIP.has((root as Element).tagName)) return;
    translateAttributes(root as Element);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text);
    else translateAttributes(node as Element);
  }
};

const translateTitle = () => {
  const title = document.title;
  const source = document.documentElement.dataset.titleSource;
  const base = source && translatePhrase(source, current) === title ? source : title;
  document.documentElement.dataset.titleSource = base;
  const next = base
    .split(" · ")
    .map((part) => translatePhrase(part, current))
    .join(" · ");
  if (next !== title) document.title = next;
};

export const setTranslatorLocale = (locale: Locale) => {
  current = locale;
  if (typeof document === "undefined") return;
  if (!observer) {
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") translateText(mutation.target as Text);
        else if (mutation.type === "attributes") translateAttributes(mutation.target as Element);
        else mutation.addedNodes.forEach(walk);
        if (mutation.target.nodeName === "TITLE" || mutation.target.parentNode?.nodeName === "TITLE") translateTitle();
      }
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...ATTRIBUTES],
    });
  }
  walk(document.body);
  translateTitle();
};
