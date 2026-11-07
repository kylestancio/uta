import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { layoutChords } from "../lib/lyrics.ts";
import type { Chord, Line } from "../types.ts";

export type ChordTarget = { lineId: string; position: number; chord?: Chord };

type Drag = { chordId: string; startX: number; origin: number; position: number; moved: boolean };

type LineViewProps = {
  line: Line;
  charWidth: number;
  /** Column of a chord being added (not yet saved), shown as a placeholder. */
  pendingPosition: number | null;
  onPlace: (position: number) => void;
  onEditChord: (chord: Chord, position: number) => void;
  onMoveChord: (chordId: string, position: number) => void;
  children?: ReactNode;
};

const DRAG_THRESHOLD_PX = 4;

export const LineView = ({
  line,
  charWidth,
  pendingPosition,
  onPlace,
  onEditChord,
  onMoveChord,
  children,
}: LineViewProps) => {
  const lineRef = useRef<HTMLDivElement>(null);
  const [hoverColumn, setHoverColumn] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const columnAt = (clientX: number) => {
    const left = lineRef.current?.getBoundingClientRect().left ?? 0;
    return charWidth > 0 ? Math.max(0, Math.floor((clientX - left) / charWidth)) : 0;
  };

  const chords = drag
    ? line.chords.map((chord) => (chord.id === drag.chordId ? { ...chord, position: drag.position } : chord))
    : line.chords;
  const placed = layoutChords(chords);
  const width = Math.max(line.text.length, ...placed.map(({ chord, column }) => column + chord.name.length)) + 2;

  const handleChordPointerDown = (event: PointerEvent<HTMLButtonElement>, column: number, chord: Chord) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ chordId: chord.id, startX: event.clientX, origin: column, position: column, moved: false });
  };

  const handleChordPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag || charWidth === 0) return;
    const dx = event.clientX - drag.startX;
    setDrag({
      ...drag,
      moved: drag.moved || Math.abs(dx) > DRAG_THRESHOLD_PX,
      position: Math.max(0, drag.origin + Math.round(dx / charWidth)),
    });
  };

  const handleChordPointerUp = (column: number, chord: Chord) => {
    if (!drag) return;
    if (drag.moved) onMoveChord(chord.id, drag.position);
    else onEditChord(chord, column);
    setDrag(null);
  };

  return (
    <div
      ref={lineRef}
      className="line"
      style={{ minWidth: `${width}ch` }}
      onPointerMove={(e) => !drag && setHoverColumn(columnAt(e.clientX))}
      onPointerLeave={() => setHoverColumn(null)}
      onClick={(e) => onPlace(columnAt(e.clientX))}
    >
      {hoverColumn !== null && !drag && pendingPosition === null && (
        <div className="column-guide" style={{ left: `${hoverColumn}ch` }} />
      )}
      <div className="chord-row mono">
        {placed.map(({ chord, column }) => (
          <button
            key={chord.id}
            type="button"
            className={`chord${drag?.chordId === chord.id ? " dragging" : ""}`}
            style={{ left: `${column}ch` }}
            title="Click to edit · drag to move"
            onPointerDown={(e) => handleChordPointerDown(e, column, chord)}
            onPointerMove={handleChordPointerMove}
            onPointerUp={() => handleChordPointerUp(column, chord)}
            onPointerCancel={() => setDrag(null)}
            onClick={(e) => {
              e.stopPropagation();
              // detail === 0 means keyboard activation; pointer clicks are handled on pointerup.
              if (e.detail === 0) onEditChord(chord, column);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                onMoveChord(chord.id, column + (e.key === "ArrowLeft" ? -1 : 1));
              } else if (e.key === "Delete" || e.key === "Backspace") {
                e.preventDefault();
                onEditChord(chord, column);
              }
            }}
          >
            {chord.name}
          </button>
        ))}
        {pendingPosition !== null && (
          <span className="chord chord-pending" style={{ left: `${pendingPosition}ch` }}>
            ▾
          </span>
        )}
      </div>
      <div className="lyric mono">{line.text || " "}</div>
      {children}
    </div>
  );
};
