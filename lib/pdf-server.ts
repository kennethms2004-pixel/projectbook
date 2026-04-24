import "server-only";

import type { ParsedPdfResult } from "@/lib/pdf";

type PdfPage = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: {
    canvasContext: unknown;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

async function loadPdfJs() {
  return import("pdfjs-dist/legacy/build/pdf.mjs");
}

async function toUint8Array(input: File | Blob | ArrayBuffer) {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  return new Uint8Array(await input.arrayBuffer());
}

async function renderCoverOnServer(page: PdfPage) {
  const { createCanvas } = await import("@napi-rs/canvas");
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");

  await page.render({
    canvasContext: context as never,
    viewport,
  }).promise;

  const pngBuffer = canvas.toBuffer("image/png");
  const pngBytes = new Uint8Array(pngBuffer);

  return new Blob([pngBytes], { type: "image/png" });
}

export async function renderPdfCoverOnServer(
  file: File | Blob | ArrayBuffer
): Promise<ParsedPdfResult["coverImage"]> {
  const pdfjs = await loadPdfJs();
  const data = await toUint8Array(file);
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    useSystemFonts: true,
  } as never);

  const pdfDocument = await loadingTask.promise;

  try {
    const firstPage = await pdfDocument.getPage(1);

    return await renderCoverOnServer(firstPage as unknown as PdfPage);
  } catch {
    return null;
  } finally {
    await pdfDocument.destroy();
  }
}
