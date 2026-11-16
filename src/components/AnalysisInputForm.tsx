import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { formatFileSize, validateAndReadPdf, type ParsedPdfResult } from '../utils/pdf';

export type ResumeInputMode = 'pdf' | 'text';

interface AnalysisInputFormProps {
  resumeMode: ResumeInputMode;
  onResumeModeChange: (mode: ResumeInputMode) => void;
  parsedPdf: ParsedPdfResult | null;
  onParsedPdfChange: (pdf: ParsedPdfResult | null) => void;
  resumeText: string;
  onResumeTextChange: (text: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (text: string) => void;
  isAnalyzing: boolean;
  errorMessage: string | null;
  onClearError: () => void;
  onSubmit: () => void;
}

export function AnalysisInputForm({
  resumeMode,
  onResumeModeChange,
  parsedPdf,
  onParsedPdfChange,
  resumeText,
  onResumeTextChange,
  jobDescription,
  onJobDescriptionChange,
  isAnalyzing,
  errorMessage,
  onClearError,
  onSubmit,
}: AnalysisInputFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showExtractedPreview, setShowExtractedPreview] = useState(false);

  const handleFileSelection = async (file: File | undefined) => {
    if (!file) return;
    setPdfError(null);
    onClearError();
    setIsReadingPdf(true);
    setShowExtractedPreview(false);

    try {
      const result = await validateAndReadPdf(file);
      onParsedPdfChange(result);
    } catch (err) {
      onParsedPdfChange(null);
      setPdfError(
        err instanceof Error
          ? err.message
          : 'Unable to read the selected PDF. Please upload a valid PDF or paste your resume text.'
      );
    } finally {
      setIsReadingPdf(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isAnalyzing || isReadingPdf) return;
    const droppedFile = e.dataTransfer.files?.[0];
    void handleFileSelection(droppedFile);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAnalyzing && !isReadingPdf) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
      {/* Intro Heading */}
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
          Compare your resume against any job description
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Upload a PDF resume or paste your resume text alongside the target role description to receive a
          skills gap breakdown, keyword match analysis, and tailored improvement recommendations.
        </p>
      </div>

      {/* Global Submission / API Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-xl border border-rose-500/40 bg-rose-950/85 px-4 py-3.5 text-sm text-rose-100"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
            <p className="leading-relaxed font-medium">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={onClearError}
            aria-label="Dismiss error message"
            className="shrink-0 rounded-lg p-1 text-rose-300 hover:bg-rose-900/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Two-Column Input Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Panel: Resume Input */}
        <section
          aria-labelledby="resume-input-heading"
          className="flex flex-col rounded-xl border border-slate-800 bg-[#0F172A]/92 p-5 sm:p-6 shadow-lg transition-colors hover:border-indigo-500/50"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 id="resume-input-heading" className="text-base font-semibold text-white">
                1. Candidate Resume
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                PDF document or plain text
              </p>
            </div>

            {/* Segmented Mode Switch */}
            <div
              role="tablist"
              aria-label="Resume input method"
              className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-950/80 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={resumeMode === 'pdf'}
                disabled={isAnalyzing}
                onClick={() => {
                  onResumeModeChange('pdf');
                  onClearError();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  resumeMode === 'pdf'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Upload PDF
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={resumeMode === 'text'}
                disabled={isAnalyzing}
                onClick={() => {
                  onResumeModeChange('text');
                  setPdfError(null);
                  onClearError();
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  resumeMode === 'text'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Paste Text
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col pt-4">
            {resumeMode === 'pdf' ? (
              <div className="flex-1 flex flex-col justify-between gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={isAnalyzing || isReadingPdf}
                  onChange={(e) => void handleFileSelection(e.target.files?.[0])}
                  className="sr-only"
                  id="resume-pdf-upload"
                />

                {!parsedPdf ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`flex-1 min-h-[280px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
                      isDragging
                        ? 'border-indigo-400 bg-indigo-950/50'
                        : pdfError
                        ? 'border-rose-500/50 bg-rose-950/30'
                        : 'border-slate-700 bg-slate-950/55 hover:border-indigo-400/70 hover:bg-indigo-950/30'
                    }`}
                  >
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
                      {isReadingPdf ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Upload className="h-5 w-5" aria-hidden="true" />
                      )}
                    </div>

                    <p className="text-sm font-semibold text-white">
                      {isReadingPdf ? 'Validating PDF document...' : 'Drop your resume PDF here'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 max-w-xs leading-relaxed">
                      Standard or scanned PDF files up to 10 MB are supported.
                    </p>

                    <label
                      htmlFor="resume-pdf-upload"
                      className={`mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 border border-slate-700 hover:border-indigo-400 hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-within:ring-2 focus-within:ring-indigo-400 ${
                        isAnalyzing || isReadingPdf ? 'pointer-events-none opacity-60' : ''
                      }`}
                    >
                      Browse PDF file
                    </label>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-between rounded-xl border border-slate-700/80 bg-slate-950/65 p-4 sm:p-5">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                            <FileText className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {parsedPdf.fileName}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
                              <span>{formatFileSize(parsedPdf.fileSizeBytes)}</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {parsedPdf.pageCount} {parsedPdf.pageCount === 1 ? 'page' : 'pages'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isAnalyzing}
                          onClick={() => {
                            onParsedPdfChange(null);
                            setPdfError(null);
                            setShowExtractedPreview(false);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Remove
                        </button>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/60 px-3 py-2 text-xs text-emerald-200">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                        <span>
                          {parsedPdf.extractedText.length > 0
                            ? `Verified readable PDF (${parsedPdf.extractedText.length.toLocaleString()} characters extracted)`
                            : 'Verified PDF document (visual layout ready for analysis)'}
                        </span>
                      </div>

                      {parsedPdf.extractedText.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowExtractedPreview((prev) => !prev)}
                            className="text-xs font-medium text-indigo-300 hover:text-indigo-200 transition-colors cursor-pointer"
                          >
                            {showExtractedPreview ? 'Hide extracted text preview' : 'Preview extracted text'}
                          </button>

                          {showExtractedPreview && (
                            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {parsedPdf.extractedText.slice(0, 2000)}
                              {parsedPdf.extractedText.length > 2000 ? '…' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">Want to replace this file?</span>
                      <label
                        htmlFor="resume-pdf-upload"
                        className={`text-xs font-semibold text-indigo-300 hover:text-indigo-200 cursor-pointer whitespace-nowrap shrink-0 ${
                          isAnalyzing ? 'pointer-events-none opacity-50' : ''
                        }`}
                      >
                        Upload different PDF
                      </label>
                    </div>
                  </div>
                )}

                {pdfError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-950/80 px-3.5 py-2.5 text-xs text-rose-100"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="font-medium leading-relaxed">{pdfError}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setPdfError(null);
                          onResumeModeChange('text');
                        }}
                        className="font-semibold text-rose-300 underline underline-offset-2 hover:text-white cursor-pointer"
                      >
                        Switch to Paste Text instead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="resume-text-area" className="text-xs font-medium text-slate-300">
                    Paste full resume text
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 tabular-nums">
                      {resumeText.length.toLocaleString()} chars
                    </span>
                    {resumeText.length > 0 && (
                      <button
                        type="button"
                        disabled={isAnalyzing}
                        onClick={() => {
                          onResumeTextChange('');
                          onClearError();
                        }}
                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  id="resume-text-area"
                  value={resumeText}
                  disabled={isAnalyzing}
                  onChange={(e) => {
                    onResumeTextChange(e.target.value);
                    if (errorMessage) onClearError();
                  }}
                  placeholder="Paste your skills, work experience, education, certifications, and project highlights here..."
                  className="flex-1 min-h-[280px] w-full resize-y rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 leading-relaxed focus:bg-slate-950 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
                />
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Job Description */}
        <section
          aria-labelledby="jd-input-heading"
          className="flex flex-col rounded-xl border border-slate-800 bg-[#0F172A]/92 p-5 sm:p-6 shadow-lg transition-colors hover:border-indigo-500/50"
        >
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h2 id="jd-input-heading" className="text-base font-semibold text-white">
                2. Target Job Description
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Include role title, responsibilities, and required skills
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-slate-400 tabular-nums">
                {jobDescription.length.toLocaleString()} chars
              </span>
              {jobDescription.length > 0 && (
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => {
                    onJobDescriptionChange('');
                    onClearError();
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col pt-4">
            <label htmlFor="job-description-area" className="sr-only">
              Job Description Text
            </label>
            <textarea
              id="job-description-area"
              value={jobDescription}
              disabled={isAnalyzing}
              onChange={(e) => {
                onJobDescriptionChange(e.target.value);
                if (errorMessage) onClearError();
              }}
              placeholder="Paste the complete job posting here, including required skills, preferred qualifications, and key responsibilities..."
              className="flex-1 min-h-[304px] w-full resize-y rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 leading-relaxed focus:bg-slate-950 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
            />
          </div>
        </section>
      </div>

      {/* Primary Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0F172A]/92 px-5 py-4 shadow-lg">
        <p className="text-xs text-slate-400 leading-relaxed">
          Strict factual analysis: only skills, qualifications, and experience present in your resume are evaluated.
        </p>

        <button
          type="submit"
          disabled={isAnalyzing || isReadingPdf}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Analyzing Resume...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Analyze Resume</span>
            </>
          )}
        </button>
      </div>

      {/* Clean Loading Skeleton Preview while Gemini processes */}
      {isAnalyzing && (
        <div
          aria-live="polite"
          aria-label="Analyzing resume"
          className="rounded-xl border border-indigo-500/40 bg-[#0F172A]/95 p-6 space-y-5 shadow-lg"
        >
          <div className="flex items-center gap-3 text-sm font-medium text-indigo-300">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
            <span>Extracting skills, matching keywords, and generating improvement recommendations...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 rounded-lg bg-slate-800/80 animate-pulse" />
            <div className="h-20 rounded-lg bg-slate-800/80 animate-pulse" />
            <div className="h-20 rounded-lg bg-slate-800/80 animate-pulse" />
          </div>
        </div>
      )}
    </form>
  );
}
