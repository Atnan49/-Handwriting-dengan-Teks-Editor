import { jsPDF } from "jspdf";

/**
 * Export a single canvas as an image blob.
 */
export async function exportCanvasAsImage(
  canvas: HTMLCanvasElement,
  format: "png" | "jpeg" = "png",
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image blob"));
      },
      `image/${format}`,
      quality
    );
  });
}

/**
 * Export multiple canvases as a combined PDF.
 */
export async function exportCanvasesAsPdf(
  canvases: HTMLCanvasElement[],
  filename: string = "tulistangan-output.pdf"
): Promise<Blob> {
  if (canvases.length === 0) throw new Error("No pages to export");

  const firstCanvas = canvases[0];
  const widthMm = (firstCanvas.width / 96) * 25.4; // px to mm at 96 DPI
  const heightMm = (firstCanvas.height / 96) * 25.4;

  const pdf = new jsPDF({
    orientation: widthMm > heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [widthMm, heightMm],
  });

  for (let i = 0; i < canvases.length; i++) {
    if (i > 0) pdf.addPage([widthMm, heightMm]);

    const imgData = canvases[i].toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", 0, 0, widthMm, heightMm);
  }

  return pdf.output("blob");
}

/**
 * Trigger a file download in the browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export a single page and download.
 */
export async function downloadPageAsImage(
  canvas: HTMLCanvasElement,
  pageNumber: number,
  format: "png" | "jpeg" = "png"
): Promise<void> {
  const blob = await exportCanvasAsImage(canvas, format);
  const ext = format === "jpeg" ? "jpg" : "png";
  downloadBlob(blob, `tulistangan-hal${pageNumber}.${ext}`);
}

/**
 * Export all pages as PDF and download.
 */
export async function downloadAllAsPdf(
  canvases: HTMLCanvasElement[]
): Promise<void> {
  const blob = await exportCanvasesAsPdf(canvases);
  downloadBlob(blob, "tulistangan-output.pdf");
}
