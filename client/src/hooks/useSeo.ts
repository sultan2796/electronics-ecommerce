import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
}

const setMeta = (attribute: "name" | "property", key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

export function useSeo({ title, description, image, jsonLd }: SeoOptions) {
  const jsonText = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    const fullTitle = `${title} · ElectroShop`;
    document.title = fullTitle;
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:url", window.location.href);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
    if (image) setMeta("property", "og:image", image);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + window.location.pathname;

    const script = jsonText ? document.createElement("script") : null;
    if (script) {
      script.type = "application/ld+json";
      script.text = jsonText;
      document.head.appendChild(script);
    }
    return () => script?.remove();
  }, [title, description, image, jsonText]);
}
