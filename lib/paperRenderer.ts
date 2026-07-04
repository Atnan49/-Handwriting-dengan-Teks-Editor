import type { PaperType, RenderConfig } from "./handwritingEngine";
import { createNoise2D } from "simplex-noise";

/**
 * Renders the paper background (texture + lines/grid) onto a canvas context.
 * Called BEFORE the handwriting render so text is drawn on top.
 */
export function renderPaperBackground(
  ctx: CanvasRenderingContext2D,
  config: RenderConfig
): void {
  const { pageWidth, pageHeight, paper } = config;

  // 1. Base paper fill
  ctx.fillStyle = getPaperColor(paper);
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  // 2. Paper texture (subtle noise)
  renderPaperTexture(ctx, pageWidth, pageHeight, config.seed);

  // 3. Lines or grid
  switch (paper) {
    case "lined":
      renderLinedPaper(ctx, config);
      break;
    case "grid":
      renderGridPaper(ctx, config);
      break;
    case "plain":
      // No additional lines
      break;
  }
}

function getPaperColor(paper: PaperType): string {
  switch (paper) {
    case "lined":
      return "#faf8f0"; // warm off-white like notebook
    case "grid":
      return "#f5f5f0"; // slightly cooler
    case "plain":
      return "#fdfcf7"; // clean off-white HVS
  }
}

function renderPaperTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number
): void {
  const noise2d = createNoise2D(() => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  });

  // Use ImageData for performance
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const step = 2; // sample every 2 pixels for performance
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const n = noise2d(x * 0.02, y * 0.02);
      const grain = Math.floor(n * 6); // very subtle ±6 brightness

      for (let dy = 0; dy < step && y + dy < height; dy++) {
        for (let dx = 0; dx < step && x + dx < width; dx++) {
          const idx = ((y + dy) * width + (x + dx)) * 4;
          data[idx] = Math.max(0, Math.min(255, data[idx] + grain));
          data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + grain));
          data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + grain));
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function renderLinedPaper(
  ctx: CanvasRenderingContext2D,
  config: RenderConfig
): void {
  const { pageWidth, pageHeight, marginLeft, marginTop, marginBottom, lineSpacing, fontSize } = config;
  const spacing = lineSpacing || fontSize * config.style.lineHeightMultiplier;

  const resScale = config.resolutionScale || 1.0;

  // Red margin line
  ctx.strokeStyle = "rgba(220, 80, 80, 0.35)";
  ctx.lineWidth = 1.5 * resScale;
  ctx.beginPath();
  ctx.moveTo(marginLeft - 8, 0);
  ctx.lineTo(marginLeft - 8, pageHeight);
  ctx.stroke();

  // Horizontal blue lines
  ctx.strokeStyle = "rgba(120, 160, 220, 0.25)";
  ctx.lineWidth = 0.8 * resScale;

  let y = marginTop + fontSize; // first baseline
  while (y < pageHeight - marginBottom) {
    ctx.beginPath();
    ctx.moveTo(0, y + spacing * 0.15); // slightly below baseline for visual
    ctx.lineTo(pageWidth, y + spacing * 0.15);
    ctx.stroke();
    y += spacing;
  }

  // Header line (thicker)
  ctx.strokeStyle = "rgba(120, 160, 220, 0.4)";
  ctx.lineWidth = 1.2 * resScale;
  ctx.beginPath();
  ctx.moveTo(0, marginTop - 4);
  ctx.lineTo(pageWidth, marginTop - 4);
  ctx.stroke();
}

function renderGridPaper(
  ctx: CanvasRenderingContext2D,
  config: RenderConfig
): void {
  const { pageWidth, pageHeight } = config;
  const gridSize = 20; // 5mm grid at ~4px/mm

  const resScale = config.resolutionScale || 1.0;

  ctx.strokeStyle = "rgba(150, 180, 210, 0.2)";
  ctx.lineWidth = 0.5 * resScale;

  // Vertical lines
  for (let x = gridSize; x < pageWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, pageHeight);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = gridSize; y < pageHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(pageWidth, y);
    ctx.stroke();
  }

  // Thicker lines every 5 cells (1cm)
  ctx.strokeStyle = "rgba(150, 180, 210, 0.35)";
  ctx.lineWidth = 0.8 * resScale;
  for (let x = gridSize * 5; x < pageWidth; x += gridSize * 5) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, pageHeight);
    ctx.stroke();
  }
  for (let y = gridSize * 5; y < pageHeight; y += gridSize * 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(pageWidth, y);
    ctx.stroke();
  }
}

/**
 * Applies photo-like effect overlays (vignette, slight shadow, subtle rotation).
 * Called AFTER everything is rendered.
 */
export function renderPhotoEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Vignette
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.35,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.08)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Shadow from top-right (like a desk lamp)
  const shadowGrad = ctx.createLinearGradient(width, 0, 0, height);
  shadowGrad.addColorStop(0, "rgba(0,0,0,0)");
  shadowGrad.addColorStop(1, "rgba(0,0,0,0.03)");
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, width, height);
}
