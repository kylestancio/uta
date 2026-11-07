import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useOutletContext } from "react-router";
import { updateSong } from "../lib/store.ts";
import { DEFAULT_CHORD_COLOR } from "../lib/export.ts";
import { isSectionHeader } from "../lib/lyrics.ts";
import { newId } from "../lib/id.ts";
import { ChordPopover } from "../components/ChordPopover.tsx";
import { LineView, type ChordTarget } from "../components/LineView.tsx";
import type { Chord } from "../types.ts";
import type { SongContext } from "./SongLayout.tsx";

const COMMON_CHORDS = ["C", "D", "E", "F", "G", "A", "B", "Am", "Dm", "Em", "Bm", "G7", "D7", "Cmaj7"];
const MAX_SUGGESTIONS = 14;
const MEASURE_TEXT = "0".repeat(40);

export const ChordsStep = () => {
  const { song } = useOutletContext<SongContext>();
  const measureRef = useRef<HTMLSpanElement>(null);
  const [charWidth, setCharWidth] = useState(0);
  const [editing, setEditing] = useState<ChordTarget | null>(null);

  // Click positions are converted to character columns, so we need the exact
  // rendered width of one monospace glyph.
  useLayoutEffect(() => {
    const measure = () => {
      const el = measureRef.current;
      if (el) setCharWidth(el.getBoundingClientRect().width / MEASURE_TEXT.length);
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const suggestions = useMemo(() => {
    const used = song.lines.flatMap((line) => line.chords.map((chord) => chord.name));
    return [...new Set([...used, ...COMMON_CHORDS])].slice(0, Math.max(MAX_SUGGESTIONS, new Set(used).size));
  }, [song.lines]);

  const setLineChords = (lineId: string, update: (chords: Chord[]) => Chord[]) =>
    updateSong(song.id, (s) => ({
      ...s,
      lines: s.lines.map((line) => (line.id === lineId ? { ...line, chords: update(line.chords) } : line)),
    }));

  const moveChord = (lineId: string, chordId: string, position: number) =>
    setLineChords(lineId, (chords) =>
      chords.map((chord) => (chord.id === chordId ? { ...chord, position: Math.max(0, position) } : chord)),
    );

  const saveChord = (name: string) => {
    if (!editing) return;
    const trimmed = name.trim();
    const { lineId, position, chord } = editing;
    setLineChords(lineId, (chords) => {
      const rest = chords.filter((c) => c.id !== chord?.id);
      return trimmed ? [...rest, { id: chord?.id ?? newId(), position, name: trimmed }] : rest;
    });
    setEditing(null);
  };

  if (song.lines.every((line) => line.text.trim() === "")) {
    return (
      <div className="empty">
        <h2>No lyrics yet</h2>
        <p>Add your lyrics first, then come back here to place chords.</p>
        <Link to="../lyrics" relative="path" className="btn btn-primary">
          ← Add lyrics
        </Link>
      </div>
    );
  }

  return (
    <div className="chords-step">
      <div className="chords-toolbar">
        <p className="hint">
          Click above any letter to add a chord, or click an empty line for instrumental chords. Click a
          chord to change or remove it, drag it (or focus it and use ← →) to move it.
        </p>
        <label className="color-field">
          <span>Chord color</span>
          <input
            type="color"
            value={song.chordColor ?? DEFAULT_CHORD_COLOR}
            onChange={(e) => updateSong(song.id, (s) => ({ ...s, chordColor: e.target.value }))}
          />
          {song.chordColor && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => updateSong(song.id, (s) => ({ ...s, chordColor: undefined }))}
            >
              Reset
            </button>
          )}
        </label>
      </div>
      <div
        className="sheet"
        style={song.chordColor ? ({ "--chord-color": song.chordColor } as CSSProperties) : undefined}
      >
        <span ref={measureRef} className="mono measure" aria-hidden="true">
          {MEASURE_TEXT}
        </span>
        <h2 className="sheet-title">{song.title || "Untitled song"}</h2>
        {song.artist && <p className="sheet-artist">{song.artist}</p>}

        {song.lines.map((line) => {
          if (isSectionHeader(line.text)) {
            return (
              <div key={line.id} className="section-header">
                {line.text.trim()}
              </div>
            );
          }
          const isEditing = editing?.lineId === line.id;
          return (
            <LineView
              key={line.id}
              line={line}
              charWidth={charWidth}
              pendingPosition={isEditing && !editing.chord ? editing.position : null}
              onPlace={(position) => setEditing({ lineId: line.id, position })}
              onEditChord={(chord, position) => setEditing({ lineId: line.id, position, chord })}
              onMoveChord={(chordId, position) => moveChord(line.id, chordId, position)}
            >
              {isEditing && (
                <ChordPopover
                  key={`${editing.chord?.id ?? "new"}-${editing.position}`}
                  left={editing.position * charWidth}
                  initial={editing.chord?.name ?? ""}
                  canDelete={!!editing.chord}
                  suggestions={suggestions}
                  onSave={saveChord}
                  onCancel={() => setEditing(null)}
                />
              )}
            </LineView>
          );
        })}
      </div>
    </div>
  );
};
