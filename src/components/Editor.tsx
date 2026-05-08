import { useEditor, EditorContent, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef } from "react";
import { cn, useDebounce } from "@/lib/utils";
import { isTiptapJson, markdownToHtml } from "@/lib/markdown-to-tiptap";
import { SlashCommandMenu } from "./SlashCommandMenu";
import { BubbleToolbar } from "./BubbleToolbar";

const lowlight = createLowlight(common);

interface EditorProps {
  content: Record<string, unknown> | null;
  onUpdate: (content: Record<string, unknown>) => void;
  className?: string;
}

const MARKDOWN_CONTENT_KEYS = ["text", "markdown", "body"] as const;

function resolveContent(content: Record<string, unknown> | string | null): Record<string, unknown> | string | undefined {
  if (!content) return undefined;
  if (typeof content === "string") return markdownToHtml(content);
  if (isTiptapJson(content)) return content;
  for (const key of MARKDOWN_CONTENT_KEYS) {
    if (typeof content[key] === "string") return markdownToHtml(content[key]);
  }
  return content;
}

export function Editor({ content, onUpdate, className }: EditorProps) {
  const debouncedUpdate = useDebounce(onUpdate as (...args: unknown[]) => void, 500);
  const prevContentRef = useRef<Record<string, unknown> | null>(null);
  const hasNormalized = useRef(false);

  const initialContent = resolveContent(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return `Heading ${node.attrs.level}`;
          return "Type '/' for commands...";
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Typography,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      debouncedUpdate(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[calc(100vh-12rem)] px-1",
      },
    },
    onCreate: ({ editor }) => {
      // If content was normalized from markdown, persist the TipTap JSON immediately
      if (content && !isTiptapJson(content) && !hasNormalized.current) {
        hasNormalized.current = true;
        onUpdate(editor.getJSON() as Record<string, unknown>);
      }
    },
  });

  useEffect(() => {
    if (editor && content && !editor.isFocused) {
      if (content === prevContentRef.current) return;
      prevContentRef.current = content;
      if (!isTiptapJson(content)) return;
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content as Record<string, unknown>);
      }
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={cn("relative", className)}>
      <BubbleMenu editor={editor} tippyOptions={{ duration: 150 }}>
        <BubbleToolbar editor={editor} />
      </BubbleMenu>
      <SlashCommandMenu editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
