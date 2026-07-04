import type { DocumentBlock, ParsedDocument } from "./handwritingEngine";

function isOverlapDuplicate(a: any, b: any): boolean {
  const diffY = Math.abs(a.y - b.y);
  if (diffY > 4) return false;

  const tA = a.text;
  const tB = b.text;

  // 1. If texts are identical and coordinates are close
  if (tA.trim() === tB.trim()) {
    return Math.abs(a.x - b.x) <= 25;
  }

  // 2. Substring check
  if (tA.length >= tB.length) {
    const idx = tA.indexOf(tB);
    if (idx !== -1) {
      const wA = a.width || (tA.length * a.fontSize * 0.5);
      const expectedX = a.x + (idx / tA.length) * wA;
      if (Math.abs(b.x - expectedX) <= Math.max(25, a.fontSize * 1.2)) {
        return true; // b is a duplicate of a subsegment of a
      }
    }
  } else {
    const idx = tB.indexOf(tA);
    if (idx !== -1) {
      const wB = b.width || (tB.length * b.fontSize * 0.5);
      const expectedX = b.x + (idx / tB.length) * wB;
      if (Math.abs(a.x - expectedX) <= Math.max(25, b.fontSize * 1.2)) {
        return true; // a is a duplicate of a subsegment of b
      }
    }
  }

  return false;
}

function isExtractOverlapDuplicate(a: any, b: any): boolean {
  const diffY = Math.abs(a.transform[5] - b.transform[5]);
  if (diffY > 4) return false;

  const tA = a.str;
  const tB = b.str;
  const fsA = a.width ? (a.width / tA.length) : 12;
  const fsB = b.width ? (b.width / tB.length) : 12;

  // 1. Identical text and close coordinates
  if (tA.trim() === tB.trim()) {
    return Math.abs(a.transform[4] - b.transform[4]) <= 25;
  }

  // 2. Substring check
  if (tA.length >= tB.length) {
    const idx = tA.indexOf(tB);
    if (idx !== -1) {
      const wA = a.width || (tA.length * fsA);
      const expectedX = a.transform[4] + (idx / tA.length) * wA;
      if (Math.abs(b.transform[4] - expectedX) <= Math.max(25, fsA * 1.2)) {
        return true;
      }
    }
  } else {
    const idx = tB.indexOf(tA);
    if (idx !== -1) {
      const wB = b.width || (tB.length * fsB);
      const expectedX = b.transform[4] + (idx / tB.length) * wB;
      if (Math.abs(a.transform[4] - expectedX) <= Math.max(25, fsB * 1.2)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Extracts structured text from a PDF file.
 * Uses dynamic import of pdfjs-dist to avoid SSR issues (DOMMatrix not available in Node.js).
 * Returns a ParsedDocument with blocks per page.
 */
export async function parsePdf(file: File): Promise<ParsedDocument> {
  // Dynamic import to avoid SSR — pdfjs-dist requires browser APIs
  const pdfjsLib = await import("pdfjs-dist");

  // Set worker source to the local file copied to public/
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const parsedDoc: ParsedDocument = { pages: [] };

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const blocks = extractBlocks(textContent, viewport.width);

    const rawLayoutItems = textContent.items
      .filter((item: any) => typeof item.str === "string" && item.str.trim() !== "")
      .map((item: any) => {
        const fontSize = Math.abs(item.transform[0]);
        const fontName = item.fontName?.toLowerCase() || "";
        const bold = fontName.includes("bold") || fontName.includes("black") || fontName.includes("w7") || false;
        const italic = fontName.includes("italic") || fontName.includes("oblique") || item.transform[2] !== 0 || false;
        return {
          text: item.str,
          x: item.transform[4],
          y: item.transform[5],
          fontSize,
          bold,
          italic,
          width: item.width || 0,
        };
      });

    // 1. Sort layout items: top-to-bottom (Y descending), then left-to-right (X ascending)
    const sortedLayoutItems = [...rawLayoutItems].sort((a: any, b: any) => {
      const yA = a.y;
      const yB = b.y;
      const xA = a.x;
      const xB = b.x;

      if (Math.abs(yA - yB) <= 3) {
        return xA - xB;
      }
      return yB - yA;
    });

    // 2. Deduplicate layout items (remove duplicate draws from bold text simulation in PDFs or duplicate layers)
    const uniqueLayoutItems: any[] = [];
    for (let i = 0; i < sortedLayoutItems.length; i++) {
      const current = sortedLayoutItems[i];
      
      // Look backward for any existing item that is physically close
      let foundDuplicateIdx = -1;
      for (let j = uniqueLayoutItems.length - 1; j >= 0; j--) {
        const item = uniqueLayoutItems[j];
        const diffY = Math.abs(current.y - item.y);
        
        // Since list is sorted by Y, if we go too far vertically, we can stop searching
        if (diffY > 12) {
          break;
        }
        
        const diffX = Math.abs(current.x - item.x);
        if (diffY <= 4 && diffX <= 15) {
          foundDuplicateIdx = j;
          break;
        }
      }

      if (foundDuplicateIdx !== -1) {
        const prev = uniqueLayoutItems[foundDuplicateIdx];
        // They occupy the same spot. Keep the longer text.
        if (current.text.length > prev.text.length) {
          const merged = { ...current };
          if (prev.bold) merged.bold = true;
          if (prev.italic) merged.italic = true;
          uniqueLayoutItems[foundDuplicateIdx] = merged;
        } else {
          if (current.bold) prev.bold = true;
          if (current.italic) prev.italic = true;
        }
      } else {
        uniqueLayoutItems.push(current);
      }
    }

    // 3. Merge close text items on the same line to form complete words/sentences
    const layoutItems: any[] = [];
    for (const current of uniqueLayoutItems) {
      if (layoutItems.length === 0) {
        layoutItems.push(current);
        continue;
      }

      const prev = layoutItems[layoutItems.length - 1];
      const closeY = Math.abs(current.y - prev.y) <= 3;
      const prevWidth = prev.width || (prev.text.length * prev.fontSize * 0.5);
      const gap = current.x - (prev.x + prevWidth);
      const mergeThreshold = prev.fontSize * 0.8;

      if (closeY && gap >= -5 && gap < mergeThreshold) {
        const needsSpace = gap > prev.fontSize * 0.25 && !prev.text.endsWith(" ") && !current.text.startsWith(" ");
        prev.text += (needsSpace ? " " : "") + current.text;
        prev.width = current.x + (current.width || 0) - prev.x;
        if (current.bold) prev.bold = true;
        if (current.italic) prev.italic = true;
      } else {
        layoutItems.push(current);
      }
    }

    parsedDoc.pages.push({
      blocks,
      layoutPage: {
        width: viewport.width,
        height: viewport.height,
        items: layoutItems,
      },
    });
  }

  return parsedDoc;
}

/**
 * Extracts text items from PDF page and groups them into blocks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBlocks(textContent: any, pageWidth = 595): DocumentBlock[] {
  const rawItems = textContent.items.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => typeof item.str === "string"
  );

  if (rawItems.length === 0) return [];

  // 1. Sort items: top-to-bottom (Y descending), then left-to-right (X ascending)
  // PDF coordinate system has Y = 0 at the bottom.
  const sortedItems = [...rawItems].sort((a: any, b: any) => {
    const yA = a.transform[5];
    const yB = b.transform[5];
    const xA = a.transform[4];
    const xB = b.transform[4];

    // Tolerance of 3px for items on the same line
    if (Math.abs(yA - yB) <= 3) {
      return xA - xB;
    }
    return yB - yA;
  });

  // 2. Deduplicate items (remove duplicated text from bold rendering, overlapping layers, or duplicate OCR text)
  const items: any[] = [];
  for (let i = 0; i < sortedItems.length; i++) {
    const current = sortedItems[i];
    
    // Look backward for any existing item that is physically close
    let foundDuplicateIdx = -1;
    for (let j = items.length - 1; j >= 0; j--) {
      const item = items[j];
      const diffY = Math.abs(current.transform[5] - item.transform[5]);
      
      // Since list is sorted by Y, we can break early if we go too far vertically
      if (diffY > 12) {
        break;
      }
      
      const diffX = Math.abs(current.transform[4] - item.transform[4]);
      if (diffY <= 4 && diffX <= 15) {
        foundDuplicateIdx = j;
        break;
      }
    }

    if (foundDuplicateIdx !== -1) {
      const prev = items[foundDuplicateIdx];
      // Keep the one with longer text
      if (current.str.length > prev.str.length) {
        items[foundDuplicateIdx] = current;
      }
    } else {
      items.push(current);
    }
  }

  if (items.length === 0) return [];

  interface PdfLineItem {
    x: number;
    str: string;
    width: number;
    fontSize: number;
  }

  interface PdfLine {
    y: number;
    fontSize: number;
    items: PdfLineItem[];
  }

  // 1. Group items by Y coordinate into lines (tolerance of 3px)
  const lines: PdfLine[] = [];
  const fontSizes: number[] = [];

  for (const item of items) {
    const x = item.transform[4];
    const y = item.transform[5];
    const str = item.str;
    const fontSize = Math.abs(item.transform[0]);
    const width = item.width || 0;

    fontSizes.push(fontSize);

    let foundLine = lines.find((l) => Math.abs(l.y - y) <= 3);
    if (!foundLine) {
      foundLine = { y, fontSize, items: [] };
      lines.push(foundLine);
    }
    foundLine.items.push({ x, str, width, fontSize });
  }

  // Sort lines top-to-bottom (Y descending)
  lines.sort((a, b) => b.y - a.y);

  // Sort items inside lines left-to-right (X ascending)
  lines.forEach((line) => {
    line.items.sort((a, b) => a.x - b.x);
  });

  const medianFontSize = getMedian(fontSizes);

  // 2. Reconstruct cell-blocks per line (merging adjacent letters/words)
  interface PdfMergedCell {
    x: number;
    text: string;
    width: number;
  }

  const processedLines: { y: number; fontSize: number; cells: PdfMergedCell[] }[] = [];

  for (const line of lines) {
    const cells: PdfMergedCell[] = [];
    if (line.items.length === 0) continue;

    let currentCell = {
      x: line.items[0].x,
      text: line.items[0].str,
      width: line.items[0].width,
    };

    for (let i = 1; i < line.items.length; i++) {
      const item = line.items[i];
      const prevXEnd = currentCell.x + currentCell.width;
      
      const gap = item.x - prevXEnd;
      // If gap is small, merge into same word/phrase
      const mergeThreshold = line.fontSize * 1.6;

      if (gap < mergeThreshold) {
        const needsSpace = gap > line.fontSize * 0.3 && !currentCell.text.endsWith(" ") && !item.str.startsWith(" ");
        currentCell.text += (needsSpace ? " " : "") + item.str;
        currentCell.width = item.x + item.width - currentCell.x;
      } else {
        cells.push(currentCell);
        currentCell = {
          x: item.x,
          text: item.str,
          width: item.width,
        };
      }
    }
    cells.push(currentCell);
    processedLines.push({ y: line.y, fontSize: line.fontSize, cells });
  }

  // 3. Detect consecutive lines forming tables (lines with >= 2 cells)
  const blocks: DocumentBlock[] = [];
  let i = 0;

  while (i < processedLines.length) {
    let tableLinesCount = 0;
    while (
      i + tableLinesCount < processedLines.length &&
      processedLines[i + tableLinesCount].cells.length >= 2
    ) {
      tableLinesCount++;
    }

    if (tableLinesCount >= 2) {
      const tableLines = processedLines.slice(i, i + tableLinesCount);
      i += tableLinesCount;

      const headers: string[][] = [tableLines[0].cells.map((c) => c.text.trim())];
      const rows: string[][] = [];
      for (let r = 1; r < tableLines.length; r++) {
        rows.push(tableLines[r].cells.map((c) => c.text.trim()));
      }

      blocks.push({
        type: "table",
        text: "",
        tableData: { headers, rows },
      });
    } else {
      const line = processedLines[i];
      const text = line.cells.map((c) => c.text).join(" ").trim();
      const lineX = line.cells[0]?.x || 0;
      const lineWidth = line.cells.reduce((sum, c) => sum + c.width, 0);

      if (text) {
        blocks.push(classifyBlock(text, line.fontSize, medianFontSize, lineX, lineWidth, pageWidth));
      }
      i++;
    }
  }

  return blocks;
}

function classifyBlock(
  text: string,
  fontSize: number,
  medianFontSize: number,
  x = 0,
  width = 0,
  pageWidth = 595
): DocumentBlock {
  const listMatch = text.match(/^(\s*)([\-•\*\d]+[\.\)]\s*)/);

  // Detect if text block is horizontally centered on the PDF page
  const cellCenter = x + width / 2;
  const pageCenter = pageWidth / 2;
  const isCentered = width > 0 && width < pageWidth * 0.75 && Math.abs(cellCenter - pageCenter) < 40;

  if (listMatch) {
    return {
      type: "list-item",
      text: text.replace(/^(\s*)([\-•\*\d]+[\.\)]\s*)/, ""),
      level: 0,
    };
  }

  if (fontSize > medianFontSize * 1.2) {
    const level = fontSize > medianFontSize * 1.6 ? 1 : fontSize > medianFontSize * 1.3 ? 2 : 3;
    return {
      type: "heading",
      text,
      level,
      align: isCentered ? "center" : "left",
    };
  }

  return { 
    type: "paragraph", 
    text,
    align: isCentered ? "center" : "left",
  };
}

function getMedian(arr: number[]): number {
  if (arr.length === 0) return 12;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Converts ParsedDocument blocks to a clean HTML string.
 */
export function blocksToHtml(blocks: DocumentBlock[]): string {
  let insideList = false;
  let html = "";

  for (const block of blocks) {
    if (block.type === "list-item") {
      if (!insideList) {
        html += "<ul>";
        insideList = true;
      }
      html += `<li>${escapeHtml(block.text)}</li>`;
    } else {
      if (insideList) {
        html += "</ul>";
        insideList = false;
      }
      if (block.type === "heading") {
        const tag = block.level === 1 ? "H1" : "H2";
        const alignStyle = block.align === "center" ? ' style="text-align: center;"' : "";
        html += `<${tag}${alignStyle}>${escapeHtml(block.text)}</${tag}>`;
      } else if (block.type === "table" && block.tableData) {
        const table = block.tableData;
        const headersHtml = table.headers
          .map((row) => `<tr>${row.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr>`)
          .join("");
        const rowsHtml = table.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
          .join("");
        html += `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #ddd;">${headersHtml}${rowsHtml}</table><p><br></p>`;
      } else {
        const alignStyle = block.align === "center" ? ' style="text-align: center;"' : "";
        html += `<p${alignStyle}>${escapeHtml(block.text)}</p>`;
      }
    }
  }

  if (insideList) {
    html += "</ul>";
  }

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
