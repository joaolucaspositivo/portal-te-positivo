import DOMPurify from "dompurify";

export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html; // SSR fallback; rendered client-side
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "code", "pre",
      "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
  });
}