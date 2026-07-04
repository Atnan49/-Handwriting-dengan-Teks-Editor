import { createNoise2D } from "simplex-noise";

// ─── Seeded PRNG (Mulberry32) ───────────────────────────────────────────────
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────
export type HandwritingStyle = {
  id: string;
  name: string;
  fontFamily: string;
  cssVariable: string;
  baseFontSize: number;
  lineHeightMultiplier: number;
  naturalSlant: number;
};

export type PaperType = "lined" | "grid" | "plain";

export type InkColor = {
  id: string;
  name: string;
  color: string;
  opacity: number;
};

export type ImperfectionLevel = "low" | "medium" | "high";

export interface RenderConfig {
  style: HandwritingStyle;
  paper: PaperType;
  ink: InkColor;
  fontSize: number; // px
  imperfection: ImperfectionLevel;
  pageWidth: number;
  pageHeight: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  lineSpacing: number; // px between baselines
  seed: number;
  resolutionScale?: number;
}

export interface DocumentBlock {
  type: "paragraph" | "heading" | "list-item" | "table";
  text: string;
  level?: number;
  align?: "left" | "center" | "right";
  tableData?: {
    headers: string[][];
    rows: string[][];
  };
}

export interface PdfLayoutItem {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
  italic: boolean;
}

export interface ParsedDocument {
  pages: { 
    blocks: DocumentBlock[]; 
    layoutPage?: {
      width: number;
      height: number;
      items: PdfLayoutItem[];
    };
  }[];
}

export interface FormattedTextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

export interface RenderBlock {
  type: "heading" | "paragraph" | "list-item" | "table" | "image" | "code";
  level?: number;
  listType?: "bullet" | "number";
  listIndex?: number;
  listLevel?: number;
  segments?: FormattedTextSegment[];
  tableData?: {
    headers: string[][];
    rows: string[][];
  };
  text?: string;
  imgSrc?: string;
  imgElement?: HTMLImageElement;
}

interface FormattedChar {
  char: string;
  bold: boolean;
  italic: boolean;
}

interface PageElement {
  type: "text-line" | "table" | "image" | "heading" | "list-item-line" | "code-line";
  y: number;
  height: number;
  chars?: FormattedChar[];
  headingLevel?: number;
  isListItem?: boolean;
  listType?: "bullet" | "number";
  listIndex?: number;
  listLevel?: number;
  tableData?: {
    headers: string[][];
    rows: string[][];
  };
  imgElement?: HTMLImageElement;
}

export interface RenderPage {
  elements: PageElement[];
}

// ─── Presets ─────────────────────────────────────────────────────────────────
export const HANDWRITING_STYLES: HandwritingStyle[] = [
  {
    id: "caveat",
    name: "Santai",
    fontFamily: "Caveat, cursive",
    cssVariable: "var(--font-caveat)",
    baseFontSize: 22,
    lineHeightMultiplier: 1.8,
    naturalSlant: 0,
  },
  {
    id: "kalam",
    name: "Rapi",
    fontFamily: "Kalam, cursive",
    cssVariable: "var(--font-kalam)",
    baseFontSize: 20,
    lineHeightMultiplier: 1.9,
    naturalSlant: 1,
  },
  {
    id: "patrick-hand",
    name: "Cetak",
    fontFamily: "'Patrick Hand', cursive",
    cssVariable: "var(--font-patrick-hand)",
    baseFontSize: 21,
    lineHeightMultiplier: 1.85,
    naturalSlant: 0,
  },
  {
    id: "dancing-script",
    name: "Sambung",
    fontFamily: "'Dancing Script', cursive",
    cssVariable: "var(--font-dancing-script)",
    baseFontSize: 22,
    lineHeightMultiplier: 1.9,
    naturalSlant: 2,
  },
  {
    id: "shadows-into-light",
    name: "Kasual",
    fontFamily: "'Shadows Into Light', cursive",
    cssVariable: "var(--font-shadows-into-light)",
    baseFontSize: 23,
    lineHeightMultiplier: 1.85,
    naturalSlant: 0,
  },
  {
    id: "indie-flower",
    name: "Ceria",
    fontFamily: "'Indie Flower', cursive",
    cssVariable: "var(--font-indie-flower)",
    baseFontSize: 22,
    lineHeightMultiplier: 1.9,
    naturalSlant: -1,
  },
];

export const INK_COLORS: InkColor[] = [
  { id: "blue", name: "Pulpen Biru", color: "#1a3c8f", opacity: 0.92 },
  { id: "black", name: "Pulpen Hitam", color: "#1a1a1a", opacity: 0.95 },
  { id: "pencil", name: "Pensil", color: "#3a3a3a", opacity: 0.7 },
];

const IMPERFECTION_SCALE: Record<ImperfectionLevel, number> = {
  low: 0.4,
  medium: 1.0,
  high: 1.8,
};

// ─── Image Preloader ─────────────────────────────────────────────────────────
export async function preloadImages(html: string): Promise<Record<string, HTMLImageElement>> {
  if (typeof window === "undefined") return {};
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const imgs = Array.from(doc.querySelectorAll("img"));
  const cache: Record<string, HTMLImageElement> = {};

  await Promise.all(
    imgs.map((img) => {
      const src = img.getAttribute("src");
      if (!src) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const image = new Image();
        image.onload = () => {
          cache[src] = image;
          resolve();
        };
        image.onerror = () => resolve();
        image.src = src;
      });
    })
  );
  return cache;
}

// ─── HTML Block Parser ───────────────────────────────────────────────────────
export function parseHtmlToBlocks(html: string, imageCache: Record<string, HTMLImageElement> = {}): RenderBlock[] {
  if (typeof window === "undefined") return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: RenderBlock[] = [];

  function traverse(node: Node, currentListType?: "bullet" | "number", listCounter = { val: 1 }) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toUpperCase();

      if (tagName === "PRE" || tagName === "CODE") {
        blocks.push({
          type: "code",
          text: el.textContent || "",
        });
        return; // Skip children of preformatted elements
      }

      if (tagName === "H1" || tagName === "H2") {
        blocks.push({
          type: "heading",
          level: tagName === "H1" ? 1 : 2,
          segments: extractTextSegments(el),
        });
      } else if (tagName === "UL") {
        Array.from(el.childNodes).forEach((child) => traverse(child, "bullet"));
      } else if (tagName === "OL") {
        const counter = { val: 1 };
        Array.from(el.childNodes).forEach((child) => traverse(child, "number", counter));
      } else if (tagName === "LI") {
        // Calculate list nesting level in DOM tree
        let listLevel = 0;
        let parent = el.parentElement;
        while (parent) {
          const pTag = parent.tagName.toUpperCase();
          if (pTag === "UL" || pTag === "OL") {
            listLevel++;
          }
          parent = parent.parentElement;
        }
        listLevel = Math.max(0, listLevel - 1);

        blocks.push({
          type: "list-item",
          listType: currentListType || "bullet",
          listIndex: currentListType === "number" ? listCounter.val++ : undefined,
          listLevel,
          segments: extractTextSegments(el),
        });
      } else if (tagName === "TABLE") {
        const headers: string[][] = [];
        const rows: string[][] = [];
        
        el.querySelectorAll("tr").forEach((tr) => {
          const rowData: string[] = [];
          const isHeader = tr.querySelector("th") !== null;
          tr.querySelectorAll("td, th").forEach((cell) => {
            rowData.push(cell.textContent || "");
          });
          if (isHeader) {
            headers.push(rowData);
          } else if (rowData.length > 0) {
            rows.push(rowData);
          }
        });
        
        blocks.push({
          type: "table",
          tableData: { headers, rows },
        });
      } else if (tagName === "IMG") {
        const src = el.getAttribute("src") || "";
        if (src) {
          blocks.push({
            type: "image",
            imgSrc: src,
            imgElement: imageCache[src],
          });
        }
      } else if (tagName === "P" || tagName === "DIV") {
        const segments = extractTextSegments(el);
        if (segments.length > 0) {
          blocks.push({
            type: "paragraph",
            segments,
          });
        }
      } else {
        Array.from(el.childNodes).forEach((child) => traverse(child, currentListType, listCounter));
      }
    }
  }

  Array.from(doc.body.childNodes).forEach((child) => traverse(child));
  return blocks;
}

function extractTextSegments(el: HTMLElement): FormattedTextSegment[] {
  const segments: FormattedTextSegment[] = [];

  function walk(node: Node, bold = false, italic = false) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text) {
        segments.push({ text, bold, italic });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const childEl = node as HTMLElement;
      const tagName = childEl.tagName.toUpperCase();
      const isBold = bold || tagName === "B" || tagName === "STRONG";
      const isItalic = italic || tagName === "I" || tagName === "EM";
      Array.from(childEl.childNodes).forEach((child) => walk(child, isBold, isItalic));
    }
  }

  Array.from(el.childNodes).forEach((child) => walk(child));
  return segments;
}

// ─── Text wrapping for formatted segments ───────────────────────────────────
function wrapFormattedText(
  ctx: CanvasRenderingContext2D,
  segments: FormattedTextSegment[],
  fontSize: number,
  fontFamily: string,
  maxWidth: number
): FormattedChar[][] {
  ctx.font = `${fontSize}px ${fontFamily}`;

  const allChars: FormattedChar[] = [];
  for (const seg of segments) {
    for (const char of seg.text) {
      allChars.push({
        char,
        bold: seg.bold,
        italic: seg.italic,
      });
    }
  }

  if (allChars.length === 0) return [];

  const lines: FormattedChar[][] = [];
  let currentLine: FormattedChar[] = [];
  let currentWord: FormattedChar[] = [];
  let currentLineWidth = 0;
  let currentWordWidth = 0;

  const getCharWidth = (fc: FormattedChar) => {
    ctx.font = `${fc.bold ? "bold " : ""}${fontSize}px ${fontFamily}`;
    return ctx.measureText(fc.char).width;
  };

  for (const fc of allChars) {
    if (fc.char === "\n") {
      currentLine.push(...currentWord);
      lines.push(currentLine);
      currentLine = [];
      currentWord = [];
      currentLineWidth = 0;
      currentWordWidth = 0;
      continue;
    }

    if (/\s/.test(fc.char)) {
      const spaceWidth = getCharWidth(fc);
      if (currentLineWidth + currentWordWidth + spaceWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = [...currentWord, fc];
        currentLineWidth = currentWordWidth + spaceWidth;
      } else {
        currentLine.push(...currentWord, fc);
        currentLineWidth += currentWordWidth + spaceWidth;
      }
      currentWord = [];
      currentWordWidth = 0;
    } else {
      currentWord.push(fc);
      currentWordWidth += getCharWidth(fc);
    }
  }

  if (currentWord.length > 0) {
    if (currentLineWidth + currentWordWidth > maxWidth) {
      lines.push(currentLine);
      lines.push(currentWord);
    } else {
      currentLine.push(...currentWord);
      lines.push(currentLine);
    }
  } else if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [[]];
}

// ─── Layout Engine ───────────────────────────────────────────────────────────
export function layoutDocument(
  ctx: CanvasRenderingContext2D,
  blocks: RenderBlock[],
  config: RenderConfig
): RenderPage[] {
  const { pageHeight, marginTop, marginBottom, marginLeft, marginRight } = config;
  const writableWidth = config.pageWidth - marginLeft - marginRight;
  const lineSpacingDefault = config.lineSpacing || config.fontSize * config.style.lineHeightMultiplier;

  const pages: RenderPage[] = [];
  let currentElements: PageElement[] = [];
  let currentY = marginTop;

  const addPage = () => {
    pages.push({ elements: currentElements });
    currentElements = [];
    currentY = marginTop;
  };

  for (const block of blocks) {
    if (block.type === "heading") {
      const fontSize = config.fontSize * (block.level === 1 ? 1.4 : 1.2);
      const lineSpacing = fontSize * config.style.lineHeightMultiplier;
      const wrappedLines = wrapFormattedText(ctx, block.segments || [], fontSize, config.style.fontFamily, writableWidth);
      
      const topMargin = fontSize * 0.8;
      const bottomMargin = fontSize * 0.4;
      const blockHeight = topMargin + wrappedLines.length * lineSpacing + bottomMargin;

      if (currentY + blockHeight > pageHeight - marginBottom && currentElements.length > 0) {
        addPage();
      }

      currentY += topMargin;
      wrappedLines.forEach((line) => {
        currentElements.push({
          type: "heading",
          y: currentY + fontSize,
          height: lineSpacing,
          chars: line,
          headingLevel: block.level,
        });
        currentY += lineSpacing;
      });
      currentY += bottomMargin;

    } else if (block.type === "paragraph" || block.type === "list-item") {
      const isList = block.type === "list-item";
      const listLevel = block.listLevel || 0;
      const indent = isList ? 24 + listLevel * 20 : 0;
      const fontSize = config.fontSize;
      const lineSpacing = fontSize * config.style.lineHeightMultiplier;
      const wrappedLines = wrapFormattedText(ctx, block.segments || [], fontSize, config.style.fontFamily, writableWidth - indent);

      wrappedLines.forEach((line, idx) => {
        if (currentY + lineSpacing > pageHeight - marginBottom && currentElements.length > 0) {
          addPage();
        }

        currentElements.push({
          type: isList ? "list-item-line" : "text-line",
          y: currentY + fontSize,
          height: lineSpacing,
          chars: line,
          isListItem: isList,
          listType: block.listType,
          listIndex: idx === 0 ? block.listIndex : undefined,
          listLevel: isList ? listLevel : undefined,
        });
        currentY += lineSpacing;
      });
      currentY += fontSize * 0.3;

    } else if (block.type === "image") {
      if (!block.imgElement) continue;

      const img = block.imgElement;
      const imgWidth = Math.min(writableWidth, img.width || writableWidth);
      const scaleRatio = imgWidth / (img.width || 1);
      const imgHeight = (img.height || 150) * scaleRatio;

      const blockHeight = imgHeight + 20;

      if (currentY + blockHeight > pageHeight - marginBottom && currentElements.length > 0) {
        addPage();
      }

      currentElements.push({
        type: "image",
        y: currentY,
        height: imgHeight,
        imgElement: img,
      });
      currentY += blockHeight;

    } else if (block.type === "table") {
      if (!block.tableData) continue;

      const table = block.tableData;
      const layout = getTableLayout(ctx, table, writableWidth, config.fontSize, config.style.fontFamily);
      const tableHeight = layout.totalHeight;

      if (currentY + tableHeight > pageHeight - marginBottom && currentElements.length > 0) {
        addPage();
      }

      currentElements.push({
        type: "table",
        y: currentY,
        height: tableHeight,
        tableData: table,
      });
      currentY += tableHeight + 20;
    } else if (block.type === "code") {
      const codeText = block.text || "";
      const lines = codeText.split("\n");
      const fontSize = config.fontSize * 0.85;
      const lineSpacing = fontSize * 1.5;

      lines.forEach((lineText) => {
        const chars: FormattedChar[] = lineText.split("").map((c) => ({
          char: c,
          bold: false,
          italic: false,
        }));

        if (currentY + lineSpacing > pageHeight - marginBottom && currentElements.length > 0) {
          addPage();
        }

        currentElements.push({
          type: "code-line",
          y: currentY + fontSize,
          height: lineSpacing,
          chars,
        });
        currentY += lineSpacing;
      });
      currentY += fontSize * 0.4;
    }
  }

  if (currentElements.length > 0 || pages.length === 0) {
    pages.push({ elements: currentElements });
  }

  return pages;
}

// ─── Hand-drawn Table Rendering helpers ──────────────────────────────────────
function drawHanddrawnLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rng: () => number,
  color: string,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const segments = Math.max(2, Math.floor(length / 15));

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    
    const wave = (rng() - 0.5) * 1.5;
    const nx = -dy / length;
    const ny = dx / length;

    const targetX = px + nx * wave;
    const targetY = py + ny * wave;

    ctx.lineTo(targetX, targetY);
  }

  ctx.stroke();
  ctx.restore();
}

function wrapCellText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string
): string[] {
  ctx.font = `${fontSize}px ${fontFamily}`;
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? currentLine + " " + word : word;
    const testWidth = ctx.measureText(testLine).width;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [""];
}

interface TableLayoutInfo {
  colWidths: number[];
  rowHeights: number[];
  totalHeight: number;
  wrappedCells: string[][][];
}

function getTableLayout(
  ctx: CanvasRenderingContext2D,
  table: { headers: string[][]; rows: string[][] },
  width: number,
  fontSize: number,
  fontFamily: string
): TableLayoutInfo {
  const allRows = [...table.headers, ...table.rows];
  if (allRows.length === 0) {
    return { colWidths: [], rowHeights: [], totalHeight: 0, wrappedCells: [] };
  }

  const colCount = Math.max(...allRows.map((r) => r.length));
  const colWidths = Array(colCount).fill(width / colCount);
  const paddingX = 12;

  const wrappedCells: string[][][] = [];
  const rowHeights: number[] = [];
  let totalHeight = 0;

  allRows.forEach((row) => {
    const wrappedRow: string[][] = [];
    let maxLines = 1;

    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const cellText = row[colIdx] || "";
      const colW = colWidths[colIdx];
      const maxW = colW - paddingX * 2;
      const lines = wrapCellText(ctx, cellText, maxW, fontSize, fontFamily);
      wrappedRow.push(lines);
      if (lines.length > maxLines) {
        maxLines = lines.length;
      }
    }

    wrappedCells.push(wrappedRow);
    const rowH = maxLines * (fontSize * 1.35) + 16;
    rowHeights.push(rowH);
    totalHeight += rowH;
  });

  return { colWidths, rowHeights, totalHeight, wrappedCells };
}

function drawTable(
  ctx: CanvasRenderingContext2D,
  table: { headers: string[][]; rows: string[][] },
  x: number,
  y: number,
  width: number,
  fontSize: number,
  fontFamily: string,
  rng: () => number,
  color: string,
  resScale: number = 1.0
): number {
  const layout = getTableLayout(ctx, table, width, fontSize, fontFamily);
  if (layout.totalHeight === 0) return 0;

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "alphabetic";

  let currentY = y;
  const allRows = [...table.headers, ...table.rows];

  allRows.forEach((row, rowIdx) => {
    const rowH = layout.rowHeights[rowIdx];
    const isHeader = rowIdx < table.headers.length;
    const wrappedRow = layout.wrappedCells[rowIdx];

    // Background for header row
    if (isHeader) {
      ctx.save();
      ctx.fillStyle = "rgba(100, 100, 100, 0.05)";
      ctx.fillRect(x + 2, currentY + 2, width - 4, rowH - 4);
      ctx.restore();
    }

    row.forEach((_, colIdx) => {
      const colX = x + layout.colWidths.slice(0, colIdx).reduce((a, b) => a + b, 0);
      const colW = layout.colWidths[colIdx];
      const cellLines = wrappedRow[colIdx] || [""];

      ctx.save();
      ctx.fillStyle = color;
      ctx.font = `${isHeader ? "bold " : ""}${fontSize}px ${fontFamily}`;

      ctx.beginPath();
      ctx.rect(colX + 4, currentY + 2, colW - 8, rowH - 4);
      ctx.clip();

      const lineHeight = fontSize * 1.35;
      const totalTextH = cellLines.length * lineHeight;
      const startTextY = currentY + (rowH - totalTextH) / 2 + fontSize * 0.85;

      cellLines.forEach((lineText, lineIdx) => {
        ctx.fillText(lineText, colX + 10, startTextY + lineIdx * lineHeight);
      });

      ctx.restore();
    });

    currentY += rowH;
  });

  // Draw hand-drawn borders
  let runningY = y;
  for (let i = 0; i <= allRows.length; i++) {
    const isOuter = i === 0 || i === allRows.length;
    drawHanddrawnLine(ctx, x, runningY, x + width, runningY, rng, color, (isOuter ? 1.5 : 0.8) * resScale);
    if (i < allRows.length) {
      runningY += layout.rowHeights[i];
    }
  }

  let runningX = x;
  for (let i = 0; i <= layout.colWidths.length; i++) {
    const isOuter = i === 0 || i === layout.colWidths.length;
    drawHanddrawnLine(ctx, runningX, y, runningX, y + layout.totalHeight, rng, color, (isOuter ? 1.5 : 0.8) * resScale);
    if (i < layout.colWidths.length) {
      runningX += layout.colWidths[i];
    }
  }

  return layout.totalHeight;
}

// ─── Main Rendering Function ────────────────────────────────────────────────
export function renderHandwritingPage(
  ctx: CanvasRenderingContext2D,
  textOrHtml: string,
  config: RenderConfig,
  imageCache: Record<string, HTMLImageElement> = {}
): void {
  let html = textOrHtml;
  if (!textOrHtml.trim().startsWith("<")) {
    html = textOrHtml
      .split("\n")
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
  }

  const blocks = parseHtmlToBlocks(html, imageCache);
  const pages = layoutDocument(ctx, blocks, config);

  if (pages.length > 0) {
    renderPage(ctx, pages[0], config);
  }
}

export function renderLayoutPage(
  ctx: CanvasRenderingContext2D,
  layoutPage: { width: number; height: number; items: PdfLayoutItem[] },
  config: RenderConfig
): void {
  const rng = mulberry32(config.seed);
  const noise2d = createNoise2D(rng);
  const scale = IMPERFECTION_SCALE[config.imperfection];

  const scaleX = config.pageWidth / layoutPage.width;
  const scaleY = config.pageHeight / layoutPage.height;
  const scaleSize = (scaleX + scaleY) / 2;

  ctx.textBaseline = "alphabetic";

  // 1. Group items into logical lines based on Y coordinate proximity in canvas space
  const itemsWithY = layoutPage.items.map((item, idx) => {
    const rawCanvasY = config.pageHeight - (item.y * scaleY);
    const canvasX = item.x * scaleX;
    return { item, idx, rawCanvasY, canvasX };
  });

  const sortedItems = [...itemsWithY].sort((a, b) => a.rawCanvasY - b.rawCanvasY);
  
  interface LogicalLine {
    avgY: number;
    items: typeof itemsWithY;
  }
  
  const logicalLines: LogicalLine[] = [];
  const yTolerance = config.fontSize * 0.45; // Tolerance for items to be considered on the same line

  sortedItems.forEach((item) => {
    let foundLine = logicalLines.find(line => Math.abs(line.avgY - item.rawCanvasY) <= yTolerance);
    if (foundLine) {
      foundLine.items.push(item);
      foundLine.avgY = foundLine.items.reduce((sum, it) => sum + it.rawCanvasY, 0) / foundLine.items.length;
    } else {
      logicalLines.push({
        avgY: item.rawCanvasY,
        items: [item]
      });
    }
  });

  logicalLines.sort((a, b) => a.avgY - b.avgY);

  // 2. Map logical lines to snapped coordinates to prevent overlapping/collapsing
  const snappedLineY = new Map<number, number>();

  if (config.paper === "lined") {
    const spacing = config.lineSpacing || config.fontSize * config.style.lineHeightMultiplier;
    const y0 = config.marginTop + config.fontSize;
    let prevSnappedIndex: number | null = null;

    logicalLines.forEach((line) => {
      const idealIndex = Math.round((line.avgY - y0) / spacing);
      let snappedIndex = idealIndex;
      if (prevSnappedIndex !== null) {
        snappedIndex = Math.max(idealIndex, prevSnappedIndex + 1);
      }
      prevSnappedIndex = snappedIndex;
      const snappedY = y0 + snappedIndex * spacing;

      line.items.forEach((it) => {
        snappedLineY.set(it.idx, snappedY);
      });
    });
  } else if (config.paper === "grid") {
    const gridSize = 20;
    let prevSnappedY: number | null = null;

    logicalLines.forEach((line) => {
      const idealY = Math.round(line.avgY / gridSize) * gridSize;
      let snappedY = idealY;
      if (prevSnappedY !== null) {
        snappedY = Math.max(idealY, prevSnappedY + gridSize);
      }
      prevSnappedY = snappedY;

      line.items.forEach((it) => {
        snappedLineY.set(it.idx, snappedY);
      });
    });
  } else {
    // Plain paper (no snapping)
    logicalLines.forEach((line) => {
      line.items.forEach((it) => {
        snappedLineY.set(it.idx, it.rawCanvasY);
      });
    });
  }

  layoutPage.items.forEach((item, idx) => {
    const canvasY = snappedLineY.get(idx) ?? (config.pageHeight - (item.y * scaleY));
    const canvasX = item.x * scaleX;
    
    // Allow the user to scale 1:1 text sizes using the global fontSize configuration (baseline 22px)
    const fontScaleFactor = config.fontSize / 22;
    const baseFontSize = item.fontSize * scaleSize * fontScaleFactor;
    let currentX = canvasX;
    const text = item.text;

    // Apply baseline slant/wave to the entire item block
    const baselineOffset = noise2d(idx * 0.3, 0) * 2 * scale;
    const itemSlant = (noise2d(idx * 0.7, 1.5) * 1.0 + config.style.naturalSlant) * scale;
    const itemSlantRad = (itemSlant * Math.PI) / 180;

    for (let charIdx = 0; charIdx < text.length; charIdx++) {
      const char = text[charIdx];

      const rotJitter = noise2d(charIdx * 0.5, idx * 0.3) * 4 * scale;
      const yJitter = noise2d(charIdx * 0.4 + 10, idx * 0.2) * 2.5 * scale;
      const sizeJitter = 1 + noise2d(charIdx * 0.6 + 20, idx * 0.4) * 0.05 * scale;
      const spacingJitter = noise2d(charIdx * 0.3 + 30, idx * 0.5) * 1.0 * scale;

      const fontSize = baseFontSize * sizeJitter;
      const italicSlant = item.italic ? 12 : 0;

      ctx.font = `${fontSize}px ${config.style.fontFamily}`;
      
      const opacityJitter = config.ink.opacity - Math.abs(noise2d(charIdx * 0.8, idx * 0.6)) * 0.12 * scale;
      const resScale = config.resolutionScale || 1.0;
      const widthJitter = 1 * (1 + noise2d(charIdx * 0.9 + 50, idx * 0.7) * 0.15 * scale) * resScale;

      ctx.globalAlpha = Math.max(0.5, Math.min(1, opacityJitter));
      ctx.fillStyle = config.ink.color;

      if (config.ink.id === "pencil") {
        ctx.shadowColor = "rgba(60,60,60,0.3)";
        ctx.shadowBlur = 1.2 * scale;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      const slopeOffset = (currentX - canvasX) * Math.tan(itemSlantRad);
      const charX = currentX + spacingJitter;
      const charY = canvasY + baselineOffset + yJitter + slopeOffset;

      ctx.save();
      ctx.translate(charX, charY);
      ctx.rotate(((rotJitter + italicSlant) * Math.PI) / 180);
      ctx.lineWidth = widthJitter;

      if (config.ink.id !== "pencil" && scale > 0.6) {
        ctx.strokeStyle = config.ink.color;
        ctx.lineWidth = 0.3 * widthJitter;
        ctx.globalAlpha = Math.max(0.3, opacityJitter * 0.4);
        ctx.strokeText(char, 0, 0);
        ctx.globalAlpha = Math.max(0.5, Math.min(1, opacityJitter));
      }

      ctx.fillText(char, 0, 0);
      ctx.restore();

      const charWidth = ctx.measureText(char).width;
      currentX += charWidth + spacingJitter * 0.5;
    }
  });

  // Human imperfections overlay
  if (scale >= 1.0) {
    const blotCount = Math.floor(rng() * 3 * scale);
    const writableWidth = config.pageWidth - config.marginLeft - config.marginRight;
    for (let i = 0; i < blotCount; i++) {
      const bx = config.marginLeft + rng() * writableWidth;
      const by = config.marginTop + rng() * (config.pageHeight - config.marginTop - config.marginBottom);
      const br = 0.5 + rng() * 1.5;
      ctx.save();
      ctx.globalAlpha = 0.15 + rng() * 0.15;
      ctx.fillStyle = config.ink.color;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Reset
  ctx.globalAlpha = 1;
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}


function renderPage(
  ctx: CanvasRenderingContext2D,
  page: RenderPage,
  config: RenderConfig
) {
  const rng = mulberry32(config.seed);
  const noise2d = createNoise2D(rng);
  const scale = IMPERFECTION_SCALE[config.imperfection];

  const { pageWidth, pageHeight, marginLeft, marginRight, marginTop, marginBottom } = config;
  const writableWidth = pageWidth - marginLeft - marginRight;

  ctx.textBaseline = "alphabetic";

  page.elements.forEach((el, lineIdx) => {
    if (el.type === "heading" || el.type === "text-line" || el.type === "list-item-line" || el.type === "code-line") {
      const chars = el.chars || [];
      const isCode = el.type === "code-line";
      let currentX = marginLeft;
      
      if (el.type === "list-item-line") {
        const listLevel = el.listLevel || 0;
        const indent = 24 + listLevel * 20;
        currentX += indent;
        
        if (el.listIndex !== undefined) {
          ctx.save();
          ctx.font = `${config.fontSize}px ${config.style.fontFamily}`;
          ctx.fillStyle = config.ink.color;
          
          let prefix = "";
          if (el.listType === "number") {
            prefix = `${el.listIndex}. `;
          } else {
            if (listLevel === 0) {
              prefix = "• ";
            } else if (listLevel === 1) {
              prefix = "– ";
            } else {
              prefix = "▪ ";
            }
          }
          
          ctx.fillText(prefix, marginLeft + indent - 16, el.y);
          ctx.restore();
        }
      } else if (isCode) {
        currentX += 16;
      }

      const baselineOffset = noise2d(lineIdx * 0.3, 0) * 3 * scale;
      const lineSlant = (noise2d(lineIdx * 0.7, 1.5) * 1.5 + config.style.naturalSlant) * scale;
      const lineSlantRad = (lineSlant * Math.PI) / 180;

      for (let charIdx = 0; charIdx < chars.length; charIdx++) {
        const fc = chars[charIdx];

        const rotJitter = noise2d(charIdx * 0.5, lineIdx * 0.3) * 4 * scale * (isCode ? 0.25 : 1);
        const yJitter = noise2d(charIdx * 0.4 + 10, lineIdx * 0.2) * 2.5 * scale * (isCode ? 0.25 : 1);
        const sizeJitter = 1 + noise2d(charIdx * 0.6 + 20, lineIdx * 0.4) * 0.07 * scale * (isCode ? 0.4 : 1);
        const spacingJitter = noise2d(charIdx * 0.3 + 30, lineIdx * 0.5) * 1.5 * scale * (isCode ? 0.1 : 1);

        const baseFontSize = el.type === "heading" 
          ? config.fontSize * (el.headingLevel === 1 ? 1.4 : 1.2) 
          : (isCode ? config.fontSize * 0.85 : config.fontSize);
        const fontSize = baseFontSize * sizeJitter;
        const italicSlant = fc.italic ? 12 : 0;

        ctx.font = `${fontSize}px ${config.style.fontFamily}`;
        
        const opacityJitter = config.ink.opacity - Math.abs(noise2d(charIdx * 0.8, lineIdx * 0.6)) * 0.12 * scale;
        const resScale = config.resolutionScale || 1.0;
        const widthJitter = 1 * (1 + noise2d(charIdx * 0.9 + 50, lineIdx * 0.7) * 0.15 * scale) * resScale;

        ctx.globalAlpha = Math.max(0.5, Math.min(1, opacityJitter));
        ctx.fillStyle = config.ink.color;

        if (config.ink.id === "pencil") {
          ctx.shadowColor = "rgba(60,60,60,0.3)";
          ctx.shadowBlur = 1.2 * scale;
        } else {
          ctx.shadowColor = "transparent";
          ctx.shadowBlur = 0;
        }

        const slopeOffset = (currentX - marginLeft) * Math.tan(lineSlantRad);
        const charX = currentX + spacingJitter;
        const charY = el.y + baselineOffset + yJitter + (isCode ? 0 : slopeOffset);

        ctx.save();
        ctx.translate(charX, charY);
        ctx.rotate((((isCode ? 0 : rotJitter) + italicSlant) * Math.PI) / 180);
        ctx.lineWidth = widthJitter;

        if (config.ink.id !== "pencil" && scale > 0.6) {
          ctx.strokeStyle = config.ink.color;
          ctx.lineWidth = 0.3 * widthJitter;
          ctx.globalAlpha = Math.max(0.3, opacityJitter * 0.4);
          ctx.strokeText(fc.char, 0, 0);
          ctx.globalAlpha = Math.max(0.5, Math.min(1, opacityJitter));
        }

        ctx.fillText(fc.char, 0, 0);
        ctx.restore();

        const charWidth = isCode ? (config.fontSize * 0.48) : ctx.measureText(fc.char).width;
        currentX += charWidth + spacingJitter * 0.5;
      }
    } else if (el.type === "image" && el.imgElement) {
      const img = el.imgElement;
      const imgWidth = Math.min(writableWidth, img.width || writableWidth);
      const scaleRatio = imgWidth / (img.width || 1);
      const imgHeight = (img.height || 150) * scaleRatio;

      ctx.save();
      ctx.drawImage(el.imgElement, marginLeft, el.y, imgWidth, imgHeight);
      ctx.restore();
    } else if (el.type === "table" && el.tableData) {
      drawTable(
        ctx,
        el.tableData,
        marginLeft,
        el.y,
        writableWidth,
        config.fontSize,
        config.style.fontFamily,
        rng,
        config.ink.color,
        config.resolutionScale || 1.0
      );
    }
  });

  if (scale >= 1.0) {
    const blotCount = Math.floor(rng() * 3 * scale);
    for (let i = 0; i < blotCount; i++) {
      const bx = marginLeft + rng() * writableWidth;
      const by = marginTop + rng() * (pageHeight - marginTop - marginBottom);
      const br = 0.5 + rng() * 1.5;
      ctx.save();
      ctx.globalAlpha = 0.15 + rng() * 0.15;
      ctx.fillStyle = config.ink.color;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.globalAlpha = 1;
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

// ─── Calculate how many pages needed ────────────────────────────────────────
export function calculatePageCount(
  textOrHtml: string,
  config: RenderConfig
): number {
  if (typeof window === "undefined") return 1;
  const canvas = document.createElement("canvas");
  canvas.width = config.pageWidth;
  canvas.height = config.pageHeight;
  const ctx = canvas.getContext("2d")!;

  let html = textOrHtml;
  if (!textOrHtml.trim().startsWith("<")) {
    html = textOrHtml
      .split("\n")
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
  }

  const blocks = parseHtmlToBlocks(html);
  const pages = layoutDocument(ctx, blocks, config);
  return Math.max(1, pages.length);
}

// ─── Split text/html into pages ─────────────────────────────────────────────
export function splitTextIntoPages(
  textOrHtml: string,
  config: RenderConfig
): string[] {
  if (typeof window === "undefined") return [""];
  const canvas = document.createElement("canvas");
  canvas.width = config.pageWidth;
  canvas.height = config.pageHeight;
  const ctx = canvas.getContext("2d")!;

  let html = textOrHtml;
  if (!textOrHtml.trim().startsWith("<")) {
    html = textOrHtml
      .split("\n")
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("");
  }

  const blocks = parseHtmlToBlocks(html);
  const pages = layoutDocument(ctx, blocks, config);
  return pages.map((page) => serializePageToHtml(page));
}

function serializePageToHtml(page: RenderPage): string {
  return page.elements
    .map((el) => {
      if (el.type === "heading") {
        const tag = el.headingLevel === 1 ? "h1" : "h2";
        return `<${tag}>${serializeChars(el.chars || [])}</${tag}>`;
      }
      if (el.type === "list-item-line") {
        return `<li>${serializeChars(el.chars || [])}</li>`;
      }
      if (el.type === "text-line") {
        return `<p>${serializeChars(el.chars || [])}</p>`;
      }
      if (el.type === "image" && el.imgElement) {
        return `<img src="${el.imgElement.src}" alt="Image" />`;
      }
      if (el.type === "table" && el.tableData) {
        const table = el.tableData;
        const headersHtml = table.headers
          .map((row) => `<tr>${row.map((cell) => `<th>${cell}</th>`).join("")}</tr>`)
          .join("");
        const rowsHtml = table.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
          .join("");
        return `<table>${headersHtml}${rowsHtml}</table>`;
      }
      return "";
    })
    .join("");
}

function serializeChars(chars: FormattedChar[]): string {
  let html = "";
  let inBold = false;
  let inItalic = false;

  for (const fc of chars) {
    if (fc.bold && !inBold) {
      html += "<strong>";
      inBold = true;
    } else if (!fc.bold && inBold) {
      html += "</strong>";
      inBold = false;
    }

    if (fc.italic && !inItalic) {
      html += "<em>";
      inItalic = true;
    } else if (!fc.italic && inItalic) {
      html += "</em>";
      inItalic = false;
    }

    html += escapeHtml(fc.char);
  }

  if (inBold) html += "</strong>";
  if (inItalic) html += "</em>";

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
