import { useState } from "react";
import { NavLink, Outlet, useParams } from "react-router";
import { useSong } from "../lib/store.ts";
import { exportDocx, exportJson, exportPdf } from "../lib/export.ts";
import { NotFound } from "./NotFound.tsx";
import type { Song } from "../types.ts";

export type SongContext = { song: Song };

const EXPORTS = [
  { label: "PDF", run: exportPdf },
  { label: "Word", run: exportDocx },
  { label: "JSON", run: exportJson },
] as const;

export const SongLayout = () => {
  const { songId } = useParams();
  const song = useSong(songId);
  const [busy, setBusy] = useState<string | null>(null);

  if (!song) return <NotFound />;

  const runExport = async (label: string, run: (song: Song) => void | Promise<void>) => {
    setBusy(label);
    try {
      await run(song);
    } catch (error) {
      console.error(error);
      alert(`Export failed: ${error instanceof Error ? error.message : error}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="song">
      <div className="toolbar">
        <nav className="steps" aria-label="Editing steps">
          <NavLink to="lyrics" className="step">
            <span className="step-num">1</span> Lyrics
          </NavLink>
          <NavLink to="chords" className="step">
            <span className="step-num">2</span> Chords
          </NavLink>
        </nav>
        <div className="toolbar-actions">
          <span className="toolbar-label">Export</span>
          {EXPORTS.map(({ label, run }) => (
            <button
              key={label}
              type="button"
              className="btn"
              disabled={busy !== null}
              onClick={() => runExport(label, run)}
            >
              {busy === label ? "…" : label}
            </button>
          ))}
        </div>
      </div>
      <Outlet context={{ song } satisfies SongContext} />
    </div>
  );
};
