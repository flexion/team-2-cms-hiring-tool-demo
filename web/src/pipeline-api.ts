import {
  getPositions,
  getPositionById,
  getApplicantResumes,
  getApplicantResumeById,
  getPDRequirements,
  mapResumeToRequirements,
} from './internal_vs_external/hiring-pipeline';

let tokenCounter = 0;
const activeSessions = new Map<string, { role: string }>();

export function signIn(role: string): { token: string } {
  const token = `token-${++tokenCounter}`;
  activeSessions.set(token, { role });
  return { token };
}

export function isAuthenticated(token: string): boolean {
  return activeSessions.has(token);
}

export function handleAPIRequest(method: string, path: string, headers: Record<string, string>, body?: string): { status: number; body: unknown } {
  if (method === 'POST' && path === '/api/auth') {
    const parsed = JSON.parse(body as string) as { role: string };
    const session = signIn(parsed.role);
    return { status: 200, body: session };
  }

  const authHeader = headers['authorization'] ?? headers['Authorization'] ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!isAuthenticated(token)) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  if (method === 'GET' && path === '/api/positions') {
    return { status: 200, body: getPositions() };
  }

  const mappingMatch = path.match(/^\/api\/positions\/([^/]+)\/applicant-resumes\/([^/]+)\/mapping$/);
  if (method === 'GET' && mappingMatch) {
    const [, positionId, resumeId] = mappingMatch;
    const resume = getApplicantResumeById(positionId, resumeId);
    if (!resume) return { status: 404, body: { error: 'Resume not found' } };
    const requirements = getPDRequirements(positionId);
    return { status: 200, body: mapResumeToRequirements(requirements, resume) };
  }

  const resumeMatch = path.match(/^\/api\/positions\/([^/]+)\/applicant-resumes\/([^/]+)$/);
  if (method === 'GET' && resumeMatch) {
    const [, positionId, resumeId] = resumeMatch;
    const resume = getApplicantResumeById(positionId, resumeId);
    if (!resume) return { status: 404, body: { error: 'Resume not found' } };
    return { status: 200, body: { applicantName: resume.applicantName, passages: resume.passages } };
  }

  const resumesListMatch = path.match(/^\/api\/positions\/([^/]+)\/applicant-resumes$/);
  if (method === 'GET' && resumesListMatch) {
    const resumes = getApplicantResumes(resumesListMatch[1]);
    return { status: 200, body: resumes.map(r => ({ id: r.id, applicantName: r.applicantName })) };
  }

  const positionMatch = path.match(/^\/api\/positions\/(.+)$/);
  if (method === 'GET' && positionMatch) {
    const position = getPositionById(positionMatch[1]);
    if (position) return { status: 200, body: position };
    return { status: 404, body: { error: 'Not found' } };
  }

  return { status: 404, body: { error: 'Not found' } };
}
