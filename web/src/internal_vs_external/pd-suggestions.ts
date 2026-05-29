import type { PDWorkingCopy } from './hiring-pipeline';

export interface LLMSuggestion {
  section: 'duties' | 'specialized experience';
  proposedText: string;
  explanation: string;
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
