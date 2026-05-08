import type { JSONContent } from "@tiptap/react";

// ─── Markdown Export ───────────────────────────────────────────────────────────

export function documentToMarkdown(content: JSONContent | null): string {
  if (!content || !content.content) return "";
  return content.content.map((node) => blockToMarkdown(node, 0)).join("\n");
}

function blockToMarkdown(node: JSONContent, depth: number): string {
  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level ?? 1;
      const prefix = "#".repeat(level);
      return `${prefix} ${inlineToMarkdown(node.content)}\n`;
    }
    case "paragraph":
      return `${inlineToMarkdown(node.content)}\n`;
    case "bulletList":
      return (node.content ?? []).map((li) => listItemToMarkdown(li, depth, "- ")).join("");
    case "orderedList":
      return (node.content ?? []).map((li, i) => listItemToMarkdown(li, depth, `${i + 1}. `)).join("");
    case "taskList":
      return (node.content ?? []).map((li) => blockToMarkdown(li, depth)).join("");
    case "taskItem": {
      const checked = node.attrs?.checked ? "[x]" : "[ ]";
      const text = (node.content ?? []).map((c) => inlineToMarkdown(c.content)).join("");
      return `${"  ".repeat(depth)}- ${checked} ${text}\n`;
    }
    case "codeBlock": {
      const lang = node.attrs?.language ?? "";
      const code = node.content?.map((c) => c.text ?? "").join("") ?? "";
      return `\`\`\`${lang}\n${code}\n\`\`\`\n`;
    }
    case "blockquote":
      return (node.content ?? []).map((c) => `> ${blockToMarkdown(c, depth).trim()}`).join("\n") + "\n";
    case "horizontalRule":
      return "---\n";
    case "image":
      return `![${node.attrs?.alt ?? ""}](${node.attrs?.src ?? ""})\n`;
    default:
      return inlineToMarkdown(node.content) + "\n";
  }
}

function listItemToMarkdown(li: JSONContent, depth: number, prefix: string): string {
  const parts = li.content ?? [];
  const firstLine = parts[0] ? inlineToMarkdown(parts[0].content) : "";
  let result = `${"  ".repeat(depth)}${prefix}${firstLine}\n`;
  for (let i = 1; i < parts.length; i++) {
    result += blockToMarkdown(parts[i], depth + 1);
  }
  return result;
}

function inlineToMarkdown(content?: JSONContent[]): string {
  if (!content) return "";
  return content.map((node) => {
    if (node.type === "text") {
      let text = node.text ?? "";
      const marks = node.marks ?? [];
      for (const mark of marks) {
        switch (mark.type) {
          case "bold": text = `**${text}**`; break;
          case "italic": text = `*${text}*`; break;
          case "strike": text = `~~${text}~~`; break;
          case "code": text = `\`${text}\``; break;
          case "link": text = `[${text}](${mark.attrs?.href ?? ""})`; break;
        }
      }
      return text;
    }
    return "";
  }).join("");
}

// ─── HTML Export ───────────────────────────────────────────────────────────────

export function documentToHtml(title: string, content: JSONContent | null): string {
  if (!content || !content.content) return wrapHtml(title, "");
  const body = content.content.map((node) => blockToHtml(node)).join("\n");
  return wrapHtml(title, body);
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Source+Code+Pro:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
  h1 { font-size: 2.25em; font-weight: 700; margin-top: 1.5em; }
  h2 { font-size: 1.75em; font-weight: 600; margin-top: 1.25em; }
  h3 { font-size: 1.375em; font-weight: 600; margin-top: 1em; }
  pre { background: #f5f5f5; padding: 1em; border-radius: 6px; overflow-x: auto; font-family: 'Source Code Pro', monospace; }
  code { background: #f5f5f5; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.875em; font-family: 'Source Code Pro', monospace; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #ddd; padding-left: 1em; margin-left: 0; color: #666; font-style: italic; }
  img { max-width: 100%; border-radius: 6px; }
  hr { border: none; border-top: 1px solid #ddd; margin: 2em 0; }
  ul.task-list { list-style: none; padding-left: 0; }
  ul.task-list li { display: flex; align-items: baseline; gap: 0.5em; }
  ul.task-list input { margin: 0; }
  a { color: #2563eb; }
  @media print { body { margin: 0; max-width: none; } }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${body}
</body>
</html>`;
}

function blockToHtml(node: JSONContent): string {
  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level ?? 1;
      return `<h${level}>${inlineToHtml(node.content)}</h${level}>`;
    }
    case "paragraph":
      return `<p>${inlineToHtml(node.content)}</p>`;
    case "bulletList":
      return `<ul>${(node.content ?? []).map((li) => `<li>${(li.content ?? []).map(blockToHtml).join("")}</li>`).join("")}</ul>`;
    case "orderedList":
      return `<ol>${(node.content ?? []).map((li) => `<li>${(li.content ?? []).map(blockToHtml).join("")}</li>`).join("")}</ol>`;
    case "taskList":
      return `<ul class="task-list">${(node.content ?? []).map((li) => {
        const checked = li.attrs?.checked ? "checked" : "";
        const text = (li.content ?? []).map((c) => inlineToHtml(c.content)).join("");
        return `<li><input type="checkbox" ${checked} disabled /><span>${text}</span></li>`;
      }).join("")}</ul>`;
    case "codeBlock": {
      const code = node.content?.map((c) => escapeHtml(c.text ?? "")).join("") ?? "";
      return `<pre><code>${code}</code></pre>`;
    }
    case "blockquote":
      return `<blockquote>${(node.content ?? []).map(blockToHtml).join("")}</blockquote>`;
    case "horizontalRule":
      return "<hr />";
    case "image":
      return `<img src="${escapeHtml(node.attrs?.src ?? "")}" alt="${escapeHtml(node.attrs?.alt ?? "")}" />`;
    default:
      return `<p>${inlineToHtml(node.content)}</p>`;
  }
}

function inlineToHtml(content?: JSONContent[]): string {
  if (!content) return "";
  return content.map((node) => {
    if (node.type === "text") {
      let text = escapeHtml(node.text ?? "");
      const marks = node.marks ?? [];
      for (const mark of marks) {
        switch (mark.type) {
          case "bold": text = `<strong>${text}</strong>`; break;
          case "italic": text = `<em>${text}</em>`; break;
          case "underline": text = `<u>${text}</u>`; break;
          case "strike": text = `<s>${text}</s>`; break;
          case "code": text = `<code>${text}</code>`; break;
          case "highlight": text = `<mark>${text}</mark>`; break;
          case "link": text = `<a href="${escapeHtml(mark.attrs?.href ?? "")}">${text}</a>`; break;
        }
      }
      return text;
    }
    return "";
  }).join("");
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── PDF Export (iframe print-to-PDF, same as AFFiNE) ─────────────────────────

export function exportPdf(title: string, content: JSONContent | null): void {
  const html = documentToHtml(title, content);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error("Cannot access iframe document");
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };

  // Fallback if onload doesn't fire (already loaded synchronously)
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    }
  }, 500);
}

// ─── Print current page ──────────────────────────────────────────────────────

export function printDocument(): void {
  window.print();
}

// ─── Download helper ──────────────────────────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
