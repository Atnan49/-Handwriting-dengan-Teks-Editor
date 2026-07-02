import type { DocumentBlock, ParsedDocument } from "./handwritingEngine";

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
    const textContent = await page.getTextContent();

    const blocks = extractBlocks(textContent);
    parsedDoc.pages.push({ blocks });
  }

  return parsedDoc;
}

/**
 * Extracts text items from PDF page and groups them into blocks.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBlocks(textContent: any): DocumentBlock[] {
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

  // 2. Deduplicate items (remove duplicated text from bold rendering or overlapping elements)
  const items: any[] = [];
  for (let i = 0; i < sortedItems.length; i++) {
    const current = sortedItems[i];
    if (items.length === 0) {
      items.push(current);
      continue;
    }

    const prev = items[items.length - 1];
    const sameText = current.str.trim() === prev.str.trim();
    const closeY = Math.abs(current.transform[5] - prev.transform[5]) <= 2;
    const closeX = Math.abs(current.transform[4] - prev.transform[4]) <= 5;

    // Skip duplicate if it is at the exact same location (bold/shadow effect)
    if (sameText && closeY && closeX) {
      continue;
    }

    items.push(current);
  }

  if (items.length === 0) return [];

  const blocks: DocumentBlock[] = [];
  let currentText = "";
  let lastY: number | null = null;
  let lastFontSize = 0;
  const fontSizes: number[] = [];

  // Collect all font sizes to determine body vs heading
  for (const item of items) {
    const fontSize = Math.abs(item.transform[0]);
    fontSizes.push(fontSize);
  }

  const medianFontSize = getMedian(fontSizes);

  for (const item of items) {
    const str = item.str;
    const y = item.transform[5]; // vertical position
    const fontSize = Math.abs(item.transform[0]);

    // Detect line break (Y position changed significantly)
    const isNewLine = lastY !== null && Math.abs(y - lastY) > fontSize * 0.5;

    if (isNewLine && currentText.trim()) {
      blocks.push(classifyBlock(currentText.trim(), lastFontSize, medianFontSize));
      currentText = "";
    }

    if (str.trim() !== "" || currentText.length > 0) {
      currentText += str;
    }

    lastY = y;
    lastFontSize = fontSize;
  }

  // Push remaining text
  if (currentText.trim()) {
    blocks.push(classifyBlock(currentText.trim(), lastFontSize, medianFontSize));
  }

  return blocks;
}

function classifyBlock(
  text: string,
  fontSize: number,
  medianFontSize: number
): DocumentBlock {
  // Check for list item patterns
  const listMatch = text.match(/^(\s*)([\-•\*\d]+[\.\)]\s*)/);
  if (listMatch) {
    return {
      type: "list-item",
      text: text.replace(/^(\s*)([\-•\*\d]+[\.\)]\s*)/, ""),
      level: 0,
    };
  }

  // Check if it's a heading (larger font than median)
  if (fontSize > medianFontSize * 1.2) {
    const level = fontSize > medianFontSize * 1.6 ? 1 : fontSize > medianFontSize * 1.3 ? 2 : 3;
    return {
      type: "heading",
      text,
      level,
    };
  }

  return { type: "paragraph", text };
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
        html += `<${tag}>${escapeHtml(block.text)}</${tag}>`;
      } else {
        html += `<p>${escapeHtml(block.text)}</p>`;
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
