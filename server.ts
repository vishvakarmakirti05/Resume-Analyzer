import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import type { ResumeAnalysisResult, AnalyzeRequestPayload } from './src/types/analysis.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

const SYSTEM_INSTRUCTION = `You are a meticulous, objective executive recruiter and ATS resume analyst.
Your task is to perform a thorough comparison between the candidate's resume and the target job description, returning strictly structured JSON.

CRITICAL GROUNDING RULE:
- Use ONLY information that is explicitly present in the candidate's resume.
- Do NOT invent, infer, extrapolate, or fabricate any skills, qualifications, certifications, job titles, companies, dates, or experience that are not stated in the resume.
- If the resume does not state a candidate name, set candidateName to "Not specified".
- If a required skill or keyword from the job description is not present in the resume, list it under missingSkills / missingKeywords. Do NOT credit the candidate with unstated skills.
- Keep extractedResume strictly faithful to the resume text/document.
- Keep extractedJobDescription strictly faithful to the job description text.
- Provide 4 to 6 practical, specific, honest improvement suggestions (e.g., reframing existing experience with stronger action verbs, surfacing existing relevant skills higher, adding verifiable metrics from their actual work, or addressing genuine skill gaps through learning/projects without fabricating credentials).
- Scores (matchScore, skills, experience, keywords) must be realistic integers from 0 to 100 reflecting genuine alignment.`;

const ANALYSIS_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    matchScore: {
      type: Type.INTEGER,
      description: 'Overall match score from 0 to 100 comparing the resume against the job description.',
    },
    summary: {
      type: Type.STRING,
      description: 'Concise 2-3 sentence factual assessment of overall fit grounded strictly in the resume and job description.',
    },
    comparisonScores: {
      type: Type.OBJECT,
      properties: {
        skills: {
          type: Type.INTEGER,
          description: 'Skills alignment score from 0 to 100.',
        },
        experience: {
          type: Type.INTEGER,
          description: 'Experience relevance and seniority alignment score from 0 to 100.',
        },
        keywords: {
          type: Type.INTEGER,
          description: 'ATS keyword coverage score from 0 to 100.',
        },
      },
      required: ['skills', 'experience', 'keywords'],
    },
    skillsComparison: {
      type: Type.OBJECT,
      properties: {
        matchingSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Required or preferred skills from the job description that are explicitly evidenced in the resume.',
        },
        missingSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Skills requested in the job description that do not appear in the resume.',
        },
      },
      required: ['matchingSkills', 'missingSkills'],
    },
    keywordsComparison: {
      type: Type.OBJECT,
      properties: {
        matchedKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Important domain terms, tools, methodologies, or ATS keywords present in both the job description and the resume.',
        },
        missingKeywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Important domain terms, tools, methodologies, or ATS keywords from the job description missing from the resume.',
        },
      },
      required: ['matchedKeywords', 'missingKeywords'],
    },
    extractedResume: {
      type: Type.OBJECT,
      properties: {
        candidateName: {
          type: Type.STRING,
          description: 'Candidate full name as written in the resume, or "Not specified" if absent.',
        },
        skills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Technical and professional skills explicitly listed or demonstrated in the resume.',
        },
        qualifications: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Degrees, certifications, licenses, and formal academic qualifications explicitly stated in the resume.',
        },
        experience: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              role: { type: Type.STRING, description: 'Job title or role from the resume.' },
              company: { type: Type.STRING, description: 'Organization or company name from the resume.' },
              duration: { type: Type.STRING, description: 'Dates or duration as stated in the resume, or "Not specified".' },
              highlights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '1 to 3 concise factual responsibilities or achievements directly from the resume.',
              },
            },
            required: ['role', 'company', 'duration', 'highlights'],
          },
          description: 'Work and relevant project experience extracted strictly from the resume.',
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Key domain terms, tools, frameworks, and competencies found in the resume.',
        },
      },
      required: ['candidateName', 'skills', 'qualifications', 'experience', 'keywords'],
    },
    extractedJobDescription: {
      type: Type.OBJECT,
      properties: {
        roleTitle: {
          type: Type.STRING,
          description: 'Target role title from the job description, or "Target Role" if not explicitly named.',
        },
        requiredSkills: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Core and preferred skills extracted from the job description.',
        },
        qualifications: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Education, years of experience, or credential requirements extracted from the job description.',
        },
        keywords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Important ATS keywords, technologies, and domain concepts extracted from the job description.',
        },
      },
      required: ['roleTitle', 'requiredSkills', 'qualifications', 'keywords'],
    },
    suggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Short, actionable headline for the suggestion.',
          },
          category: {
            type: Type.STRING,
            description: 'One of: Skills, Experience, Keywords, Formatting, Impact.',
          },
          priority: {
            type: Type.STRING,
            description: 'One of: High, Medium.',
          },
          action: {
            type: Type.STRING,
            description: 'Specific, practical recommendation grounded strictly in the candidate resume and job description.',
          },
        },
        required: ['title', 'category', 'priority', 'action'],
      },
      description: 'Exactly 4 to 6 practical improvement suggestions tailored to this resume and job description.',
    },
  },
  required: [
    'matchScore',
    'summary',
    'comparisonScores',
    'skillsComparison',
    'keywordsComparison',
    'extractedResume',
    'extractedJobDescription',
    'suggestions',
  ],
};

function clampScore(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function sanitizeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0);
}

function normalizeAnalysisResult(raw: unknown): ResumeAnalysisResult {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const comp = (data.comparisonScores && typeof data.comparisonScores === 'object'
    ? data.comparisonScores
    : {}) as Record<string, unknown>;
  const skillsComp = (data.skillsComparison && typeof data.skillsComparison === 'object'
    ? data.skillsComparison
    : {}) as Record<string, unknown>;
  const keywordsComp = (data.keywordsComparison && typeof data.keywordsComparison === 'object'
    ? data.keywordsComparison
    : {}) as Record<string, unknown>;
  const extResume = (data.extractedResume && typeof data.extractedResume === 'object'
    ? data.extractedResume
    : {}) as Record<string, unknown>;
  const extJd = (data.extractedJobDescription && typeof data.extractedJobDescription === 'object'
    ? data.extractedJobDescription
    : {}) as Record<string, unknown>;

  const rawExperience = Array.isArray(extResume.experience) ? extResume.experience : [];
  const experience = rawExperience
    .map((item) => {
      const entry = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      return {
        role: typeof entry.role === 'string' && entry.role.trim() ? entry.role.trim() : 'Role',
        company: typeof entry.company === 'string' && entry.company.trim() ? entry.company.trim() : 'Organization',
        duration: typeof entry.duration === 'string' && entry.duration.trim() ? entry.duration.trim() : 'Not specified',
        highlights: sanitizeStringArray(entry.highlights),
      };
    })
    .filter((item) => item.role || item.company);

  const validCategories = new Set(['Skills', 'Experience', 'Keywords', 'Formatting', 'Impact']);
  const rawSuggestions = Array.isArray(data.suggestions) ? data.suggestions : [];
  const suggestions = rawSuggestions
    .slice(0, 6)
    .map((item) => {
      const s = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
      const rawCategory = typeof s.category === 'string' ? s.category.trim() : 'Impact';
      const category = (validCategories.has(rawCategory) ? rawCategory : 'Impact') as
        | 'Skills'
        | 'Experience'
        | 'Keywords'
        | 'Formatting'
        | 'Impact';
      const priority = s.priority === 'High' ? 'High' : 'Medium';
      return {
        title: typeof s.title === 'string' && s.title.trim() ? s.title.trim() : 'Improvement Recommendation',
        category,
        priority: priority as 'High' | 'Medium',
        action: typeof s.action === 'string' ? s.action.trim() : '',
      };
    })
    .filter((s) => s.action.length > 0);

  return {
    matchScore: clampScore(data.matchScore),
    summary:
      typeof data.summary === 'string' && data.summary.trim()
        ? data.summary.trim()
        : 'Analysis completed based on the provided resume and job description.',
    comparisonScores: {
      skills: clampScore(comp.skills),
      experience: clampScore(comp.experience),
      keywords: clampScore(comp.keywords),
    },
    skillsComparison: {
      matchingSkills: sanitizeStringArray(skillsComp.matchingSkills),
      missingSkills: sanitizeStringArray(skillsComp.missingSkills),
    },
    keywordsComparison: {
      matchedKeywords: sanitizeStringArray(keywordsComp.matchedKeywords),
      missingKeywords: sanitizeStringArray(keywordsComp.missingKeywords),
    },
    extractedResume: {
      candidateName:
        typeof extResume.candidateName === 'string' && extResume.candidateName.trim()
          ? extResume.candidateName.trim()
          : 'Not specified',
      skills: sanitizeStringArray(extResume.skills),
      qualifications: sanitizeStringArray(extResume.qualifications),
      experience,
      keywords: sanitizeStringArray(extResume.keywords),
    },
    extractedJobDescription: {
      roleTitle:
        typeof extJd.roleTitle === 'string' && extJd.roleTitle.trim()
          ? extJd.roleTitle.trim()
          : 'Target Role',
      requiredSkills: sanitizeStringArray(extJd.requiredSkills),
      qualifications: sanitizeStringArray(extJd.qualifications),
      keywords: sanitizeStringArray(extJd.keywords),
    },
    suggestions,
  };
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isValidPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 5 || buffer.length > MAX_PDF_BYTES) return false;
  const headerSlice = buffer.subarray(0, Math.min(1024, buffer.length)).toString('latin1');
  return headerSlice.includes('%PDF-');
}

function extractReadableError(err: unknown): { status: number; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403')) {
    return {
      status: 403,
      message:
        'Gemini API authentication failed. Please check that a valid GEMINI_API_KEY is configured in Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message: 'API rate limit or quota reached. Please wait a moment and try again.',
    };
  }
  if (lower.includes('unable to process input image') || lower.includes('invalid argument') || lower.includes('pdf')) {
    return {
      status: 400,
      message:
        'The uploaded PDF could not be processed. Please ensure it is a standard, unencrypted PDF or paste your resume text directly.',
    };
  }
  return {
    status: 500,
    message: 'Failed to analyze the resume with Gemini. Please try again.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16mb' }));

  app.post('/api/analyze', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as Partial<AnalyzeRequestPayload>;
      const jobDescription = typeof body.jobDescription === 'string' ? body.jobDescription.trim() : '';
      const resumeText = typeof body.resumeText === 'string' ? body.resumeText.trim() : '';
      const resumePdfBase64 = typeof body.resumePdfBase64 === 'string' ? body.resumePdfBase64.trim() : '';

      if (!jobDescription) {
        res.status(400).json({ error: 'Please paste a job description before analyzing.' });
        return;
      }
      if (jobDescription.length < 30) {
        res.status(400).json({ error: 'The job description is too short. Please provide at least 30 characters.' });
        return;
      }
      if (jobDescription.length > 40000) {
        res.status(400).json({ error: 'The job description exceeds the maximum allowed length (40,000 characters).' });
        return;
      }

      if (!resumePdfBase64 && !resumeText) {
        res.status(400).json({ error: 'Please upload a PDF resume or paste your resume text.' });
        return;
      }

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

      if (resumePdfBase64) {
        const cleanedBase64 = resumePdfBase64.replace(/^data:application\/pdf;base64,/i, '');
        const pdfBuffer = Buffer.from(cleanedBase64, 'base64');

        if (pdfBuffer.length === 0) {
          res.status(400).json({ error: 'The uploaded PDF file is empty.' });
          return;
        }
        if (pdfBuffer.length > MAX_PDF_BYTES) {
          res.status(400).json({ error: 'The PDF file exceeds the 10 MB size limit.' });
          return;
        }
        if (!isValidPdfBuffer(pdfBuffer)) {
          res.status(400).json({
            error: 'The uploaded file is not a valid readable PDF. Please upload a valid PDF or paste your resume text.',
          });
          return;
        }

        parts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: cleanedBase64,
          },
        });

        if (resumeText) {
          parts.push({
            text: `Extracted text reference from the PDF resume (verify against the PDF document above):\n${resumeText.slice(0, 50000)}`,
          });
        }
      } else {
        if (resumeText.length < 30) {
          res.status(400).json({
            error: 'The resume text is too short. Please paste your full resume (at least 30 characters).',
          });
          return;
        }
        parts.push({
          text: `CANDIDATE RESUME:\n${resumeText.slice(0, 50000)}`,
        });
      }

      parts.push({
        text: `TARGET JOB DESCRIPTION:\n${jobDescription}\n\nAnalyze the candidate's resume against the target job description above. Return strictly valid JSON matching the schema. Remember: use ONLY facts explicitly stated in the resume—never invent skills, qualifications, or experience. Provide 4 to 6 practical improvement suggestions.`,
      });

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: ANALYSIS_RESPONSE_SCHEMA,
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        res.status(502).json({ error: 'Received an unexpected response format from the AI service. Please try again.' });
        return;
      }

      const normalized = normalizeAnalysisResult(parsed);
      res.json(normalized);
    } catch (err) {
      console.error('Resume analysis error:', err);
      const { status, message } = extractReadableError(err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Resume Analyzer server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
