import { useCallback, useRef, useState } from "react";
import { cn, useLatestRef } from "@/lib/utils";

const MIN_WIDTH = 248;
const MAX_WIDTH = 480;

interface ResizeHandleProps {
  onResize: (width: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  currentWidth: number;
}

export function ResizeHandle({ onResize, onResizeStart, onResizeEnd, currentWidth }: ResizeHandleProps) {
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const rafId = useRef(0);
  const currentWidthRef = useLatestRef(currentWidth);
  const onResizeRef = useLatestRef(onResize);
  const onResizeStartRef = useLatestRef(onResizeStart);
  const onResizeEndRef = useLatestRef(onResizeEnd);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      onResizeStartRef.current?.();
      startX.current = e.clientX;
      startWidth.current = currentWidthRef.current;

      const onMouseMove = (ev: MouseEvent) => {
        cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          const delta = ev.clientX - startX.current;
          const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
          onResizeRef.current(newWidth);
        });
      };

      const onMouseUp = (ev: MouseEvent) => {
        cancelAnimationFrame(rafId.current);
        setDragging(false);
        const delta = ev.clientX - startX.current;
        const finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
        onResizeRef.current(finalWidth);
        onResizeEndRef.current?.();
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [currentWidthRef, onResizeRef, onResizeStartRef, onResizeEndRef]
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute right-0 top-0 z-10 h-full w-1 cursor-col-resize",
        dragging ? "bg-primary/40" : "hover:bg-primary/20"
      )}
    />
  );
}

export { MIN_WIDTH, MAX_WIDTH };
