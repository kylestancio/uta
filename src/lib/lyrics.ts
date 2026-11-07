import type { Chord, Line } from "../types.ts";
import { newId } from "./id.ts";

/** Lines like "[Chorus]" are rendered as section headings and take no chords. */
export const isSectionHeader = (text: string) => /^\s*\[.*\]\s*$/.test(text);

export type PlacedChord = { chord: Chord; column: number };

/**
 * Resolves the column each chord is drawn at. Chords keep their position
 * unless that would collide with the previous chord, in which case they are
 * pushed right so there is always at least one space between names.
 */
export const layoutChords = (chords: Chord[]): PlacedChord[] => {
  let nextFree = 0;
  return [...chords]
    .sort((a, b) => a.position - b.position)
    .map((chord) => {
      const column = Math.max(chord.position, nextFree);
      nextFree = column + chord.name.length + 1;
      return { chord, column };
    });
};

/** Plain-text chord line, padded with spaces, for monospace exports. */
export const chordLineText = (chords: Chord[]) => {
  let out = "";
  for (const { chord, column } of layoutChords(chords)) {
    out = out.padEnd(column, " ") + chord.name;
  }
  return out;
};

/** Rough 0..1 similarity: shared prefix + suffix length over the longer line. */
const similarity = (a: string, b: string) => {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  let prefix = 0;
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++;
  let suffix = 0;
  while (
    suffix < a.length - prefix &&
    suffix < b.length - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix++;
  }
  return (prefix + suffix) / max;
};

/**
 * Rebuilds the line list from edited lyrics while keeping chords attached to
 * the lines they belong to. Unchanged lines are matched exactly (LCS); edited
 * lines between two matches are paired with a similar old line so a typo fix
 * doesn't throw away that line's chords.
 */
export const reconcileLyrics = (previous: Line[], text: string): Line[] => {
  const nextTexts = text.replace(/\r\n?/g, "\n").split("\n");
  const prevTexts = previous.map((line) => line.text);
  const n = prevTexts.length;
  const m = nextTexts.length;

  const lcs: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(m + 1).fill(0),
  );
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] =
        prevTexts[i] === nextTexts[j]
          ? lcs[i + 1][j + 1] + 1
          : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const result: Line[] = [];
  let pendingOld: Line[] = [];
  let pendingNew: string[] = [];

  const flush = () => {
    // Lyrics are reconciled on every keystroke, so an edited line is always
    // close to its previous version; only carry chords to lines that look alike.
    let nextOld = 0;
    pendingNew.forEach((lineText) => {
      let old: Line | undefined;
      if (lineText.trim() !== "" && !isSectionHeader(lineText)) {
        for (let o = nextOld; o < pendingOld.length; o++) {
          if (similarity(pendingOld[o].text, lineText) >= 0.5) {
            old = pendingOld[o];
            nextOld = o + 1;
            break;
          }
        }
      }
      result.push(old ? { ...old, text: lineText } : { id: newId(), text: lineText, chords: [] });
    });
    pendingOld = [];
    pendingNew = [];
  };

  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && prevTexts[i] === nextTexts[j]) {
      flush();
      result.push(previous[i]);
      i++;
      j++;
    } else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) {
      pendingNew.push(nextTexts[j++]);
    } else {
      pendingOld.push(previous[i++]);
    }
  }
  flush();
  return result;
};

export const linesToText = (lines: Line[]) =>
  lines.map((line) => line.text).join("\n");
