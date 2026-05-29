export interface Position {
  id: string;
  title: string;
  gsGrade: string;
  status: string;
  date: string;
}

const PIPELINE_DATA: Position[] = [
  { id: '1', title: 'IT Specialist (Full Stack Engineer)', gsGrade: 'GS-13', status: 'Drafting PD', date: '2026-05-15' },
  { id: '2', title: 'Data Scientist', gsGrade: 'GS-14', status: 'In Classification Review', date: '2026-05-10' },
  { id: '3', title: 'IT Specialist (Cybersecurity)', gsGrade: 'GS-13', status: 'Posted', date: '2026-05-01' },
  { id: '4', title: 'Health Insurance Specialist', gsGrade: 'GS-12', status: 'Cert Issued', date: '2026-04-20' },
  { id: '5', title: 'IT Specialist (Systems Administration)', gsGrade: 'GS-13', status: 'Interviewing', date: '2026-04-15' },
  { id: '6', title: 'Management Analyst', gsGrade: 'GS-14', status: 'Drafting PD', date: '2026-05-20' },
  { id: '7', title: 'IT Specialist (Data Management)', gsGrade: 'GS-15', status: 'In Classification Review', date: '2026-05-12' },
];

export function getPositions(): Position[] {
  return PIPELINE_DATA;
}

export function getPositionById(id: string): Position | undefined {
  return PIPELINE_DATA.find(p => p.id === id);
}

export interface PDWorkingCopy {
  duties: string;
  specializedExperience: string;
}

export type { LLMSuggestion } from './pd-suggestions';
export { suggestPDEdits } from './pd-suggestions';

const PD_DRAFTS: Record<string, PDWorkingCopy> = {
  '1': {
    duties: 'Designs, develops, and maintains full-stack web applications using modern frameworks. Collaborates with cross-functional teams to deliver software solutions.',
    specializedExperience: 'One year of specialized experience equivalent to the GS-12 level performing full-stack development duties including front-end and back-end implementation.',
  },
};

export function getPDWorkingCopy(positionId: string): PDWorkingCopy | undefined {
  return PD_DRAFTS[positionId] ? { ...PD_DRAFTS[positionId] } : undefined;
}

export function updatePDWorkingCopy(positionId: string, pd: PDWorkingCopy): void {
  PD_DRAFTS[positionId] = pd;
}

