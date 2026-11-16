import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  FileSearch,
  GraduationCap,
  KeyRound,
  Lightbulb,
  RotateCcw,
  Search,
  Target,
  X,
} from 'lucide-react';
import type { ResumeAnalysisResult } from '../types/analysis';

interface ResultsDashboardProps {
  result: ResumeAnalysisResult;
  onReset: () => void;
}

type SkillViewFilter = 'all' | 'matching' | 'missing';
type ExtractedViewMode = 'both' | 'resume' | 'jd';

function getScoreRating(score: number): {
  label: string;
  badgeClass: string;
  strokeColor: string;
  barColor: string;
} {
  if (score >= 80) {
    return {
      label: 'Strong Match',
      badgeClass: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40',
      strokeColor: '#34D399',
      barColor: 'bg-emerald-500',
    };
  }
  if (score >= 60) {
    return {
      label: 'Good Potential',
      badgeClass: 'bg-teal-950/90 text-teal-200 border-teal-400/40',
      strokeColor: '#2DD4BF',
      barColor: 'bg-teal-400',
    };
  }
  if (score >= 40) {
    return {
      label: 'Moderate Match',
      badgeClass: 'bg-amber-950/90 text-amber-200 border-amber-500/40',
      strokeColor: '#FBBF24',
      barColor: 'bg-amber-400',
    };
  }
  return {
    label: 'Low Match',
    badgeClass: 'bg-rose-950/90 text-rose-200 border-rose-500/40',
    strokeColor: '#FB7185',
    barColor: 'bg-rose-500',
  };
}

function getResultSurfaceTheme(score: number): {
  card: string;
  banner: string;
  innerSurface: string;
  divider: string;
  mutedText: string;
  ringTrack: string;
  barTrack: string;
} {
  if (score >= 80) {
    return {
      card: 'border-emerald-500/25 bg-[#082620]/90',
      banner: 'border-emerald-500/30 bg-[#0A2D26]/95',
      innerSurface: 'border-emerald-500/25 bg-[#051A16]',
      divider: 'border-emerald-500/20 divide-emerald-500/20',
      mutedText: 'text-emerald-200/75',
      ringTrack: '#064E3B',
      barTrack: 'bg-emerald-950',
    };
  }
  if (score >= 60) {
    return {
      card: 'border-teal-500/25 bg-[#08232B]/90',
      banner: 'border-teal-500/30 bg-[#0A2A34]/95',
      innerSurface: 'border-teal-500/25 bg-[#05181E]',
      divider: 'border-teal-500/20 divide-teal-500/20',
      mutedText: 'text-teal-200/75',
      ringTrack: '#134E4A',
      barTrack: 'bg-teal-950',
    };
  }
  if (score >= 40) {
    return {
      card: 'border-amber-500/25 bg-[#251C0E]/90',
      banner: 'border-amber-500/30 bg-[#2C2111]/95',
      innerSurface: 'border-amber-500/25 bg-[#191208]',
      divider: 'border-amber-500/20 divide-amber-500/20',
      mutedText: 'text-amber-200/75',
      ringTrack: '#451A03',
      barTrack: 'bg-amber-950',
    };
  }
  return {
    card: 'border-rose-500/25 bg-[#271119]/90',
    banner: 'border-rose-500/30 bg-[#2E141D]/95',
    innerSurface: 'border-rose-500/25 bg-[#1B0A10]',
    divider: 'border-rose-500/20 divide-rose-500/20',
    mutedText: 'text-rose-200/75',
    ringTrack: '#4C0519',
    barTrack: 'bg-rose-950',
  };
}

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const [skillFilter, setSkillFilter] = useState<SkillViewFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSuggestions, setCompletedSuggestions] = useState<Record<number, boolean>>({});
  const [extractedView, setExtractedView] = useState<ExtractedViewMode>('both');
  const [expandedExperience, setExpandedExperience] = useState<Record<number, boolean>>({});
  const [activeDimension, setActiveDimension] = useState<string | null>(null);
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  const overallRating = getScoreRating(result.matchScore);
  const theme = getResultSurfaceTheme(result.matchScore);

  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (result.matchScore / 100) * ringCircumference;

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredMatchingSkills = useMemo(
    () =>
      result.skillsComparison.matchingSkills.filter((skill) =>
        normalizedQuery ? skill.toLowerCase().includes(normalizedQuery) : true
      ),
    [result.skillsComparison.matchingSkills, normalizedQuery]
  );

  const filteredMissingSkills = useMemo(
    () =>
      result.skillsComparison.missingSkills.filter((skill) =>
        normalizedQuery ? skill.toLowerCase().includes(normalizedQuery) : true
      ),
    [result.skillsComparison.missingSkills, normalizedQuery]
  );

  const filteredMatchedKeywords = useMemo(
    () =>
      result.keywordsComparison.matchedKeywords.filter((kw) =>
        normalizedQuery ? kw.toLowerCase().includes(normalizedQuery) : true
      ),
    [result.keywordsComparison.matchedKeywords, normalizedQuery]
  );

  const filteredMissingKeywords = useMemo(
    () =>
      result.keywordsComparison.missingKeywords.filter((kw) =>
        normalizedQuery ? kw.toLowerCase().includes(normalizedQuery) : true
      ),
    [result.keywordsComparison.missingKeywords, normalizedQuery]
  );

  const completedCount = useMemo(
    () => Object.values(completedSuggestions).filter(Boolean).length,
    [completedSuggestions]
  );

  const toggleSuggestion = (index: number) => {
    setCompletedSuggestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleExperience = (index: number) => {
    setExpandedExperience((prev) => ({
      ...prev,
      [index]: prev[index] === undefined ? false : !prev[index],
    }));
  };

  const handleCopyChecklist = async () => {
    const lines = [
      `AI Resume Analyzer — ${result.extractedResume.candidateName} vs ${result.extractedJobDescription.roleTitle}`,
      `Overall Match Score: ${result.matchScore}/100`,
      `Skills: ${result.comparisonScores.skills}/100 | Experience: ${result.comparisonScores.experience}/100 | Keywords: ${result.comparisonScores.keywords}/100`,
      '',
      `Missing Skills: ${result.skillsComparison.missingSkills.join(', ') || 'None'}`,
      `Missing Keywords: ${result.keywordsComparison.missingKeywords.join(', ') || 'None'}`,
      '',
      'Improvement Suggestions:',
      ...result.suggestions.map(
        (s, i) => `${i + 1}. [${s.category} · ${s.priority}] ${s.title}: ${s.action}`
      ),
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedChecklist(true);
      window.setTimeout(() => setCopiedChecklist(false), 2200);
    } catch {
      // Clipboard API unavailable
    }
  };

  const comparisonItems = [
    {
      id: 'skills',
      label: 'Skills Alignment',
      score: result.comparisonScores.skills,
      detail: `${result.skillsComparison.matchingSkills.length} matched · ${result.skillsComparison.missingSkills.length} missing`,
      targetId: 'skills-comparison-section',
    },
    {
      id: 'experience',
      label: 'Experience Relevance',
      score: result.comparisonScores.experience,
      detail: `${result.extractedResume.experience.length} ${
        result.extractedResume.experience.length === 1 ? 'role' : 'roles'
      } evaluated`,
      targetId: 'extracted-info-section',
    },
    {
      id: 'keywords',
      label: 'Keyword Coverage',
      score: result.comparisonScores.keywords,
      detail: `${result.keywordsComparison.matchedKeywords.length} matched · ${result.keywordsComparison.missingKeywords.length} missing`,
      targetId: 'keywords-section',
    },
  ];

  const handleDimensionClick = (id: string, targetId: string) => {
    setActiveDimension((prev) => (prev === id ? null : id));
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Results Header Bar */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border px-5 py-5 sm:px-6 shadow-md transition-colors duration-500 ${theme.banner}`}
      >
        <div className="space-y-1 min-w-0">
          <div className={`flex flex-wrap items-center gap-2 text-xs font-medium ${theme.mutedText}`}>
            <span>{result.extractedResume.candidateName}</span>
            <span aria-hidden="true">·</span>
            <span>{result.extractedJobDescription.roleTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-balance">
            Resume Match Analysis
          </h1>
        </div>

        <button
          type="button"
          onClick={onReset}
          className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold text-white hover:border-indigo-400 hover:bg-indigo-600 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer ${theme.innerSurface}`}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Analyze another resume</span>
        </button>
      </div>

      {/* Hero Row: Large Match Score Card + Comparison Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          aria-labelledby="overall-score-heading"
          className={`lg:col-span-5 rounded-xl border p-6 flex flex-col justify-between gap-5 shadow-md transition-colors duration-500 ${theme.card}`}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="overall-score-heading" className="text-base font-semibold text-white">
              Overall Match Score
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0 ${overallRating.badgeClass}`}
            >
              {result.matchScore >= 60 ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {overallRating.label}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-6 py-2">
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
              <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke={theme.ringTrack}
                  strokeWidth="10"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={ringRadius}
                  fill="none"
                  stroke={overallRating.strokeColor}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
                  {result.matchScore}
                </span>
                <span className={`text-xs font-medium tabular-nums ${theme.mutedText}`}>
                  out of 100
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed text-center sm:text-left lg:text-center xl:text-left">
              {result.summary}
            </p>
          </div>
        </section>

        <section
          aria-labelledby="category-scores-heading"
          className={`lg:col-span-7 rounded-xl border p-6 flex flex-col justify-between gap-5 shadow-md transition-colors duration-500 ${theme.card}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="category-scores-heading" className="text-base font-semibold text-white">
                Dimension Comparison
              </h2>
              <p className={`text-xs mt-0.5 ${theme.mutedText}`}>
                Click any dimension bar to jump to its detailed breakdown
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {comparisonItems.map((item) => {
              const barStyle = getScoreRating(item.score);
              const isSelected = activeDimension === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleDimensionClick(item.id, item.targetId)}
                  className={`w-full text-left rounded-lg p-2.5 -mx-2.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isSelected ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-white">{item.label}</span>
                        <span className={`ml-2.5 text-xs ${theme.mutedText}`}>{item.detail}</span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-white tabular-nums">
                        {item.score}/100
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={item.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={item.label}
                      className={`h-2.5 w-full overflow-hidden rounded-full ${theme.barTrack}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barStyle.barColor}`}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Interactive Filter & Search Toolbar for Skills and Keywords */}
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors duration-500 ${theme.card}`}
      >
        <div
          role="tablist"
          aria-label="Filter skills and keywords"
          className={`inline-flex items-center gap-1 rounded-lg border p-1 self-start sm:self-auto ${theme.innerSurface}`}
        >
          {(
            [
              { id: 'all', label: 'All Items' },
              { id: 'matching', label: 'Matched Only' },
              { id: 'missing', label: 'Missing Only' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={skillFilter === tab.id}
              onClick={() => setSkillFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                skillFilter === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter skills & keywords..."
            aria-label="Filter skills and keywords"
            className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 ${theme.innerSurface}`}
          />
        </div>
      </div>

      {/* Skills Comparison: Matching Skills (green tags) & Missing Skills (red tags) */}
      <div
        id="skills-comparison-section"
        className={`grid grid-cols-1 gap-6 ${
          skillFilter === 'all' ? 'md:grid-cols-2' : 'md:grid-cols-1'
        }`}
      >
        {skillFilter !== 'missing' && (
          <section
            aria-labelledby="matching-skills-heading"
            className={`rounded-xl border p-6 space-y-4 shadow-md transition-colors duration-500 ${theme.card}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <h2 id="matching-skills-heading" className="text-base font-semibold text-white">
                  Matching Skills
                </h2>
              </div>
              <span className={`font-mono text-xs font-medium tabular-nums ${theme.mutedText}`}>
                {filteredMatchingSkills.length} found
              </span>
            </div>

            {filteredMatchingSkills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {filteredMatchingSkills.map((skill, idx) => (
                  <li
                    key={`${skill}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/85 px-3 py-1.5 text-xs font-medium text-emerald-200"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm ${theme.mutedText}`}>
                {normalizedQuery
                  ? 'No matching skills match your current filter.'
                  : 'No direct required skill matches were identified in the resume.'}
              </p>
            )}
          </section>
        )}

        {skillFilter !== 'matching' && (
          <section
            aria-labelledby="missing-skills-heading"
            className={`rounded-xl border p-6 space-y-4 shadow-md transition-colors duration-500 ${theme.card}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" aria-hidden="true" />
                <h2 id="missing-skills-heading" className="text-base font-semibold text-white">
                  Missing Skills
                </h2>
              </div>
              <span className={`font-mono text-xs font-medium tabular-nums ${theme.mutedText}`}>
                {filteredMissingSkills.length} missing
              </span>
            </div>

            {filteredMissingSkills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {filteredMissingSkills.map((skill, idx) => (
                  <li
                    key={`${skill}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-950/85 px-3 py-1.5 text-xs font-medium text-rose-200"
                  >
                    <X className="h-3.5 w-3.5 shrink-0 text-rose-400" aria-hidden="true" />
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`text-sm ${theme.mutedText}`}>
                {normalizedQuery
                  ? 'No missing skills match your current filter.'
                  : 'No missing required skills detected against this job description.'}
              </p>
            )}
          </section>
        )}
      </div>

      {/* Interactive Improvement Suggestions Checklist Card */}
      <section
        aria-labelledby="suggestions-heading"
        className={`rounded-xl border p-6 space-y-5 shadow-md transition-colors duration-500 ${theme.card}`}
      >
        <div className={`flex flex-wrap items-center justify-between gap-4 pb-4 border-b ${theme.divider}`}>
          <div className="flex items-center gap-2.5">
            <Lightbulb className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden="true" />
            <div>
              <h2 id="suggestions-heading" className="text-base font-semibold text-white">
                Improvement Suggestions
              </h2>
              <p className={`text-xs ${theme.mutedText}`}>
                Click any recommendation to mark it as reviewed while updating your resume
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className={`font-mono text-xs font-medium tabular-nums ${theme.mutedText}`}>
              {completedCount} of {result.suggestions.length} addressed
            </span>
            <button
              type="button"
              onClick={() => void handleCopyChecklist()}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-slate-100 hover:border-indigo-400 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${theme.innerSurface}`}
            >
              {copiedChecklist ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  <span>Copied checklist</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Copy checklist</span>
                </>
              )}
            </button>
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.suggestions.map((suggestion, idx) => {
            const isChecked = Boolean(completedSuggestions[idx]);
            return (
              <li key={`${suggestion.title}-${idx}`}>
                <button
                  type="button"
                  onClick={() => toggleSuggestion(idx)}
                  aria-pressed={isChecked}
                  className={`w-full h-full text-left flex items-start gap-3.5 rounded-xl border p-4 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isChecked
                      ? 'border-emerald-500/40 bg-emerald-950/50'
                      : `${theme.innerSurface} hover:border-indigo-400/70`
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      isChecked
                        ? 'border-emerald-500 bg-emerald-600 text-white'
                        : 'border-slate-600 bg-transparent text-transparent'
                    }`}
                    aria-hidden="true"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className={`flex flex-wrap items-center gap-2 text-xs ${theme.mutedText}`}>
                      <span className="font-mono font-semibold text-indigo-300 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-200">{suggestion.category}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          suggestion.priority === 'High'
                            ? 'font-semibold text-indigo-300'
                            : theme.mutedText
                        }
                      >
                        {suggestion.priority} Priority
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-semibold ${
                        isChecked ? 'text-slate-400 line-through' : 'text-white'
                      }`}
                    >
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{suggestion.action}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Keywords Card */}
      <section
        id="keywords-section"
        aria-labelledby="keywords-heading"
        className={`rounded-xl border p-6 space-y-5 shadow-md transition-colors duration-500 ${theme.card}`}
      >
        <div className={`flex items-center gap-2.5 pb-4 border-b ${theme.divider}`}>
          <KeyRound className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden="true" />
          <div>
            <h2 id="keywords-heading" className="text-base font-semibold text-white">
              Keyword Alignment
            </h2>
            <p className={`text-xs ${theme.mutedText}`}>
              Domain terms, tools, and ATS keywords compared across both documents
            </p>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 gap-6 ${
            skillFilter === 'all' ? `md:grid-cols-2 md:divide-x ${theme.divider}` : 'md:grid-cols-1'
          }`}
        >
          {skillFilter !== 'missing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Matched Keywords</h3>
                <span className={`font-mono text-xs tabular-nums ${theme.mutedText}`}>
                  {filteredMatchedKeywords.length}
                </span>
              </div>
              {filteredMatchedKeywords.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {filteredMatchedKeywords.map((kw, idx) => (
                    <li
                      key={`${kw}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-md border border-indigo-400/40 bg-indigo-950/80 px-2.5 py-1 text-xs font-medium text-indigo-200"
                    >
                      <Check className="h-3 w-3 shrink-0 text-indigo-400" aria-hidden="true" />
                      <span>{kw}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-sm ${theme.mutedText}`}>No matched keywords found.</p>
              )}
            </div>
          )}

          {skillFilter !== 'matching' && (
            <div className={`space-y-3 ${skillFilter === 'all' ? 'md:pl-6' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">Missing Keywords</h3>
                <span className={`font-mono text-xs tabular-nums ${theme.mutedText}`}>
                  {filteredMissingKeywords.length}
                </span>
              </div>
              {filteredMissingKeywords.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {filteredMissingKeywords.map((kw, idx) => (
                    <li
                      key={`${kw}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/80 px-2.5 py-1 text-xs font-medium text-amber-200"
                    >
                      <AlertCircle className="h-3 w-3 shrink-0 text-amber-400" aria-hidden="true" />
                      <span>{kw}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-sm ${theme.mutedText}`}>
                  All target keywords are covered in the resume.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Extracted Information View Controls + Cards */}
      <div id="extracted-info-section" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-white">Extracted Document Details</h2>
          <div
            role="tablist"
            aria-label="Extracted document view"
            className={`inline-flex items-center gap-1 rounded-lg border p-1 ${theme.innerSurface}`}
          >
            {(
              [
                { id: 'both', label: 'Side by Side' },
                { id: 'resume', label: 'Resume Only' },
                { id: 'jd', label: 'Job Description Only' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={extractedView === tab.id}
                onClick={() => setExtractedView(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  extractedView === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`grid grid-cols-1 gap-6 items-start ${
            extractedView === 'both' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
          }`}
        >
          {extractedView !== 'jd' && (
            <section
              aria-labelledby="extracted-resume-heading"
              className={`rounded-xl border p-6 space-y-5 shadow-md transition-colors duration-500 ${theme.card}`}
            >
              <div className={`flex items-center gap-2.5 pb-4 border-b ${theme.divider}`}>
                <FileSearch className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden="true" />
                <div>
                  <h3 id="extracted-resume-heading" className="text-base font-semibold text-white">
                    Extracted from Resume
                  </h3>
                  <p className={`text-xs ${theme.mutedText}`}>
                    Candidate: {result.extractedResume.candidateName}
                  </p>
                </div>
              </div>

              <div className={`space-y-5 divide-y ${theme.divider}`}>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-200">Skills Found</h4>
                  {result.extractedResume.skills.length > 0 ? (
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {result.extractedResume.skills.join(' · ')}
                    </p>
                  ) : (
                    <p className={`text-sm ${theme.mutedText}`}>No explicit skills listed.</p>
                  )}
                </div>

                <div className="pt-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-slate-300" aria-hidden="true" />
                    <h4 className="text-xs font-semibold text-slate-200">Qualifications & Education</h4>
                  </div>
                  {result.extractedResume.qualifications.length > 0 ? (
                    <ul className="space-y-1.5 text-sm text-slate-200 list-disc pl-4">
                      {result.extractedResume.qualifications.map((qual, idx) => (
                        <li key={`${qual}-${idx}`}>{qual}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`text-sm ${theme.mutedText}`}>No formal qualifications extracted.</p>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-slate-300" aria-hidden="true" />
                    <h4 className="text-xs font-semibold text-slate-200">Experience</h4>
                  </div>
                  {result.extractedResume.experience.length > 0 ? (
                    <div className="space-y-3">
                      {result.extractedResume.experience.map((exp, idx) => {
                        const isExpanded = expandedExperience[idx] ?? true;
                        return (
                          <div key={`${exp.role}-${idx}`} className="space-y-1.5">
                            <button
                              type="button"
                              onClick={() => toggleExperience(idx)}
                              aria-expanded={isExpanded}
                              className="w-full flex items-baseline justify-between gap-2 text-left group cursor-pointer"
                            >
                              <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                {exp.role}{' '}
                                <span className={`font-normal ${theme.mutedText}`}>
                                  at {exp.company}
                                </span>
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 text-xs tabular-nums shrink-0 ${theme.mutedText}`}
                              >
                                <span>{exp.duration}</span>
                                {exp.highlights.length > 0 &&
                                  (isExpanded ? (
                                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                                  ) : (
                                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                                  ))}
                              </span>
                            </button>
                            {isExpanded && exp.highlights.length > 0 && (
                              <ul className="space-y-1 text-xs text-slate-300 list-disc pl-4 leading-relaxed">
                                {exp.highlights.map((h, hIdx) => (
                                  <li key={hIdx}>{h}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className={`text-sm ${theme.mutedText}`}>No work experience entries extracted.</p>
                  )}
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-200">Resume Keywords</h4>
                  {result.extractedResume.keywords.length > 0 ? (
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {result.extractedResume.keywords.join(' · ')}
                    </p>
                  ) : (
                    <p className={`text-sm ${theme.mutedText}`}>No keywords extracted.</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {extractedView !== 'resume' && (
            <section
              aria-labelledby="extracted-jd-heading"
              className={`rounded-xl border p-6 space-y-5 shadow-md transition-colors duration-500 ${theme.card}`}
            >
              <div className={`flex items-center gap-2.5 pb-4 border-b ${theme.divider}`}>
                <Target className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden="true" />
                <div>
                  <h3 id="extracted-jd-heading" className="text-base font-semibold text-white">
                    Extracted from Job Description
                  </h3>
                  <p className={`text-xs ${theme.mutedText}`}>
                    Target Role: {result.extractedJobDescription.roleTitle}
                  </p>
                </div>
              </div>

              <div className={`space-y-5 divide-y ${theme.divider}`}>
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-200">Required Skills</h4>
                  {result.extractedJobDescription.requiredSkills.length > 0 ? (
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {result.extractedJobDescription.requiredSkills.join(' · ')}
                    </p>
                  ) : (
                    <p className={`text-sm ${theme.mutedText}`}>No required skills extracted.</p>
                  )}
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-200">Required Qualifications</h4>
                  {result.extractedJobDescription.qualifications.length > 0 ? (
                    <ul className="space-y-1.5 text-sm text-slate-200 list-disc pl-4">
                      {result.extractedJobDescription.qualifications.map((qual, idx) => (
                        <li key={`${qual}-${idx}`}>{qual}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className={`text-sm ${theme.mutedText}`}>
                      No formal qualifications specified.
                    </p>
                  )}
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-semibold text-slate-200">Target Keywords</h4>
                  {result.extractedJobDescription.keywords.length > 0 ? (
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {result.extractedJobDescription.keywords.join(' · ')}
                    </p>
                  ) : (
                    <p className={`text-sm ${theme.mutedText}`}>No target keywords extracted.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Bottom Reset Button */}
      <div className="flex justify-center pt-2 pb-4">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>Analyze another resume</span>
        </button>
      </div>
    </div>
  );
}
