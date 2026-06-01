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

export interface APIResponse {
  status: number;
  body: unknown;
}

export async function getPositionsWithoutAuth(): Promise<APIResponse> {
  return handleAPIRequest('GET', '/api/positions', {});
}

export async function getPositionByIdRaw(token: string, id: string): Promise<APIResponse> {
  return handleAPIRequest('GET', `/api/positions/${id}`, { Authorization: `Bearer ${token}` });
}

export async function requestUnknownRoute(token: string): Promise<APIResponse> {
  return handleAPIRequest('PUT', '/api/positions', { Authorization: `Bearer ${token}` });
}

export async function setupPositionDetail(session: UISession, positionTitle: string): Promise<{ container: HTMLElement }> {
  const { container } = render(<HRSpecialist />);
  clickRow(container, positionTitle);
  return { container };
}

export async function clickLLMSuggest(container: HTMLElement): Promise<void> {
  const button = container.querySelector('[data-testid="llm-suggest-button"]') as HTMLElement | null;
  if (!button) throw new Error('"LLM Suggest" button not found');
  button.click();
  await new Promise(resolve => setTimeout(resolve, 0));
}

export async function acceptSuggestion(container: HTMLElement, index: number): Promise<void> {
  const suggestions = container.querySelectorAll('[data-testid="suggestion"]');
  const suggestion = suggestions[index] as HTMLElement | undefined;
  if (!suggestion) throw new Error(`Suggestion at index ${index} not found`);
  const acceptBtn = suggestion.querySelector('[data-testid="accept-button"]') as HTMLElement | null;
  if (!acceptBtn) throw new Error(`Accept button not found for suggestion ${index}`);
  acceptBtn.click();
  await new Promise(resolve => setTimeout(resolve, 0));
}

export async function rejectSuggestion(container: HTMLElement, index: number): Promise<void> {
  const suggestions = container.querySelectorAll('[data-testid="suggestion"]');
  const suggestion = suggestions[index] as HTMLElement | undefined;
  if (!suggestion) throw new Error(`Suggestion at index ${index} not found`);
  const rejectBtn = suggestion.querySelector('[data-testid="reject-button"]') as HTMLElement | null;
  if (!rejectBtn) throw new Error(`Reject button not found for suggestion ${index}`);
  rejectBtn.click();
  await new Promise(resolve => setTimeout(resolve, 0));
}

export async function openResumeReader(container: HTMLElement, applicantName: string): Promise<void> {
  const links = container.querySelectorAll('[data-testid="applicant-resume-link"]');
  for (const link of links) {
    if (link.textContent?.includes(applicantName)) {
      (link as HTMLElement).click();
      await new Promise(resolve => setTimeout(resolve, 0));
      return;
    }
  }
  throw new Error(`Applicant resume link for "${applicantName}" not found`);
}

export async function clickPDRequirement(container: HTMLElement, index: number): Promise<void> {
  const reqs = container.querySelectorAll('[data-testid="pd-requirement"]');
  const req = reqs[index] as HTMLElement | undefined;
  if (!req) throw new Error(`PD requirement at index ${index} not found`);
  req.click();
  await new Promise(resolve => setTimeout(resolve, 0));
}

export async function clickResumePassage(container: HTMLElement, index: number): Promise<void> {
  const passages = container.querySelectorAll('[data-testid="resume-passage"]');
  const passage = passages[index] as HTMLElement | undefined;
  if (!passage) throw new Error(`Resume passage at index ${index} not found`);
  passage.click();
  await new Promise(resolve => setTimeout(resolve, 0));
}

export interface ApplicantResumeSummary {
  id: string;
  applicantName: string;
}

export interface ResumeContent {
  applicantName: string;
  passages: { id: string; text: string }[];
}

export interface ResumeMapping {
  requirements: {
    id: string;
    text: string;
    passages: { passageId: string; matchStrength: 'strong' | 'partial' }[];
  }[];
  passageIndex: { passageId: string; requirementIds: string[] }[];
}

export async function getApplicantResumes(token: string, positionId: string): Promise<ApplicantResumeSummary[]> {
  const result = handleAPIRequest(
    'GET',
    `/api/positions/${positionId}/applicant-resumes`,
    { Authorization: `Bearer ${token}` },
  );
  return result.body as ApplicantResumeSummary[];
}

export async function getResumeContent(token: string, positionId: string, resumeId: string): Promise<ResumeContent> {
  const result = handleAPIRequest(
    'GET',
    `/api/positions/${positionId}/applicant-resumes/${resumeId}`,
    { Authorization: `Bearer ${token}` },
  );
  return result.body as ResumeContent;
}

export async function getResumeMapping(token: string, positionId: string, resumeId: string): Promise<ResumeMapping> {
  const result = handleAPIRequest(
    'GET',
    `/api/positions/${positionId}/applicant-resumes/${resumeId}/mapping`,
    { Authorization: `Bearer ${token}` },
  );
  return result.body as ResumeMapping;
}
