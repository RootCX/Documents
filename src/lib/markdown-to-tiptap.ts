import { Marked } from "marked";

const marked = new Marked({ gfm: true, breaks: false });

export function isTiptapJson(content: unknown): boolean {
  return (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    (content as Record<string, unknown>).type === "doc"
  );
}

export function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}
