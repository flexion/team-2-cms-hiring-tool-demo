import type { PDWorkingCopy, PDRequirement, ApplicantResume } from './hiring-pipeline';

export interface LLMSuggestion {
  section: 'duties' | 'specialized experience';
  proposedText: string;
  explanation: string;
}

export interface MappedPassage {
  passageId: string;
  matchStrength: 'strong' | 'partial';
}

export interface MappedRequirement {
  id: string;
  text: string;
  passages: MappedPassage[];
}

export interface PassageIndexEntry {
  passageId: string;
  requirementIds: string[];
}

export interface ResumeMapping {
  requirements: MappedRequirement[];
  passageIndex: PassageIndexEntry[];
}

const CANNED_RESUME_MAPPING: Record<string, ResumeMapping> = {
  'res-jordan': {
    requirements: [
      {
        id: 'r1',
        text: 'Administer health insurance programs in accordance with CMS guidelines, including Medicare and Medicaid coverage determinations.',
        passages: [
          { passageId: 'p1', matchStrength: 'strong' },
          { passageId: 'p2', matchStrength: 'strong' },
          { passageId: 'p3', matchStrength: 'partial' },
        ],
      },
      {
        id: 'r2',
        text: 'Review and process beneficiary appeals related to Medicare Part D prescription drug coverage decisions.',
        passages: [
          { passageId: 'p1', matchStrength: 'strong' },
          { passageId: 'p3', matchStrength: 'strong' },
        ],
      },
      {
        id: 'r3',
        text: 'Three years of specialized experience interpreting federal health insurance regulations including Title XVIII and Title XIX of the Social Security Act.',
        passages: [
          { passageId: 'p2', matchStrength: 'strong' },
          { passageId: 'p5', matchStrength: 'strong' },
        ],
      },
      {
        id: 'r4',
        text: 'Demonstrated ability to communicate complex Medicare and Medicaid program rules to beneficiaries, providers, and other stakeholders.',
        passages: [
          { passageId: 'p4', matchStrength: 'strong' },
          { passageId: 'p6', matchStrength: 'partial' },
        ],
      },
    ],
    passageIndex: [
      { passageId: 'p1', requirementIds: ['r1', 'r2'] },
      { passageId: 'p2', requirementIds: ['r1', 'r3'] },
      { passageId: 'p3', requirementIds: ['r1', 'r2'] },
      { passageId: 'p4', requirementIds: ['r4'] },
      { passageId: 'p5', requirementIds: ['r3'] },
      { passageId: 'p6', requirementIds: ['r4'] },
    ],
  },
};

export function mapResumeToRequirements(
  requirements: PDRequirement[],
  resume: ApplicantResume,
): ResumeMapping {
  const canned = CANNED_RESUME_MAPPING[resume.id];
  if (canned) {
    return {
      requirements: canned.requirements.map(r => ({
        id: r.id,
        text: r.text,
        passages: r.passages.map(p => ({ ...p })),
      })),
      passageIndex: canned.passageIndex.map(e => ({
        passageId: e.passageId,
        requirementIds: [...e.requirementIds],
      })),
    };
  }
  // Generic dev fallback: every requirement maps to its same-section passages partially.
  const mappedReqs: MappedRequirement[] = requirements.map(req => ({
    id: req.id,
    text: req.text,
    passages: resume.passages.slice(0, 1).map(p => ({ passageId: p.id, matchStrength: 'partial' as const })),
  }));
  const passageIndex: PassageIndexEntry[] = resume.passages.map(p => ({
    passageId: p.id,
    requirementIds: requirements.map(r => r.id),
  }));
  return { requirements: mappedReqs, passageIndex };
}

export function suggestPDEdits(_pd: PDWorkingCopy): LLMSuggestion[] {
  return [
    {
      section: 'duties',
      proposedText: 'Designs, develops, and maintains full-stack web applications using modern frameworks, delivering measurable outcomes including 99.9% uptime and sub-second response times for critical user workflows.',
      explanation: 'Federal PD duty statements should include measurable outcomes that demonstrate the impact and scope of the work performed.',
    },
    {
      section: 'specialized experience',
      proposedText: 'One year of specialized experience equivalent to the GS-12 level in accordance with OPM qualification standards for the 2210 series, performing full-stack development duties.',
      explanation: 'Specialized experience language should reference OPM qualification standards and the applicable occupational series for alignment with federal classification requirements.',
    },
    {
      section: 'duties',
      proposedText: 'Applies knowledge, skills, and abilities in software architecture, cloud infrastructure, and agile methodologies to lead technical initiatives across the full application stack.',
      explanation: 'Position descriptions should include a KSA element that articulates the competencies required, supporting classification and qualification determinations.',
    },
  ];
}
