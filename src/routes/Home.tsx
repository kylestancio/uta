import { useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { createSong, deleteSong, useSongs } from "../lib/store.ts";
import { parseSongJson } from "../lib/export.ts";

export const Home = () => {
  const songs = useSongs();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleNew = () => {
    const song = createSong();
    navigate(`/songs/${song.id}/lyrics`);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const song = createSong(parseSongJson(await file.text()));
      setImportError(null);
      navigate(`/songs/${song.id}/chords`);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not import that file.");
    }
  };

  return (
    <div className="home">
      <div className="toolbar">
        <h1>Your songs</h1>
        <div className="toolbar-actions">
          <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
            Import JSON
          </button>
          <button type="button" className="btn btn-primary" onClick={handleNew}>
            New song
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={handleImport} />
        </div>
      </div>
      {importError && <p className="error">{importError}</p>}

      {songs.length === 0 ? (
        <div className="empty">
          <h2>No songs yet</h2>
          <p>Start by pasting your lyrics, then click above any word to drop a chord on it.</p>
          <button type="button" className="btn btn-primary" onClick={handleNew}>
            Create your first song
          </button>
        </div>
      ) : (
        <ul className="song-list">
          {songs.map((song) => (
            <li key={song.id} className="song-card">
              <Link to={`/songs/${song.id}`} className="song-card-link">
                <span className="song-card-title">{song.title || "Untitled song"}</span>
                <span className="song-card-meta">
                  {song.artist && <>{song.artist} · </>}
                  Edited {new Date(song.updatedAt).toLocaleDateString()}
                </span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-danger"
                onClick={() => {
                  if (confirm(`Delete "${song.title || "Untitled song"}"?`)) deleteSong(song.id);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
