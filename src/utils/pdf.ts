import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export interface ParsedPdfResult {
  fileName: string;
  fileSizeBytes: number;
  pageCount: number;
  extractedText: string;
  base64Data: string;
}

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function validateAndReadPdf(file: File): Promise<ParsedPdfResult> {
  const isPdfMime = file.type === 'application/pdf';
  const hasPdfExt = file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfMime && !hasPdfExt) {
    throw new Error('Please select a PDF file (.pdf). Other file formats are not supported for upload.');
  }

  if (file.size === 0) {
    throw new Error('The selected PDF file is empty (0 bytes). Please upload a valid resume PDF.');
  }

  if (file.size > MAX_PDF_BYTES) {
    throw new Error('The selected PDF exceeds the 10 MB limit. Please upload a smaller file or paste your resume text.');
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check for %PDF- magic header within the first 1024 bytes
  const headerText = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(1024, bytes.length)));
  if (!headerText.includes('%PDF-')) {
    throw new Error('This file is not a valid readable PDF document. Please upload an authentic PDF or paste your resume text.');
  }

  const base64Data = arrayBufferToBase64(buffer);

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: bytes.slice(),
      useSystemFonts: true,
    });
    const pdfDoc = await loadingTask.promise;

    if (!pdfDoc || pdfDoc.numPages < 1) {
      throw new Error('The uploaded PDF contains no pages.');
    }

    const pageTexts: string[] = [];
    const maxPages = Math.min(pdfDoc.numPages, 25);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const strings = textContent.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .filter((s) => s.length > 0);
      if (strings.length > 0) {
        pageTexts.push(strings.join(' '));
      }
    }

    const extractedText = pageTexts.join('\n\n').replace(/[ \t]+/g, ' ').trim();

    return {
      fileName: file.name,
      fileSizeBytes: file.size,
      pageCount: pdfDoc.numPages,
      extractedText,
      base64Data,
    };
  } catch (err) {
    const errObj = err as { name?: string; message?: string };
    if (errObj?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected and cannot be read. Please upload an unlocked PDF or paste your resume text.');
    }
    if (errObj?.name === 'InvalidPDFException' || errObj?.name === 'MissingPDFException') {
      throw new Error('This PDF appears corrupted or unreadable. Please try exporting it again or paste your resume text.');
    }
    if (err instanceof Error && err.message.includes('contains no pages')) {
      throw err;
    }
    throw new Error('Unable to read this PDF file. Please ensure it is not corrupted or encrypted, or paste your resume text directly.');
  }
}
