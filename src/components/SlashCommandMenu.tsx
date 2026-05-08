import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { Editor } from "@tiptap/react";
import {
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconCheckbox,
  IconCode,
  IconQuote,
  IconPhoto,
  IconMinus,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: (editor: Editor) => void;
}

const commands: CommandItem[] = [
  { title: "Heading 1", description: "Large section heading", icon: IconH1, action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: "Heading 2", description: "Medium section heading", icon: IconH2, action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: "Heading 3", description: "Small section heading", icon: IconH3, action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: "Bullet List", description: "Create a simple bullet list", icon: IconList, action: (e) => e.chain().focus().toggleBulletList().run() },
  { title: "Numbered List", description: "Create a numbered list", icon: IconListNumbers, action: (e) => e.chain().focus().toggleOrderedList().run() },
  { title: "To-do List", description: "Track tasks with a to-do list", icon: IconCheckbox, action: (e) => e.chain().focus().toggleTaskList().run() },
  { title: "Code Block", description: "Display a code snippet", icon: IconCode, action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { title: "Quote", description: "Capture a quote", icon: IconQuote, action: (e) => e.chain().focus().toggleBlockquote().run() },
  { title: "Image", description: "Embed an image from URL", icon: IconPhoto, action: (e) => { const url = window.prompt("Image URL:"); if (url) e.chain().focus().setImage({ src: url }).run(); } },
  { title: "Divider", description: "Insert a horizontal divider", icon: IconMinus, action: (e) => e.chain().focus().setHorizontalRule().run() },
];

export function SlashCommandMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) => cmd.title.toLowerCase().includes(q) || cmd.description.toLowerCase().includes(q)
    );
  }, [query]);

  const stateRef = useRef({ selectedIndex, filtered, query });
  useEffect(() => {
    stateRef.current = { selectedIndex, filtered, query };
  });

  const executeCommand = useCallback(
    (index: number) => {
      const { filtered: f, query: q } = stateRef.current;
      const cmd = f[index];
      if (!cmd) return;
      const { state } = editor;
      const { from } = state.selection;
      const deleteFrom = from - q.length - 1;
      if (deleteFrom >= 0) {
        editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
      }
      cmd.action(editor);
      setOpen(false);
      setQuery("");
    },
    [editor]
  );

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const { selectedIndex: idx, filtered: f } = stateRef.current;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((idx + 1) % f.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((idx - 1 + f.length) % f.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        executeCommand(idx);
      } else if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open, executeCommand]);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 50), from, "\n");
      const match = textBefore.match(/\/([^/\s]*)$/);

      if (match) {
        setOpen(true);
        setQuery(match[1]);
        setSelectedIndex(0);
        const coords = editor.view.coordsAtPos(from);
        const editorRect = editor.view.dom.getBoundingClientRect();
        setPosition({
          top: coords.bottom - editorRect.top + 8,
          left: coords.left - editorRect.left,
        });
      } else {
        setOpen(false);
        setQuery("");
      }
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor]);

  if (!open || filtered.length === 0) return null;

  return (
    <div
      className="absolute z-50 w-72 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="max-h-80 overflow-y-auto p-1">
        {filtered.map((cmd, index) => (
          <button
            key={cmd.title}
            onClick={() => executeCommand(index)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "text-popover-foreground hover:bg-accent/50"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background">
              <cmd.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{cmd.title}</div>
              <div className="truncate text-xs text-muted-foreground">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
