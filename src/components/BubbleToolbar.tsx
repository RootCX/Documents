import type { Editor } from "@tiptap/react";
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconCode,
  IconHighlight,
  IconLink,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface BubbleToolbarProps {
  editor: Editor;
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const items = [
    {
      icon: IconBold,
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: IconItalic,
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      icon: IconUnderline,
      action: () => editor.chain().focus().toggleUnderline().run(),
      active: editor.isActive("underline"),
    },
    {
      icon: IconStrikethrough,
      action: () => editor.chain().focus().toggleStrike().run(),
      active: editor.isActive("strike"),
    },
    {
      icon: IconCode,
      action: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive("code"),
    },
    {
      icon: IconHighlight,
      action: () => editor.chain().focus().toggleHighlight().run(),
      active: editor.isActive("highlight"),
    },
    {
      icon: IconLink,
      action: () => {
        const url = window.prompt("URL:");
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      },
      active: editor.isActive("link"),
    },
  ];

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border bg-popover px-1 py-1 shadow-md">
      {items.map(({ icon: Icon, action, active }, i) => (
        <button
          key={i}
          onClick={action}
          className={cn(
            "rounded p-1.5 text-popover-foreground transition-colors hover:bg-accent",
            active && "bg-accent text-accent-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
