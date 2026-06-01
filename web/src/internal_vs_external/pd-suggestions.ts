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
        text: 'Lead collaborative efforts with product owners and business stakeholders to analyze complex program requirements and identify strategic opportunities for AI/ML solutions.',
        passages: [
          { passageId: 'p3', matchStrength: 'strong' },
          { passageId: 'p5', matchStrength: 'strong' },
        ],
      },
      {
        id: 'r2',
        text: 'Collaborate with data scientists to productionize fraud prevention models, ensuring seamless transition from development to production environments while maintaining model performance, monitoring, and compliance.',
        passages: [
          { passageId: 'p1', matchStrength: 'strong' },
          { passageId: 'p5', matchStrength: 'strong' },
        ],
      },
      {
        id: 'r3',
        text: 'Design and implement security frameworks and access controls for AI/ML platforms to protect sensitive data and ensure compliance with federal regulations.',
        passages: [
          { passageId: 'p2', matchStrength: 'strong' },
        ],
      },
      {
        id: 'r4',
        text: 'Specialized experience must include leading the deployment and operationalization of AI/ML models in production environments, and providing technical guidance on AI/ML platform architecture to cross-functional teams.',
        passages: [
          { passageId: 'p1', matchStrength: 'strong' },
          { passageId: 'p4', matchStrength: 'strong' },
          { passageId: 'p6', matchStrength: 'partial' },
        ],
      },
    ],
    passageIndex: [
      { passageId: 'p1', requirementIds: ['r2', 'r4'] },
      { passageId: 'p2', requirementIds: ['r3'] },
      { passageId: 'p3', requirementIds: ['r1'] },
      { passageId: 'p4', requirementIds: ['r4'] },
      { passageId: 'p5', requirementIds: ['r1', 'r2'] },
      { passageId: 'p6', requirementIds: ['r4'] },
    ],
  },
  'res-priya': {
    requirements: [
      {
        id: 'r1',
        text: 'Lead collaborative efforts with product owners and business stakeholders to analyze complex program requirements and identify strategic opportunities for AI/ML solutions.',
        passages: [
          { passageId: 'q1', matchStrength: 'partial' },
        ],
      },
      {
        id: 'r2',
        text: 'Collaborate with data scientists to productionize fraud prevention models, ensuring seamless transition from development to production environments while maintaining model performance, monitoring, and compliance.',
        passages: [
          { passageId: 'q3', matchStrength: 'partial' },
          { passageId: 'q2', matchStrength: 'partial' },
        ],
      },
      {
        id: 'r3',
        text: 'Design and implement security frameworks and access controls for AI/ML platforms to protect sensitive data and ensure compliance with federal regulations.',
        passages: [],
      },
      {
        id: 'r4',
        text: 'Specialized experience must include leading the deployment and operationalization of AI/ML models in production environments, and providing technical guidance on AI/ML platform architecture to cross-functional teams.',
        passages: [
          { passageId: 'q3', matchStrength: 'partial' },
          { passageId: 'q1', matchStrength: 'partial' },
        ],
      },
    ],
    passageIndex: [
      { passageId: 'q1', requirementIds: ['r1', 'r4'] },
      { passageId: 'q2', requirementIds: ['r2'] },
      { passageId: 'q3', requirementIds: ['r2', 'r4'] },
      { passageId: 'q4', requirementIds: [] },
    ],
  },
  'res-david': {
    requirements: [
      {
        id: 'r1',
        text: 'Lead collaborative efforts with product owners and business stakeholders to analyze complex program requirements and identify strategic opportunities for AI/ML solutions.',
        passages: [],
      },
      {
        id: 'r2',
        text: 'Collaborate with data scientists to productionize fraud prevention models, ensuring seamless transition from development to production environments while maintaining model performance, monitoring, and compliance.',
        passages: [],
      },
      {
        id: 'r3',
        text: 'Design and implement security frameworks and access controls for AI/ML platforms to protect sensitive data and ensure compliance with federal regulations.',
        passages: [],
      },
      {
        id: 'r4',
        text: 'Specialized experience must include leading the deployment and operationalization of AI/ML models in production environments, and providing technical guidance on AI/ML platform architecture to cross-functional teams.',
        passages: [
          { passageId: 's2', matchStrength: 'partial' },
        ],
      },
    ],
    passageIndex: [
      { passageId: 's1', requirementIds: [] },
      { passageId: 's2', requirementIds: ['r4'] },
      { passageId: 's3', requirementIds: [] },
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
