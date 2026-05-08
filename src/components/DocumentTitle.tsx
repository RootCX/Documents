import { useState, useRef, useEffect } from "react";
import { cn, useDebounce } from "@/lib/utils";

interface DocumentTitleProps {
  title: string;
  icon?: string | null;
  onChange: (title: string) => void;
  onIconChange: (icon: string | null) => void;
}

const ICONS = ["📄", "📝", "📋", "📌", "📎", "🗂️", "💡", "🎯", "🚀", "⭐", "🔥", "💎", "🌟", "📚", "🎨", "🛠️", "🧩", "🔑", "💬", "📊"];

export function DocumentTitle({ title, icon, onChange, onIconChange }: DocumentTitleProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [showIcons, setShowIcons] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedOnChange = useDebounce(onChange as (...args: unknown[]) => void, 400);

  useEffect(() => {
    if (!editing) setValue(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleChange = (newValue: string) => {
    setValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleBlur = () => {
    setEditing(false);
    debouncedOnChange.cancel();
    if (value.trim() && value !== title) {
      onChange(value.trim());
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-start gap-2">
        <div className="relative">
          <button
            onClick={() => setShowIcons(!showIcons)}
            className="mt-1 rounded p-1 text-2xl hover:bg-accent/50 transition-colors"
          >
            {icon || "📄"}
          </button>
          {showIcons && (
            <div className="absolute left-0 top-full z-50 mt-1 grid grid-cols-5 gap-1 rounded-lg border border-border bg-popover p-2 shadow-lg">
              {ICONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onIconChange(emoji === icon ? null : emoji);
                    setShowIcons(false);
                  }}
                  className={cn(
                    "rounded p-1 text-lg hover:bg-accent transition-colors",
                    emoji === icon && "bg-accent"
                  )}
                >
                  {emoji}
                </button>
              ))}
              {icon && (
                <button
                  onClick={() => {
                    onIconChange(null);
                    setShowIcons(false);
                  }}
                  className="col-span-5 mt-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  Remove icon
                </button>
              )}
            </div>
          )}
        </div>
        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); }}
            className="flex-1 bg-transparent text-4xl font-bold tracking-tight text-foreground outline-none"
          />
        ) : (
          <h1
            onClick={() => setEditing(true)}
            className="flex-1 cursor-text text-4xl font-bold tracking-tight text-foreground"
          >
            {title || "Untitled"}
          </h1>
        )}
      </div>
    </div>
  );
}
