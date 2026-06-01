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
  { id: '4', title: 'IT Specialist (Artificial Intelligence)', gsGrade: 'GS-14', status: 'Cert Issued', date: '2026-04-20' },
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
  '4': {
    duties: 'Provide technical guidance and training to product managers, data scientists and engineers on AI/ML platform usage and best practices. Lead collaborative efforts with product owners and business stakeholders to analyze complex program requirements and identify strategic opportunities for AI/ML solutions. Collaborate with data scientists to productionize fraud prevention models, ensuring seamless transition from development to production environments while maintaining model performance, monitoring, and compliance. Design and implement security frameworks and access controls for AI/ML platforms to protect sensitive data and ensure compliance with federal regulations.',
    specializedExperience: 'One year of specialized experience equivalent to the GS-13 level demonstrating IT-related experience in each of the following competencies: Attention to Detail, Customer Service, Oral Communication, and Problem Solving. Specialized experience must include leading the deployment and operationalization of AI/ML models in production environments, designing security and access control frameworks for AI/ML platforms handling sensitive federal data, and providing technical guidance on AI/ML platform architecture to cross-functional teams including data scientists, engineers, and business stakeholders.',
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
    { id: 'r1', section: 'duties', text: 'Lead collaborative efforts with product owners and business stakeholders to analyze complex program requirements and identify strategic opportunities for AI/ML solutions.' },
    { id: 'r2', section: 'duties', text: 'Collaborate with data scientists to productionize fraud prevention models, ensuring seamless transition from development to production environments while maintaining model performance, monitoring, and compliance.' },
    { id: 'r3', section: 'duties', text: 'Design and implement security frameworks and access controls for AI/ML platforms to protect sensitive data and ensure compliance with federal regulations.' },
    { id: 'r4', section: 'specialized experience', text: 'Specialized experience must include leading the deployment and operationalization of AI/ML models in production environments, and providing technical guidance on AI/ML platform architecture to cross-functional teams.' },
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
        { id: 'p1', text: 'Senior ML Engineer at CMS, FY 2022 to present, leading the deployment of fraud detection models into production on AWS SageMaker, achieving 40% improvement in improper payment identification.' },
        { id: 'p2', text: 'Designed role-based access control and encryption-at-rest frameworks for the AI/ML platform, ensuring compliance with FISMA and CMS ARS security requirements for PII/PHI data.' },
        { id: 'p3', text: 'Collaborated with the Center for Program Integrity product owners to translate business requirements into ML pipeline specifications, identifying opportunities to apply anomaly detection to claims processing.' },
        { id: 'p4', text: 'Provided technical training and documentation to data scientists and engineers on MLOps best practices, model versioning, and CI/CD pipelines for model promotion.' },
        { id: 'p5', text: 'Led cross-functional team of 5 engineers and 3 data scientists to operationalize a provider risk-scoring model, managing the full lifecycle from experimentation through production monitoring and drift detection.' },
        { id: 'p6', text: 'Mentored junior engineers on Kubernetes-based model serving infrastructure and presented AI platform architecture to CMS leadership during quarterly technology reviews.' },
      ],
    },
    {
      id: 'res-priya',
      positionId: '4',
      applicantName: 'Priya Ramanathan',
      passages: [
        { id: 'q1', text: 'Machine Learning Researcher at a federal health policy institute, developing NLP models to extract structured data from unstructured Medicare claims narratives.' },
        { id: 'q2', text: 'Published peer-reviewed research on applying transformer architectures to healthcare fraud detection, presenting findings at AAAI and KDD conferences.' },
        { id: 'q3', text: 'Built proof-of-concept ML pipelines on cloud infrastructure (GCP Vertex AI), including automated retraining and monitoring for data drift in claims datasets.' },
        { id: 'q4', text: 'Holds a Ph.D. in Computer Science with dissertation on federated learning approaches for privacy-preserving healthcare analytics.' },
      ],
    },
    {
      id: 'res-david',
      positionId: '4',
      applicantName: 'David Chen',
      passages: [
        { id: 's1', text: 'Data Analyst at a regional health plan, building dashboards and SQL queries to support claims adjudication workflows and identify billing anomalies.' },
        { id: 's2', text: 'Completed online certifications in Python machine learning (Coursera) and presented a pilot sentiment analysis project to department leadership.' },
        { id: 's3', text: 'Holds a Bachelor of Science in Information Systems with coursework in database management and statistics.' },
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

