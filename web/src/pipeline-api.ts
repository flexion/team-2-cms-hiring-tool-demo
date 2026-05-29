import { getPositions, getPositionById } from './internal_vs_external/hiring-pipeline';

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

  const positionMatch = path.match(/^\/api\/positions\/(.+)$/);
  if (method === 'GET' && positionMatch) {
    const position = getPositionById(positionMatch[1]);
    if (position) return { status: 200, body: position };
    return { status: 404, body: { error: 'Not found' } };
  }

  return { status: 404, body: { error: 'Not found' } };
}
