"use client";

import { useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ initialHtml, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync initial content once when editor mounts
  useEffect(() => {
    if (editorRef.current && initialHtml && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml;
    }
  }, [initialHtml]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        // Insert image inline
        const imgHtml = `<img src="${base64}" alt="Image" style="max-width: 100%; height: auto; display: block; margin: 12px 0;" />`;
        executeCommand("insertHTML", imgHtml);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = "";
  };

  const insertTable = () => {
    // Insert a standard 3x2 editable table
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f9f9f9;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Kolom 1</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Kolom 2</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold;">Kolom 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Baris 1, Sel 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Baris 1, Sel 2</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Baris 1, Sel 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Baris 2, Sel 1</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Baris 2, Sel 2</td>
            <td style="border: 1px solid #ddd; padding: 8px;">Baris 2, Sel 3</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    executeCommand("insertHTML", tableHtml);
  };

  if (!isMounted) {
    return <div className="h-96 flex items-center justify-center text-gray-400">Memuat Editor...</div>;
  }

  return (
    <div className="flex flex-col flex-1 rounded-xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-bg-surface)]">
      {/* ─── Editor Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-[rgba(26,26,46,0.8)] border-b border-[var(--color-border)] sticky top-0 z-10">
        {/* Headings */}
        <select
          onChange={(e) => executeCommand("formatBlock", e.target.value)}
          defaultValue="P"
          className="bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-md px-2 py-1 text-xs outline-none cursor-pointer hover:border-[var(--color-border-glow)]"
        >
          <option value="P">Normal</option>
          <option value="H1">Judul Utama (H1)</option>
          <option value="H2">Sub Judul (H2)</option>
        </select>

        <div className="h-5 w-[1px] bg-[var(--color-border)] mx-1" />

        {/* Bold */}
        <button
          onClick={() => executeCommand("bold")}
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
          title="Tebalkan (Bold)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </button>

        {/* Italic */}
        <button
          onClick={() => executeCommand("italic")}
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
          title="Miringkan (Italic)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="4" x2="10" y2="20" />
            <line x1="14" y1="4" x2="5" y2="20" />
          </svg>
        </button>

        <div className="h-5 w-[1px] bg-[var(--color-border)] mx-1" />

        {/* Bullet List */}
        <button
          onClick={() => executeCommand("insertUnorderedList")}
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
          title="Bullet List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1.5" fill="currentColor" />
            <circle cx="4" cy="12" r="1.5" fill="currentColor" />
            <circle cx="4" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </button>

        {/* Numbered List */}
        <button
          onClick={() => executeCommand("insertOrderedList")}
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
          title="Numbered List"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4M3 10h3M4 14h1v2H3M4 20h1" />
          </svg>
        </button>

        <div className="h-5 w-[1px] bg-[var(--color-border)] mx-1" />

        {/* Table */}
        <button
          onClick={insertTable}
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white transition-colors flex items-center gap-1 text-xs"
          title="Insert Table"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          <span className="hidden sm:inline">Tabel</span>
        </button>

        {/* Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white transition-colors flex items-center gap-1 text-xs"
          title="Insert Image"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <span className="hidden sm:inline">Foto</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageInsert}
        />

        <div className="h-5 w-[1px] bg-[var(--color-border)] mx-1" />

        {/* Clear formatting */}
        <button
          onClick={() => executeCommand("removeFormat")}
          className="p-1.5 rounded hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-white transition-colors"
          title="Hapus Format"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* ─── Virtual Page Workspace ─── */}
      <div className="flex-1 overflow-auto bg-[#1a1a2e] p-6 flex justify-center items-start min-h-[500px]">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="w-full max-w-[800px] min-h-[700px] p-12 bg-white text-black shadow-2xl rounded-sm outline-none border border-gray-300 prose prose-sm max-w-none focus:ring-1 focus:ring-indigo-400 overflow-y-auto"
          style={{
            fontFamily: "Inter, sans-serif",
            lineHeight: "1.6",
          }}
        />
      </div>
    </div>
  );
}
