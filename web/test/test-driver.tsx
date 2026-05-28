import React from 'react';
import { render } from '@testing-library/react';
import HRSpecialist from '../src/hr-specialist';
import { handleAPIRequest } from '../src/pipeline-api';

export interface UISession {
  role: string;
  authenticated: boolean;
}

export interface Position {
  id: string;
  title: string;
  gsGrade: string;
  status: string;
  date: string;
}

export async function signInAsHRSpecialist(): Promise<UISession> {
  return { role: 'HR Specialist', authenticated: true };
}

export function getRenderedApp(session: UISession): { container: HTMLElement } {
  const { container } = render(<HRSpecialist />);
  return { container };
}

export function clickRow(container: HTMLElement, text: string): void {
  const rows = container.querySelectorAll('table tbody tr');
  for (const row of rows) {
    if (row.textContent?.includes(text)) {
      (row as HTMLElement).click();
      return;
    }
  }
  throw new Error(`Row containing "${text}" not found`);
}

export async function authenticateAPI(): Promise<string> {
  const result = handleAPIRequest('POST', '/api/auth', { 'Content-Type': 'application/json' }, JSON.stringify({ role: 'HR Specialist' }));
  const data = result.body as { token: string };
  return data.token;
}

export async function getPositions(token: string): Promise<Position[]> {
  const result = handleAPIRequest('GET', '/api/positions', { Authorization: `Bearer ${token}` });
  return result.body as Position[];
}

export async function getPositionById(token: string, id: string): Promise<Position> {
  const result = handleAPIRequest('GET', `/api/positions/${id}`, { Authorization: `Bearer ${token}` });
  return result.body as Position;
}
