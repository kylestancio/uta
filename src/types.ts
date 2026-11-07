export type Chord = {
  id: string;
  /** Character column within the lyric line the chord sits above. */
  position: number;
  name: string;
};

export type Line = {
  id: string;
  text: string;
  chords: Chord[];
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  lines: Line[];
  /** Hex color (#rrggbb) for chord names; falls back to the default blue. */
  chordColor?: string;
  createdAt: number;
  updatedAt: number;
};
