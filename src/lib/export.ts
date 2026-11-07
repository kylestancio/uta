import type { Song } from "../types.ts";
import { chordLineText, isSectionHeader } from "./lyrics.ts";
import { newId } from "./id.ts";

const EXPORT_VERSION = 1;
export const DEFAULT_CHORD_COLOR = "#1d4ed8";

const isHexColor = (value: unknown): value is string =>
  typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);

const chordColorOf = (song: Song) =>
  isHexColor(song.chordColor) ? song.chordColor : DEFAULT_CHORD_COLOR;

const fileBaseName = (song: Song) =>
  (song.title.trim() || "song").replace(/[\\/:*?"<>|]+/g, "").slice(0, 80);

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

type Row =
  | { kind: "blank" }
  | { kind: "header"; text: string }
  /** `text` is empty for an instrumental (chords-only) line. */
  | { kind: "lyric"; chords: string; text: string };

/** Flattens a song into printable rows shared by the PDF and DOCX exporters. */
const toRows = (song: Song): Row[] =>
  song.lines.map((line) => {
    if (line.text.trim() === "" && line.chords.length === 0) return { kind: "blank" };
    if (isSectionHeader(line.text)) return { kind: "header", text: line.text.trim() };
    return { kind: "lyric", chords: chordLineText(line.chords), text: line.text.trim() ? line.text : "" };
  });

export const exportJson = (song: Song) => {
  const payload = {
    format: "uta-chord-sheet",
    version: EXPORT_VERSION,
    song: { title: song.title, artist: song.artist, chordColor: song.chordColor, lines: song.lines },
  };
  download(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `${fileBaseName(song)}.json`,
  );
};

/** Parses a file produced by exportJson. Throws with a readable message on bad input. */
export const parseSongJson = (raw: string): Pick<Song, "title" | "artist" | "chordColor" | "lines"> => {
  const data = JSON.parse(raw);
  const song = data?.song ?? data;
  if (!song || !Array.isArray(song.lines)) {
    throw new Error("This file doesn't look like a chord sheet export.");
  }
  return {
    title: String(song.title ?? "Imported song"),
    artist: String(song.artist ?? ""),
    chordColor: isHexColor(song.chordColor) ? song.chordColor : undefined,
    lines: song.lines.map((line: { text?: unknown; chords?: unknown }) => ({
      id: newId(),
      text: String(line.text ?? ""),
      chords: (Array.isArray(line.chords) ? line.chords : [])
        .map((chord: { name?: unknown; position?: unknown }) => ({
          id: newId(),
          name: String(chord.name ?? "").trim(),
          position: Math.max(0, Math.floor(Number(chord.position) || 0)),
        }))
        .filter((chord: { name: string }) => chord.name !== ""),
    })),
  };
};

export const exportPdf = async (song: Song) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const rows = toRows(song);

  // Courier glyphs are 0.6em wide; shrink the font if the longest line won't fit.
  const longest = Math.max(
    1,
    ...rows.map((row) =>
      row.kind === "lyric" ? Math.max(row.chords.length, row.text.length) : 0,
    ),
  );
  const fontSize = Math.min(11, (pageWidth - margin * 2) / (longest * 0.6));
  const lineHeight = fontSize * 1.25;

  let y = margin;
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(0);
  doc.text(song.title || "Untitled song", margin, y + 18);
  y += 26;
  if (song.artist) {
    doc.setFont("helvetica", "normal").setFontSize(12).setTextColor(90);
    doc.text(song.artist, margin, y + 12);
    y += 18;
  }
  y += 12;

  for (const row of rows) {
    if (row.kind === "blank") {
      y += lineHeight * 0.75;
      continue;
    }
    if (row.kind === "header") {
      ensureSpace(lineHeight * 2);
      doc.setFont("helvetica", "bold").setFontSize(fontSize).setTextColor(60);
      doc.text(row.text, margin, y + fontSize);
      y += lineHeight;
      continue;
    }
    const height = (row.chords ? lineHeight : 0) + (row.text ? lineHeight : 0);
    ensureSpace(height);
    if (row.chords) {
      doc.setFont("courier", "bold").setFontSize(fontSize).setTextColor(chordColorOf(song));
      doc.text(row.chords, margin, y + fontSize);
      y += lineHeight;
    }
    if (row.text) {
      doc.setFont("courier", "normal").setFontSize(fontSize).setTextColor(0);
      doc.text(row.text, margin, y + fontSize);
      y += lineHeight;
    }
  }

  doc.save(`${fileBaseName(song)}.pdf`);
};

export const exportDocx = async (song: Song) => {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const mono = (text: string, opts: { bold?: boolean; color?: string; keepNext?: boolean } = {}) =>
    new Paragraph({
      keepNext: opts.keepNext,
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text, font: "Courier New", size: 22, bold: opts.bold, color: opts.color })],
    });

  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(song.title || "Untitled song")] }),
  ];
  if (song.artist) {
    children.push(
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: song.artist, italics: true, color: "555555" })],
      }),
    );
  }

  for (const row of toRows(song)) {
    if (row.kind === "blank") {
      children.push(mono(""));
    } else if (row.kind === "header") {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 0 },
          children: [new TextRun({ text: row.text, bold: true, color: "444444" })],
        }),
      );
    } else {
      if (row.chords) {
        children.push(mono(row.chords, { bold: true, color: chordColorOf(song).slice(1), keepNext: !!row.text }));
      }
      if (row.text) children.push(mono(row.text));
    }
  }

  const blob = await Packer.toBlob(new Document({ sections: [{ children }] }));
  download(blob, `${fileBaseName(song)}.docx`);
};
