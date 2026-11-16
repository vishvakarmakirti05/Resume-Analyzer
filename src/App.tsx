import { useState } from 'react';
import { FileCheck2, RotateCcw } from 'lucide-react';
import { AnalysisInputForm, type ResumeInputMode } from './components/AnalysisInputForm';
import { DynamicBackdrop, type BackdropPhase } from './components/DynamicBackdrop';
import { ResultsDashboard } from './components/ResultsDashboard';
import type { AnalyzeRequestPayload, ResumeAnalysisResult } from './types/analysis';
import type { ParsedPdfResult } from './utils/pdf';

function getChromeClasses(phase: BackdropPhase, matchScore?: number): string {
  if (phase === 'results') {
    const score = matchScore ?? 0;
    if (score >= 80) return 'border-emerald-500/25 bg-[#06211C]/95 text-emerald-100/80';
    if (score >= 60) return 'border-teal-500/25 bg-[#071F27]/95 text-teal-100/80';
    if (score >= 40) return 'border-amber-500/25 bg-[#20180B]/95 text-amber-100/80';
    return 'border-rose-500/25 bg-[#220E15]/95 text-rose-100/80';
  }
  if (phase === 'jd-only') {
    return 'border-violet-500/25 bg-[#150F26]/95 text-slate-300';
  }
  if (phase === 'ready' || phase === 'analyzing') {
    return 'border-indigo-500/30 bg-[#0E1633]/95 text-slate-300';
  }
  if (phase === 'resume-only') {
    return 'border-indigo-500/25 bg-[#0C1329]/95 text-slate-300';
  }
  return 'border-slate-800/90 bg-[#0B1120]/95 text-slate-400';
}

export default function App() {
  const [resumeMode, setResumeMode] = useState<ResumeInputMode>('pdf');
  const [parsedPdf, setParsedPdf] = useState<ParsedPdfResult | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);

  const hasResume =
    (resumeMode === 'pdf' && Boolean(parsedPdf)) ||
    (resumeMode === 'text' && resumeText.trim().length > 0);
  const hasJobDescription = jobDescription.trim().length > 0;

  let backdropPhase: BackdropPhase = 'empty';
  if (analysisResult) {
    backdropPhase = 'results';
  } else if (isAnalyzing) {
    backdropPhase = 'analyzing';
  } else if (hasResume && hasJobDescription) {
    backdropPhase = 'ready';
  } else if (hasResume) {
    backdropPhase = 'resume-only';
  } else if (hasJobDescription) {
    backdropPhase = 'jd-only';
  }

  const handleAnalyze = async () => {
    setErrorMessage(null);

    if (resumeMode === 'pdf' && !parsedPdf) {
      setErrorMessage('Please upload a readable PDF resume, or switch to Paste Text.');
      return;
    }

    const trimmedResume = resumeText.trim();
    if (resumeMode === 'text') {
      if (!trimmedResume) {
        setErrorMessage('Please paste your resume text before analyzing.');
        return;
      }
      if (trimmedResume.length < 30) {
        setErrorMessage('Your resume text is too short. Please paste your full resume (at least 30 characters).');
        return;
      }
    }

    const trimmedJd = jobDescription.trim();
    if (!trimmedJd) {
      setErrorMessage('Please paste the target job description before analyzing.');
      return;
    }
    if (trimmedJd.length < 30) {
      setErrorMessage('The job description is too short. Please paste at least 30 characters.');
      return;
    }

    const payload: AnalyzeRequestPayload = {
      jobDescription: trimmedJd,
      ...(resumeMode === 'pdf' && parsedPdf
        ? {
            resumePdfBase64: parsedPdf.base64Data,
            resumeFileName: parsedPdf.fileName,
            resumeText: parsedPdf.extractedText || undefined,
          }
        : {
            resumeText: trimmedResume,
          }),
    };

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: unknown = null;
      try {
        data = await response.json();
      } catch {
        // Non-JSON response fallback
      }

      if (!response.ok) {
        const apiError =
          data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
            ? data.error
            : `Analysis failed (HTTP ${response.status}). Please try again.`;
        setErrorMessage(apiError);
        return;
      }

      if (!data || typeof data !== 'object' || !('matchScore' in data)) {
        setErrorMessage('Received an incomplete analysis response. Please try again.');
        return;
      }

      setAnalysisResult(data as ResumeAnalysisResult);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setErrorMessage('Unable to reach the analysis service. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setParsedPdf(null);
    setResumeText('');
    setJobDescription('');
    setErrorMessage(null);
    setResumeMode('pdf');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chromeClasses = getChromeClasses(backdropPhase, analysisResult?.matchScore);

  return (
    <div className="relative min-h-screen flex flex-col text-slate-100">
      {/* 2D Dynamic Atmospheric Backdrop reacting to user details and match results */}
      <DynamicBackdrop phase={backdropPhase} matchScore={analysisResult?.matchScore} />

      {/* Top Bar */}
      <header className={`sticky top-0 z-20 border-b transition-colors duration-500 ${chromeClasses}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white">
              AI Resume Analyzer
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {analysisResult && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Analyze another resume</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {analysisResult ? (
          <ResultsDashboard result={analysisResult} onReset={handleReset} />
        ) : (
          <AnalysisInputForm
            resumeMode={resumeMode}
            onResumeModeChange={setResumeMode}
            parsedPdf={parsedPdf}
            onParsedPdfChange={setParsedPdf}
            resumeText={resumeText}
            onResumeTextChange={setResumeText}
            jobDescription={jobDescription}
            onJobDescriptionChange={setJobDescription}
            isAnalyzing={isAnalyzing}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            onSubmit={() => void handleAnalyze()}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className={`relative z-10 border-t transition-colors duration-500 ${chromeClasses}`}>
        <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 lg:px-8 py-4 text-xs">
          <span>AI Resume Analyzer</span>
          <span>Factual evaluation grounded strictly in your submitted resume</span>
        </div>
      </footer>
    </div>
  );
}
