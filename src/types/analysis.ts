export interface ExperienceItem {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface ImprovementSuggestion {
  title: string;
  category: 'Skills' | 'Experience' | 'Keywords' | 'Formatting' | 'Impact';
  priority: 'High' | 'Medium';
  action: string;
}

export interface ResumeAnalysisResult {
  matchScore: number;
  summary: string;
  comparisonScores: {
    skills: number;
    experience: number;
    keywords: number;
  };
  skillsComparison: {
    matchingSkills: string[];
    missingSkills: string[];
  };
  keywordsComparison: {
    matchedKeywords: string[];
    missingKeywords: string[];
  };
  extractedResume: {
    candidateName: string;
    skills: string[];
    qualifications: string[];
    experience: ExperienceItem[];
    keywords: string[];
  };
  extractedJobDescription: {
    roleTitle: string;
    requiredSkills: string[];
    qualifications: string[];
    keywords: string[];
  };
  suggestions: ImprovementSuggestion[];
}

export interface AnalyzeRequestPayload {
  resumeText?: string;
  resumePdfBase64?: string;
  resumeFileName?: string;
  jobDescription: string;
}
