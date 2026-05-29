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

export interface PDRequirement {
  id: string;
  section: 'duties' | 'specialized experience';
  text: string;
}

export interface ResumePassage {
  id: string;
  text: string;
}

export interface ApplicantResume {
  id: string;
  positionId: string;
  applicantName: string;
  passages: ResumePassage[];
}

const FINALIZED_PDS: Record<string, PDRequirement[]> = {
  '4': [
    { id: 'r1', section: 'duties', text: 'Administer health insurance programs in accordance with CMS guidelines, including Medicare and Medicaid coverage determinations.' },
    { id: 'r2', section: 'duties', text: 'Review and process beneficiary appeals related to Medicare Part D prescription drug coverage decisions.' },
    { id: 'r3', section: 'specialized experience', text: 'Three years of specialized experience interpreting federal health insurance regulations including Title XVIII and Title XIX of the Social Security Act.' },
    { id: 'r4', section: 'specialized experience', text: 'Demonstrated ability to communicate complex Medicare and Medicaid program rules to beneficiaries, providers, and other stakeholders.' },
  ],
};

export function getPDRequirements(positionId: string): PDRequirement[] {
  return FINALIZED_PDS[positionId] ?? [];
}

const APPLICANT_RESUMES: Record<string, ApplicantResume[]> = {
  '4': [
    {
      id: 'res-jordan',
      positionId: '4',
      applicantName: 'Jordan Mitchell',
      passages: [
        { id: 'p1', text: 'Senior Health Insurance Specialist at the Centers for Medicare & Medicaid Services, FY 2022 to present, leading coverage determination reviews for Medicare Part D appeals.' },
        { id: 'p2', text: 'Drafted policy guidance on Medicaid eligibility under Title XIX, coordinating with state agencies on implementation timelines and beneficiary communications.' },
        { id: 'p3', text: 'Resolved complex beneficiary appeals involving Medicare Part D prescription drug coverage, including off-label use and formulary exceptions.' },
        { id: 'p4', text: 'Delivered training to provider organizations on Medicare and Medicaid program rules, simplifying regulatory language for non-technical audiences.' },
        { id: 'p5', text: 'Interpreted Title XVIII regulations to support coverage decisions, working with senior policy advisors and CMS legal counsel on edge cases.' },
        { id: 'p6', text: 'Volunteered as a community advocate, helping seniors navigate Medicare enrollment options at local outreach events.' },
      ],
    },
    {
      id: 'res-priya',
      positionId: '4',
      applicantName: 'Priya Ramanathan',
      passages: [
        { id: 'q1', text: 'Health Policy Analyst at a Washington-based think tank, researching Affordable Care Act marketplace dynamics and federal subsidy programs.' },
        { id: 'q2', text: 'Co-authored published research on Medicare Advantage enrollment trends, presenting findings at academic conferences.' },
        { id: 'q3', text: 'Worked on a Medicaid policy brief examining state-level eligibility variations across Title XIX expansion and non-expansion states.' },
        { id: 'q4', text: 'Holds a Master of Public Policy with concentration in health policy from a top-tier school.' },
      ],
    },
    {
      id: 'res-david',
      positionId: '4',
      applicantName: 'David Chen',
      passages: [
        { id: 's1', text: 'Insurance Claims Adjuster at a regional commercial health insurer, processing claims under employer-sponsored plans.' },
        { id: 's2', text: 'Communicated coverage decisions to enrollees and providers via phone and written correspondence, explaining benefit limitations.' },
        { id: 's3', text: 'Earned a Bachelor of Business Administration with coursework in healthcare administration.' },
      ],
    },
  ],
};

export function getApplicantResumes(positionId: string): ApplicantResume[] {
  return (APPLICANT_RESUMES[positionId] ?? []).map(r => ({
    id: r.id,
    positionId: r.positionId,
    applicantName: r.applicantName,
    passages: r.passages.map(p => ({ ...p })),
  }));
}

export function getApplicantResumeById(positionId: string, resumeId: string): ApplicantResume | undefined {
  return APPLICANT_RESUMES[positionId]?.find(r => r.id === resumeId);
}

export type { ResumeMapping } from './pd-suggestions';
export { mapResumeToRequirements } from './pd-suggestions';

