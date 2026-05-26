import DOMPurify from "dompurify";
import { describe, expect, it } from "vitest";

const ALLOWED_TAGS = [
  "p", "h1", "h2", "h3", "pre", "code", "img", "a", "ul", "ol", "li",
  "blockquote", "strong", "em", "table", "thead", "tbody", "tr", "td",
];
const ALLOWED_ATTR = ["href", "src", "alt", "class", "target", "rel"];

function sanitize(html: string) {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, });
}

describe("Frontend DOMPurify sanitize", () => {
  it("script etiketini kaldırır", () => {
    const result = sanitize("<script>alert('xss')</script>");
    expect(result).not.toContain("<script");
  });

  it("onerror attribute'unu kaldırır", () => {
    const result = sanitize('<img src=x onerror=alert(1)>');
    expect(result).not.toContain("onerror");
  });

  it("javascript: URL'ini kaldırır", () => {
    const result = sanitize('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("izin verilen etiketleri korur", () => {
    const result = sanitize("<p>Merhaba <strong>dünya</strong></p>");
    expect(result).toContain("<p>");
    expect(result).toContain("<strong>");
  });

  it("boş string ile çalışır", () => {
    expect(sanitize("")).toBe("");
  });
});
