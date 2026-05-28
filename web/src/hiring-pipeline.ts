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

let tokenCounter = 0;
const activeSessions = new Map<string, { role: string }>();
let currentUser: { role: string } | null = null;

export function signIn(role: string): void {
  currentUser = { role };
}

export function isAuthenticated(): boolean {
  return currentUser !== null;
}

export function getPositions(): Position[] {
  return PIPELINE_DATA;
}

export function getPositionById(id: string): Position | undefined {
  return PIPELINE_DATA.find(p => p.id === id);
}

export function handleAPIRequest(method: string, path: string, headers: Record<string, string>, body?: string): { status: number; body: unknown } {
  if (method === 'POST' && path === '/api/auth') {
    const parsed = body ? JSON.parse(body) : {};
    const token = `token-${++tokenCounter}`;
    activeSessions.set(token, { role: parsed.role ?? 'unknown' });
    return { status: 200, body: { token } };
  }

  const authHeader = headers['authorization'] ?? headers['Authorization'] ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!activeSessions.has(token)) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  if (method === 'GET' && path === '/api/positions') {
    return { status: 200, body: PIPELINE_DATA };
  }

  const positionMatch = path.match(/^\/api\/positions\/(.+)$/);
  if (method === 'GET' && positionMatch) {
    const position = PIPELINE_DATA.find(p => p.id === positionMatch[1]);
    if (position) return { status: 200, body: position };
    return { status: 404, body: { error: 'Not found' } };
  }

  return { status: 404, body: { error: 'Not found' } };
}
