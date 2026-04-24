type ParsedPdfSegment = {
  content: string;
  pageNumber?: number;
  wordCount: number;
};

export type ParsedPdfResult = {
  fullText: string;
  segments: ParsedPdfSegment[];
  coverImage: Blob | null;
};

const MAX_WORDS_PER_SEGMENT = 1200;

function countWords(text: string) {
  const normalized = text.trim();

  if (!normalized) {
    return 0;
  }

  return normalized.split(/\s+/).length;
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLongParagraph(paragraph: string, pageNumber: number) {
  const words = paragraph.split(/\s+/).filter(Boolean);
  const segments: ParsedPdfSegment[] = [];

  for (let start = 0; start < words.length; start += MAX_WORDS_PER_SEGMENT) {
    const content = words.slice(start, start + MAX_WORDS_PER_SEGMENT).join(" ").trim();

    if (!content) {
      continue;
    }

    segments.push({
      content,
      pageNumber,
      wordCount: countWords(content),
    });
  }

  return segments;
}

function buildSegmentsForPage(pageText: string, pageNumber: number) {
  const paragraphs = normalizeExtractedText(pageText)
    .split(/\n{1,2}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const segments: ParsedPdfSegment[] = [];
  let buffer: string[] = [];
  let bufferWordCount = 0;

  const flushBuffer = () => {
    if (!buffer.length) {
      return;
    }

    const content = buffer.join("\n\n").trim();

    if (!content) {
      buffer = [];
      bufferWordCount = 0;
      return;
    }

    segments.push({
      content,
      pageNumber,
      wordCount: countWords(content),
    });

    buffer = [];
    bufferWordCount = 0;
  };

  for (const paragraph of paragraphs) {
    const paragraphWordCount = countWords(paragraph);

    if (!paragraphWordCount) {
      continue;
    }

    if (paragraphWordCount > MAX_WORDS_PER_SEGMENT) {
      flushBuffer();
      segments.push(...splitLongParagraph(paragraph, pageNumber));
      continue;
    }

    if (bufferWordCount + paragraphWordCount > MAX_WORDS_PER_SEGMENT) {
      flushBuffer();
    }

    buffer.push(paragraph);
    bufferWordCount += paragraphWordCount;
  }

  flushBuffer();

  return segments;
}

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();
  }

  return pdfjs;
}

async function toUint8Array(input: File | Blob | ArrayBuffer) {
  if (input instanceof ArrayBuffer) {
    return new Uint8Array(input);
  }

  return new Uint8Array(await input.arrayBuffer());
}

type PdfPage = {
  getViewport: (options: { scale: number }) => { width: number; height: number };
  render: (options: {
    canvasContext: unknown;
    viewport: { width: number; height: number };
  }) => { promise: Promise<void> };
};

async function renderCoverInBrowser(page: PdfPage) {
  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas rendering is not available in this browser.");
  }

  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!blob) {
    throw new Error("Failed to convert rendered PDF cover to PNG.");
  }

  return blob;
}

type TextItem = { str?: string; hasEOL?: boolean };

type StreamTextContentPage = {
  streamTextContent?: (options?: unknown) => {
    getReader: () => {
      read: () => Promise<{
        done: boolean;
        value?: { items?: TextItem[] };
      }>;
    };
  };
  getTextContent: (options?: unknown) => Promise<{ items: TextItem[] }>;
};

async function readTextItems(page: unknown): Promise<TextItem[]> {
  const typed = page as StreamTextContentPage;

  if (typeof typed.streamTextContent === "function") {
    const stream = typed.streamTextContent();
    const reader = stream.getReader();
    const items: TextItem[] = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (value?.items?.length) {
        items.push(...value.items);
      }
    }

    return items;
  }

  const content = await typed.getTextContent();
  return content.items;
}

function extractPageText(items: Array<{ str?: string; hasEOL?: boolean }>) {
  const fragments: string[] = [];

  for (const item of items) {
    const text = item.str?.trim();

    if (text) {
      fragments.push(text);
    }

    if (item.hasEOL) {
      fragments.push("\n");
    } else if (text) {
      fragments.push(" ");
    }
  }

  return normalizeExtractedText(fragments.join(""));
}

export async function parsePdf(file: File | Blob | ArrayBuffer): Promise<ParsedPdfResult> {
  const pdfjs = await loadPdfJs();
  const data = await toUint8Array(file);
  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,
    disableStream: true,
    disableAutoFetch: true,
    isEvalSupported: false,
    useSystemFonts: true,
  } as never);

  const pdfDocument = await loadingTask.promise;
  const segments: ParsedPdfSegment[] = [];
  const pagesText: string[] = [];
  let coverImage: Blob | null = null;

  try {
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const items = await readTextItems(page);
      const pageText = extractPageText(items);

      if (pageText) {
        pagesText.push(pageText);
        segments.push(...buildSegmentsForPage(pageText, pageNumber));
      }

      if (pageNumber === 1) {
        try {
          coverImage =
            typeof window === "undefined"
              ? null
              : await renderCoverInBrowser(page as unknown as PdfPage);
        } catch {
          coverImage = null;
        }
      }
    }
  } finally {
    await pdfDocument.destroy();
  }

  return {
    fullText: normalizeExtractedText(pagesText.join("\n\n")),
    segments,
    coverImage,
  };
}
