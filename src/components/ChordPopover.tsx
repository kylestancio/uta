import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ChordPopoverProps = {
  /** Horizontal offset in px from the start of the line. */
  left: number;
  initial: string;
  canDelete: boolean;
  suggestions: string[];
  /** Saving an empty name removes the chord. */
  onSave: (name: string) => void;
  onCancel: () => void;
};

const VIEWPORT_MARGIN = 8;
const GAP = 4;

export const ChordPopover = ({ left, initial, canDelete, suggestions, onSave, onCancel }: ChordPopoverProps) => {
  const [value, setValue] = useState(initial);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onCancel();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onCancel]);

  // The popover is portaled and fixed-positioned so the scrolling sheet can't
  // clip it. It follows the in-line anchor, stays inside the viewport, and
  // flips above the chord when there isn't room below.
  useLayoutEffect(() => {
    const place = () => {
      const anchor = anchorRef.current?.getBoundingClientRect();
      const popover = ref.current?.getBoundingClientRect();
      if (!anchor || !popover) return;
      const maxLeft = window.innerWidth - popover.width - VIEWPORT_MARGIN;
      const below = anchor.bottom + GAP;
      const above = anchor.top - popover.height - GAP;
      setPosition({
        left: Math.max(VIEWPORT_MARGIN, Math.min(anchor.left, maxLeft)),
        top: below + popover.height > window.innerHeight - VIEWPORT_MARGIN && above >= VIEWPORT_MARGIN ? above : below,
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [left]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <>
      <span ref={anchorRef} className="chord-popover-anchor" style={{ left }} />
      {createPortal(
        <div
          ref={ref}
          className="chord-popover"
          style={position ?? { visibility: "hidden" }}
          onClick={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
        >
          <form
            className="chord-popover-form"
            onSubmit={(e) => {
              e.preventDefault();
              onSave(value);
            }}
          >
            <input
              ref={inputRef}
              value={value}
              placeholder="Chord, e.g. Am7"
              aria-label="Chord name"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && onCancel()}
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Save
            </button>
            {canDelete && (
              <button type="button" className="btn btn-sm btn-danger" onClick={() => onSave("")}>
                Remove
              </button>
            )}
          </form>
          <div className="chord-suggestions">
            {suggestions.map((name) => (
              <button key={name} type="button" className="chip" onClick={() => onSave(name)}>
                {name}
              </button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};
