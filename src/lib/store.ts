import { useSyncExternalStore } from "react";
import type { Song } from "../types.ts";
import { newId } from "./id.ts";

const STORAGE_KEY = "uta.songs.v1";

const load = (): Song[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Song[]) : [];
  } catch {
    return [];
  }
};

let songs: Song[] = load();
const listeners = new Set<() => void>();

const commit = (next: Song[]) => {
  songs = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch {
    // Storage full or unavailable; keep the in-memory copy.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSongs = () => useSyncExternalStore(subscribe, () => songs);

export const useSong = (id: string | undefined) =>
  useSongs().find((song) => song.id === id);

export const createSong = (partial: Partial<Song> = {}): Song => {
  const now = Date.now();
  const song: Song = {
    title: "Untitled song",
    artist: "",
    lines: [],
    ...partial,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  commit([song, ...songs]);
  return song;
};

export const updateSong = (id: string, update: (song: Song) => Song) => {
  commit(
    songs.map((song) =>
      song.id === id ? { ...update(song), updatedAt: Date.now() } : song,
    ),
  );
};

export const deleteSong = (id: string) => {
  commit(songs.filter((song) => song.id !== id));
};
