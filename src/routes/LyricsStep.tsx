import { Link, useOutletContext } from "react-router";
import { updateSong } from "../lib/store.ts";
import { linesToText, reconcileLyrics } from "../lib/lyrics.ts";
import type { SongContext } from "./SongLayout.tsx";

export const LyricsStep = () => {
  const { song } = useOutletContext<SongContext>();

  return (
    <div className="lyrics-step">
      <div className="field-row">
        <label className="field">
          <span>Title</span>
          <input
            value={song.title}
            placeholder="Song title"
            onChange={(e) => updateSong(song.id, (s) => ({ ...s, title: e.target.value }))}
          />
        </label>
        <label className="field">
          <span>Artist</span>
          <input
            value={song.artist}
            placeholder="Optional"
            onChange={(e) => updateSong(song.id, (s) => ({ ...s, artist: e.target.value }))}
          />
        </label>
      </div>
      <label className="field">
        <span>Lyrics</span>
        <textarea
          className="lyrics-input"
          value={linesToText(song.lines)}
          placeholder={"[Verse 1]\nType or paste your lyrics here…\n\n[Chorus]\n…"}
          spellCheck={false}
          onChange={(e) =>
            updateSong(song.id, (s) => ({ ...s, lines: reconcileLyrics(s.lines, e.target.value) }))
          }
        />
      </label>
      <p className="hint">
        Leave a blank line between verses. Lines in brackets like <code>[Chorus]</code> become section
        headings. Chords you've already placed stay with their line when you edit lyrics.
      </p>
      <div className="step-footer">
        <Link to="../chords" relative="path" className="btn btn-primary">
          Next: add chords →
        </Link>
      </div>
    </div>
  );
};
