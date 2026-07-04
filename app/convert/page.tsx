"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  HANDWRITING_STYLES,
  INK_COLORS,
  type RenderConfig,
  type ImperfectionLevel,
  type PaperType,
  splitTextIntoPages,
  renderHandwritingPage,
  renderLayoutPage,
} from "@/lib/handwritingEngine";
import { renderPaperBackground, renderPhotoEffect } from "@/lib/paperRenderer";
import { parsePdf, blocksToHtml } from "@/lib/pdfParser";
import { parseDocx } from "@/lib/docxParser";
import {
  downloadPageAsImage,
  downloadAllAsPdf,
} from "@/lib/exportUtils";
import RichTextEditor from "@/components/RichTextEditor";

// ─── Step enum ────────────────────────────────────────────────────────────────
type Step = "upload" | "edit" | "customize" | "preview" | "export";
const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "edit", label: "Edit Teks" },
  { id: "customize", label: "Kustomisasi" },
  { id: "preview", label: "Preview" },
  { id: "export", label: "Ekspor" },
];

// ─── A4 at 96 DPI (approx) ───────────────────────────────────────────────────
const PAGE_W = 794; // ~210mm
const PAGE_H = 1123; // ~297mm

const DEFAULT_CONFIG: RenderConfig = {
  style: HANDWRITING_STYLES[0],
  paper: "lined",
  ink: INK_COLORS[0],
  fontSize: 22,
  imperfection: "medium",
  pageWidth: PAGE_W,
  pageHeight: PAGE_H,
  marginLeft: 72,
  marginRight: 48,
  marginTop: 64,
  marginBottom: 56,
  lineSpacing: 0, // auto-calculate
  seed: Math.floor(Math.random() * 100000),
  resolutionScale: 2,
};

export default function ConvertPage() {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [rawText, setRawText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [config, setConfig] = useState<RenderConfig>(DEFAULT_CONFIG);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderedPages, setRenderedPages] = useState<HTMLCanvasElement[]>([]);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [pdfLayoutPages, setPdfLayoutPages] = useState<any[]>([]);
  const [layoutMode, setLayoutMode] = useState<"1to1" | "reflow">("1to1");

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  // ─── File handling ──────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== "pdf" && ext !== "docx") {
      alert("Harap upload file PDF atau DOCX.");
      return;
    }
    setIsProcessing(true);
    setFileName(file.name);
    try {
      if (ext === "pdf") {
        const doc = await parsePdf(file);
        // Map parsed blocks page-by-page to HTML, preserving original page breaks
        const pageHtmls = doc.pages.map((p) => blocksToHtml(p.blocks));
        const allHtml = pageHtmls.join('<hr class="page-break" />');
        setRawText(allHtml);
        setEditedText(allHtml);
        
        // Save coordinate layout items
        const layouts = doc.pages.map((p) => p.layoutPage).filter(Boolean);
        setPdfLayoutPages(layouts);
        setLayoutMode("1to1"); // default to original layout preservation
      } else {
        // Parse DOCX directly to clean HTML
        const html = await parseDocx(file);
        setRawText(html);
        setEditedText(html);
        setPdfLayoutPages([]);
        setLayoutMode("reflow"); // default to reflow for Word documents
      }
      setStep("edit");
    } catch (err) {
      console.error(err);
      alert("Gagal membaca file. Pastikan file tidak rusak atau terproteksi.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // ─── Preview rendering ─────────────────────────────────────────────────
  const renderPreviewPage = useCallback(
    (text: string, cfg: RenderConfig, canvas: HTMLCanvasElement, imageCache: Record<string, HTMLImageElement> = {}, pageIdx?: number) => {
      const resScale = cfg.resolutionScale || 2.0;

      // Scale coordinates and sizing dynamically based on resolution multiplier
      const scaledCfg: RenderConfig = {
        ...cfg,
        pageWidth: cfg.pageWidth * resScale,
        pageHeight: cfg.pageHeight * resScale,
        fontSize: cfg.fontSize * resScale,
        marginLeft: cfg.marginLeft * resScale,
        marginRight: cfg.marginRight * resScale,
        marginTop: cfg.marginTop * resScale,
        marginBottom: cfg.marginBottom * resScale,
        lineSpacing: cfg.lineSpacing ? cfg.lineSpacing * resScale : 0,
      };

      canvas.width = scaledCfg.pageWidth;
      canvas.height = scaledCfg.pageHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, scaledCfg.pageWidth, scaledCfg.pageHeight);
      renderPaperBackground(ctx, scaledCfg);

      const isUneditedPdf = layoutMode === "1to1" && pdfLayoutPages.length > 0 && editedText === rawText;

      if (isUneditedPdf && pageIdx !== undefined && pdfLayoutPages[pageIdx]) {
        renderLayoutPage(ctx, pdfLayoutPages[pageIdx], scaledCfg);
      } else {
        renderHandwritingPage(ctx, text, scaledCfg, imageCache);
      }

      renderPhotoEffect(ctx, scaledCfg.pageWidth, scaledCfg.pageHeight);
    },
    [layoutMode, pdfLayoutPages, editedText, rawText]
  );

  const [liveImageCache, setLiveImageCache] = useState<Record<string, HTMLImageElement>>({});

  // Preload images inside HTML content for live preview
  useEffect(() => {
    if (step === "customize") {
      const load = async () => {
        const { preloadImages } = await import("@/lib/handwritingEngine");
        const cache = await preloadImages(editedText);
        setLiveImageCache(cache);
      };
      load();
    }
  }, [step, editedText]);

  // Live preview on customize step
  useEffect(() => {
    if (step === "customize" && previewCanvasRef.current) {
      const isUneditedPdf = layoutMode === "1to1" && pdfLayoutPages.length > 0 && editedText === rawText;
      if (isUneditedPdf) {
        renderPreviewPage("", config, previewCanvasRef.current, {}, 0);
      } else if (layoutMode === "1to1") {
        const pagesHtml = editedText.split(/<hr[^>]*class="page-break"[^>]*>|<hr\s*\/?>|<div[^>]*class="page-break"[^>]*><\/div>/gi).map(p => p.trim());
        renderPreviewPage(pagesHtml[0] || "", config, previewCanvasRef.current, liveImageCache, 0);
      } else {
        renderPreviewPage(editedText, config, previewCanvasRef.current, liveImageCache, 0);
      }
    }
  }, [step, config, editedText, rawText, renderPreviewPage, liveImageCache, layoutMode, pdfLayoutPages]);

  // ─── Full render ────────────────────────────────────────────────────────
  const generateAllPages = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);

    const canvases: HTMLCanvasElement[] = [];
    const { preloadImages } = await import("@/lib/handwritingEngine");
    const imageCache = await preloadImages(editedText);

    if (layoutMode === "1to1") {
      const isUneditedPdf = pdfLayoutPages.length > 0 && editedText === rawText;
      const pagesHtml = editedText.split(/<hr[^>]*class="page-break"[^>]*>|<hr\s*\/?>|<div[^>]*class="page-break"[^>]*><\/div>/gi).map(p => p.trim());
      const numPages = isUneditedPdf ? pdfLayoutPages.length : pagesHtml.length;

      for (let i = 0; i < numPages; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = config.pageWidth;
        canvas.height = config.pageHeight;
        const pageCfg = { ...config, seed: config.seed + i };
        
        if (isUneditedPdf) {
          renderPreviewPage("", pageCfg, canvas, {}, i);
        } else {
          renderPreviewPage(pagesHtml[i] || "", pageCfg, canvas, imageCache, i);
        }
        
        canvases.push(canvas);
        setProgress(((i + 1) / numPages) * 100);
        await new Promise((r) => setTimeout(r, 10));
      }
    } else {
      const pages = splitTextIntoPages(editedText, config);
      for (let i = 0; i < pages.length; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = config.pageWidth;
        canvas.height = config.pageHeight;
        const pageCfg = { ...config, seed: config.seed + i };
        renderPreviewPage(pages[i], pageCfg, canvas, imageCache, i);
        canvases.push(canvas);
        setProgress(((i + 1) / pages.length) * 100);
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    setRenderedPages(canvases);
    setCurrentPageIdx(0);
    setIsProcessing(false);
    setStep("preview");
  }, [editedText, rawText, config, renderPreviewPage, layoutMode, pdfLayoutPages]);

  // ─── Regenerate single page ─────────────────────────────────────────────
  const regeneratePage = useCallback(
    async (pageIdx: number) => {
      if (!renderedPages[pageIdx]) return;
      const canvas = renderedPages[pageIdx];
      const pageCfg = { ...config, seed: Math.floor(Math.random() * 100000) + pageIdx };

      const isUneditedPdf = layoutMode === "1to1" && pdfLayoutPages.length > 0 && editedText === rawText;

      if (isUneditedPdf) {
        renderPreviewPage("", pageCfg, canvas, {}, pageIdx);
      } else if (layoutMode === "1to1") {
        const pagesHtml = editedText.split(/<hr[^>]*class="page-break"[^>]*>|<hr\s*\/?>|<div[^>]*class="page-break"[^>]*><\/div>/gi).map(p => p.trim());
        const { preloadImages } = await import("@/lib/handwritingEngine");
        const imageCache = await preloadImages(pagesHtml[pageIdx] || "");
        renderPreviewPage(pagesHtml[pageIdx] || "", pageCfg, canvas, imageCache, pageIdx);
      } else {
        const pages = splitTextIntoPages(editedText, config);
        const { preloadImages } = await import("@/lib/handwritingEngine");
        const imageCache = await preloadImages(pages[pageIdx] || "");
        renderPreviewPage(pages[pageIdx] || "", pageCfg, canvas, imageCache, pageIdx);
      }

      setRenderedPages([...renderedPages]);
    },
    [renderedPages, editedText, rawText, config, renderPreviewPage, layoutMode, pdfLayoutPages]
  );

  // ─── Export handlers ────────────────────────────────────────────────────
  const handleExportCurrentPage = useCallback(
    async (format: "png" | "jpeg") => {
      const canvas = renderedPages[currentPageIdx];
      if (canvas) await downloadPageAsImage(canvas, currentPageIdx + 1, format);
    },
    [renderedPages, currentPageIdx]
  );

  const handleExportAllPdf = useCallback(async () => {
    if (renderedPages.length > 0) await downloadAllAsPdf(renderedPages);
  }, [renderedPages]);

  const handleExportAllImages = useCallback(async () => {
    for (let i = 0; i < renderedPages.length; i++) {
      await downloadPageAsImage(renderedPages[i], i + 1, "png");
      await new Promise((r) => setTimeout(r, 200)); // stagger downloads
    }
  }, [renderedPages]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex flex-col">
      {/* ─── Top Bar ─── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 backdrop-blur-xl bg-[rgba(10,10,18,0.8)] border-b border-[var(--color-border)]">
        <Link href="/" className="text-lg font-bold text-gradient">
          TulisTangan
        </Link>

        {/* Step indicators */}
        <div className="hidden sm:flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => {
                  // Only allow going to already-visited steps
                  if (i <= stepIdx) setStep(s.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === stepIdx
                    ? "bg-[rgba(99,102,241,0.15)] text-[var(--color-primary-300)] border border-[var(--color-primary-500)]"
                    : i < stepIdx
                    ? "text-[var(--color-accent-400)] cursor-pointer hover:bg-[rgba(20,184,166,0.08)]"
                    : "text-[var(--color-text-muted)] cursor-default"
                }`}
                disabled={i > stepIdx}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    i < stepIdx
                      ? "bg-[var(--color-accent-500)] text-white"
                      : i === stepIdx
                      ? "bg-[var(--color-primary-500)] text-white"
                      : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]"
                  }`}
                >
                  {i < stepIdx ? "✓" : i + 1}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-[2px] mx-1 rounded ${i < stepIdx ? "bg-[var(--color-accent-500)]" : "bg-[var(--color-bg-elevated)]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Mobile step indicator */}
        <div className="sm:hidden text-sm text-[var(--color-text-secondary)]">
          {stepIdx + 1}/{STEPS.length} — {STEPS[stepIdx].label}
        </div>
      </header>

      {/* ─── Content ─── */}
      <div className="flex-1 flex flex-col">
        {/* ═══════════════ STEP 1: UPLOAD ═══════════════ */}
        {step === "upload" && (
          <div className="flex-1 flex items-center justify-center p-6 animate-fade-in-up">
            <div className="w-full max-w-xl">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">Upload Dokumen-mu</h1>
                <p className="text-[var(--color-text-secondary)]">
                  Drag-drop file PDF/DOCX atau klik untuk memilih
                </p>
              </div>

              <div
                className={`drop-zone ${isDragOver ? "drag-over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={onFileSelect}
                  id="pdf-upload"
                />
                <div className="relative z-10">
                  <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-[rgba(99,102,241,0.12)] text-[var(--color-primary-400)]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 12 15 15" />
                    </svg>
                  </div>
                  <p className="text-[var(--color-text-primary)] font-medium mb-1">
                    {isProcessing ? "Memproses..." : "Klik atau drop file PDF / DOCX di sini"}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Mendukung PDF teks dan file Word (.docx)
                  </p>
                </div>
              </div>

              {/* Or paste text directly */}
              <div className="mt-6 text-center">
                <button
                  className="text-sm text-[var(--color-primary-400)] hover:text-[var(--color-primary-300)] transition-colors"
                  onClick={() => {
                    setEditedText("");
                    setStep("edit");
                  }}
                >
                  Atau ketik / tempel teks langsung →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 2: EDIT TEXT ═══════════════ */}
        {step === "edit" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 max-w-5xl mx-auto w-full animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">Edit & Format Dokumen</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {fileName
                    ? `Hasil ekstrak: ${fileName} — Kamu bisa mengedit dan menambahkan format tebal, miring, list, tabel, atau foto.`
                    : "Tulis, edit, dan format dokumenmu langsung di editor."}
                </p>
              </div>
              <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-2.5 py-1.5 rounded-lg">
                Google Docs Mode
              </span>
            </div>

            <RichTextEditor initialHtml={editedText} onChange={setEditedText} />

            <div className="flex items-center justify-between mt-4">
              <button className="btn-secondary !py-2 !px-5" onClick={() => setStep("upload")}>
                ← Kembali
              </button>
              <div className="flex items-center gap-3">
                <button
                  className="btn-primary !py-2.5 !px-6"
                  disabled={!editedText.trim() || editedText === "<p><br></p>"}
                  onClick={() => setStep("customize")}
                >
                  <span>Lanjut ke Kustomisasi →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 3: CUSTOMIZE ═══════════════ */}
        {step === "customize" && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 animate-fade-in-up">
            {/* Controls panel */}
            <div className="lg:w-80 xl:w-96 flex-shrink-0 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)] pb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Kustomisasi</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">Atur gaya tulisan, kertas, dan tinta</p>
              </div>

              {/* Layout Mode Selector (Show if pdfLayoutPages exists OR text has page breaks) */}
              {(pdfLayoutPages.length > 0 || editedText.includes("page-break") || editedText.includes("<hr")) && (
                <div>
                  <p className="section-label">Mode Tata Letak</p>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      className={`selection-card ${layoutMode === "1to1" ? "active" : ""}`}
                      onClick={() => setLayoutMode("1to1")}
                    >
                      <span className="text-lg">📐</span>
                      <span className="card-label">
                        {pdfLayoutPages.length > 0 && editedText === rawText
                          ? "Ikuti PDF Asli (1:1)"
                          : "Ikuti Halaman (1:1)"}
                      </span>
                    </button>
                    <button
                      className={`selection-card ${layoutMode === "reflow" ? "active" : ""}`}
                      onClick={() => setLayoutMode("reflow")}
                    >
                      <span className="text-lg">📝</span>
                      <span className="card-label">Teks Editor (Reflow)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Handwriting style */}
              <div>
                <p className="section-label">Gaya Tulisan</p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {HANDWRITING_STYLES.map((s) => (
                    <button
                      key={s.id}
                      className={`selection-card ${config.style.id === s.id ? "active" : ""}`}
                      onClick={() => setConfig((c) => ({ ...c, style: s }))}
                    >
                      <span className="text-lg" style={{ fontFamily: s.fontFamily }}>
                        Aa Bb Cc
                      </span>
                      <span className="card-label">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Paper type */}
              <div>
                <p className="section-label">Jenis Kertas</p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {([
                    { id: "lined" as PaperType, label: "Bergaris", icon: "≡" },
                    { id: "grid" as PaperType, label: "Kotak", icon: "▦" },
                    { id: "plain" as PaperType, label: "Polos", icon: "▢" },
                  ]).map((p) => (
                    <button
                      key={p.id}
                      className={`selection-card ${config.paper === p.id ? "active" : ""}`}
                      onClick={() => setConfig((c) => ({ ...c, paper: p.id }))}
                    >
                      <span className="text-2xl opacity-60">{p.icon}</span>
                      <span className="card-label">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ink color */}
              <div>
                <p className="section-label">Warna Tinta</p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {INK_COLORS.map((ink) => (
                    <button
                      key={ink.id}
                      className={`selection-card ${config.ink.id === ink.id ? "active" : ""}`}
                      onClick={() => setConfig((c) => ({ ...c, ink }))}
                    >
                      <div
                        className="w-6 h-6 rounded-full border border-[var(--color-border)]"
                        style={{ backgroundColor: ink.color, opacity: ink.opacity }}
                      />
                      <span className="card-label">{ink.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <div className="flex items-center justify-between">
                  <p className="section-label">Ukuran Huruf</p>
                  <span className="text-xs text-[var(--color-text-muted)]">{config.fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={32}
                  value={config.fontSize}
                  onChange={(e) => setConfig((c) => ({ ...c, fontSize: Number(e.target.value) }))}
                  className="mt-2"
                  id="font-size-slider"
                />
              </div>

              {/* Export Resolution */}
              <div>
                <p className="section-label">Resolusi Hasil Gambar & PDF</p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {([
                    { id: 1, label: "Normal", desc: "96 DPI" },
                    { id: 2, label: "Tinggi", desc: "192 DPI" },
                    { id: 3, label: "Super", desc: "288 DPI" },
                  ]).map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      className={`selection-card ${config.resolutionScale === res.id ? "active" : ""}`}
                      onClick={() => setConfig((c) => ({ ...c, resolutionScale: res.id }))}
                    >
                      <span className="text-lg font-bold">{res.id}x</span>
                      <span className="card-label">{res.label}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{res.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Imperfection level */}
              <div>
                <p className="section-label">Intensitas Ketidaksempurnaan</p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(["low", "medium", "high"] as ImperfectionLevel[]).map((level) => (
                    <button
                      key={level}
                      className={`selection-card ${config.imperfection === level ? "active" : ""}`}
                      onClick={() => setConfig((c) => ({ ...c, imperfection: level }))}
                    >
                      <span className="text-sm font-medium capitalize">
                        {level === "low" ? "Rendah" : level === "medium" ? "Sedang" : "Tinggi"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <button className="btn-primary w-full !py-3" onClick={generateAllPages} disabled={isProcessing}>
                  <span className="flex items-center justify-center gap-2">
                    {isProcessing ? "Memproses..." : "✨ Generate Semua Halaman"}
                  </span>
                </button>
                <button className="btn-secondary w-full !py-2.5" onClick={() => setStep("edit")}>
                  ← Kembali ke Edit
                </button>
              </div>
            </div>

            {/* Live preview */}
            <div className="flex-1 flex flex-col items-center">
              <p className="text-xs text-[var(--color-text-muted)] mb-3">Preview (1 halaman contoh)</p>
              <div className="canvas-container w-full max-w-lg">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-auto"
                  style={{ imageRendering: "auto" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 4: PREVIEW ═══════════════ */}
        {step === "preview" && (
          <div className="flex-1 flex flex-col p-4 sm:p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Preview Hasil</h2>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Halaman {currentPageIdx + 1} dari {renderedPages.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-icon"
                  onClick={() => regeneratePage(currentPageIdx)}
                  title="Regenerate halaman ini"
                >
                  🔄
                </button>
                <button
                  className="btn-primary !py-2 !px-5 text-sm"
                  onClick={() => setStep("export")}
                >
                  <span>Lanjut Ekspor →</span>
                </button>
              </div>
            </div>

            {/* Page navigation */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                className="btn-icon"
                disabled={currentPageIdx === 0}
                onClick={() => setCurrentPageIdx((i) => Math.max(0, i - 1))}
              >
                ◀
              </button>

              <div className="flex gap-1.5 overflow-x-auto max-w-[70vw] px-2 py-1">
                {renderedPages.map((_, i) => (
                  <button
                    key={i}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                      i === currentPageIdx
                        ? "bg-[var(--color-primary-500)] text-white"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-glass-hover)]"
                    }`}
                    onClick={() => setCurrentPageIdx(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                className="btn-icon"
                disabled={currentPageIdx === renderedPages.length - 1}
                onClick={() => setCurrentPageIdx((i) => Math.min(renderedPages.length - 1, i + 1))}
              >
                ▶
              </button>
            </div>

            {/* Canvas display */}
            <div className="flex-1 flex items-start justify-center overflow-auto">
              <div className="canvas-container max-w-2xl w-full">
                <PageCanvasDisplay canvas={renderedPages[currentPageIdx]} />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button className="btn-secondary !py-2 !px-5" onClick={() => setStep("customize")}>
                ← Kembali
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ STEP 5: EXPORT ═══════════════ */}
        {step === "export" && (
          <div className="flex-1 flex items-center justify-center p-6 animate-fade-in-up">
            <div className="max-w-md w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-[rgba(20,184,166,0.12)] text-[var(--color-accent-400)]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Ekspor Hasil</h2>
                <p className="text-[var(--color-text-secondary)]">
                  {renderedPages.length} halaman siap diunduh
                </p>
              </div>

              <div className="space-y-3">
                <button
                  className="glass-card w-full p-4 text-left flex items-center gap-4 group"
                  onClick={handleExportAllPdf}
                  id="export-pdf"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[rgba(239,68,68,0.1)] text-red-400 group-hover:scale-110 transition-transform">
                    <span className="text-lg font-bold">PDF</span>
                  </div>
                  <div>
                    <p className="font-semibold">Unduh sebagai PDF</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Semua halaman digabung dalam satu file PDF</p>
                  </div>
                </button>

                <button
                  className="glass-card w-full p-4 text-left flex items-center gap-4 group"
                  onClick={() => handleExportCurrentPage("png")}
                  id="export-png"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[rgba(99,102,241,0.1)] text-[var(--color-primary-400)] group-hover:scale-110 transition-transform">
                    <span className="text-lg font-bold">PNG</span>
                  </div>
                  <div>
                    <p className="font-semibold">Unduh halaman ini (PNG)</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Halaman {currentPageIdx + 1} — format PNG berkualitas tinggi</p>
                  </div>
                </button>

                <button
                  className="glass-card w-full p-4 text-left flex items-center gap-4 group"
                  onClick={() => handleExportCurrentPage("jpeg")}
                  id="export-jpg"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[rgba(245,158,11,0.1)] text-amber-400 group-hover:scale-110 transition-transform">
                    <span className="text-lg font-bold">JPG</span>
                  </div>
                  <div>
                    <p className="font-semibold">Unduh halaman ini (JPG)</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Halaman {currentPageIdx + 1} — ukuran file lebih kecil</p>
                  </div>
                </button>

                <button
                  className="glass-card w-full p-4 text-left flex items-center gap-4 group"
                  onClick={handleExportAllImages}
                  id="export-all-images"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-[rgba(20,184,166,0.1)] text-[var(--color-accent-400)] group-hover:scale-110 transition-transform">
                    <span className="text-lg font-bold">ALL</span>
                  </div>
                  <div>
                    <p className="font-semibold">Unduh semua halaman (PNG)</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{renderedPages.length} file PNG diunduh satu per satu</p>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between mt-8">
                <button className="btn-secondary !py-2 !px-5" onClick={() => setStep("preview")}>
                  ← Kembali ke Preview
                </button>
                <Link href="/" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors">
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ─── Processing overlay ─── */}
        {isProcessing && progress > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,10,18,0.85)] backdrop-blur-sm animate-fade-in">
            <div className="glass-card p-8 max-w-sm w-full text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-[var(--color-primary-500)] border-t-transparent animate-spin" />
              <p className="font-semibold mb-2">Sedang membuat tulisan tangan...</p>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                {Math.round(progress)}% selesai
              </p>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Helper component to display a canvas ─────────────────────────────────────
function PageCanvasDisplay({ canvas }: { canvas?: HTMLCanvasElement }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvas) return;

    // Clear previous content
    containerRef.current.innerHTML = "";

    // Style and mount the canvas directly
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    canvas.style.display = "block";
    containerRef.current.appendChild(canvas);

    return () => {
      // Detach on cleanup (canvas is reused across renders)
      if (canvas.parentNode === containerRef.current) {
        containerRef.current?.removeChild(canvas);
      }
    };
  }, [canvas]);

  return <div ref={containerRef} />;
}
