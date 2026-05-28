import React from 'react';
import { signInAsHRSpecialist, clickRow, getRenderedApp } from './test-driver';

export const implementedScenarios = new Set([
  'View Active Hiring Pipeline',
  'Programmatic mirror of "View Active Hiring Pipeline"',
]);

export interface AdapterContext {
  container: HTMLElement;
  session: Awaited<ReturnType<typeof signInAsHRSpecialist>>;
}

export async function setup(scenarioName: string, groupLabel: string): Promise<AdapterContext> {
  if (scenarioName === 'View Active Hiring Pipeline') {
    const session = await signInAsHRSpecialist();
    const { container } = getRenderedApp(session);
    clickRow(container, 'IT Specialist (Full Stack Engineer)');
    return { container, session };
  }
  throw new Error(`No setup for scenario: ${scenarioName}`);
}

export async function verify(
  ctx: AdapterContext,
  scenarioName: string,
  groupLabel: string,
  postcondition: string
): Promise<void> {
  if (scenarioName === 'View Active Hiring Pipeline') {
    return verifyPipeline(ctx, postcondition);
  }
  throw new Error(`No verifier for scenario: ${scenarioName}`);
}

async function verifyPipeline(ctx: AdapterContext, postcondition: string): Promise<void> {
  const { container } = ctx;

  const verifiers: Record<string, () => void> = {
    'Maria sees a table of 7 positions in the pipeline.': () => {
      const rows = container.querySelectorAll('table tbody tr');
      if (rows.length !== 7) {
        throw new Error(`Expected 7 positions, found ${rows.length}`);
      }
    },
    'Maria sees each position displays a date, job title, GS grade, and status.': () => {
      const headers = Array.from(container.querySelectorAll('table thead th')).map(th => th.textContent?.toLowerCase() ?? '');
      for (const col of ['date', 'job title', 'gs grade', 'status']) {
        if (!headers.some(h => h.includes(col))) {
          throw new Error(`Missing column: ${col}`);
        }
      }
    },
    'Maria sees the "IT Specialist (Full Stack Engineer)" position with status "Drafting PD".': () => {
      assertPositionStatus(container, 'IT Specialist (Full Stack Engineer)', 'Drafting PD');
    },
    'Maria sees the "Data Scientist" position with status "In Classification Review".': () => {
      assertPositionStatus(container, 'Data Scientist', 'In Classification Review');
    },
    'Maria sees the "IT Specialist (Cybersecurity)" position with status "Posted".': () => {
      assertPositionStatus(container, 'IT Specialist (Cybersecurity)', 'Posted');
    },
    'Maria sees the "Health Insurance Specialist" position with status "Cert Issued".': () => {
      assertPositionStatus(container, 'Health Insurance Specialist', 'Cert Issued');
    },
    'Maria sees the "IT Specialist (Systems Administration)" position with status "Interviewing".': () => {
      assertPositionStatus(container, 'IT Specialist (Systems Administration)', 'Interviewing');
    },
  };

  const fn = verifiers[postcondition];
  if (!fn) {
    throw new Error(`No verifier for postcondition: ${postcondition}`);
  }
  fn();
}

function assertPositionStatus(container: HTMLElement, title: string, status: string): void {
  const rows = container.querySelectorAll('table tbody tr');
  for (const row of rows) {
    if (row.textContent?.includes(title)) {
      if (!row.textContent?.includes(status)) {
        throw new Error(`Position "${title}" found but status is not "${status}"`);
      }
      return;
    }
  }
  throw new Error(`Position "${title}" not found in table`);
}

export async function impliedSetup(scenarioName: string): Promise<{ authenticated: boolean }> {
  if (scenarioName === 'View Active Hiring Pipeline') {
    const { authenticateAPI, getPositions, getPositionById } = await import('./test-driver');
    const token = await authenticateAPI();
    const positions = await getPositions(token);
    const position = await getPositionById(token, positions[0].id);
    return { authenticated: true };
  }
  throw new Error(`No implied setup for scenario: ${scenarioName}`);
}

export async function impliedVerify(ctx: { authenticated: boolean }, scenarioName: string): Promise<void> {
  if (scenarioName === 'View Active Hiring Pipeline') {
    const { authenticateAPI, getPositions, getPositionById } = await import('./test-driver');
    const token = await authenticateAPI();
    const positions = await getPositions(token);
    if (positions.length !== 7) {
      throw new Error(`Expected 7 positions, got ${positions.length}`);
    }
    const position = await getPositionById(token, positions[0].id);
    if (!position.title || !position.gsGrade || !position.status || !position.date) {
      throw new Error('Position missing required fields');
    }
  }
}
