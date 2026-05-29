import React from 'react';
import { signInAsHRSpecialist, clickRow, getRenderedApp } from './test-driver';

export const implementedScenarios = new Set([
  'View Active Hiring Pipeline',
  'Programmatic mirror of "View Active Hiring Pipeline"',
  'Draft and Refine a Position Description with LLM Assistance',
]);

export interface AdapterContext {
  container: HTMLElement;
  session: Awaited<ReturnType<typeof signInAsHRSpecialist>>;
}

export async function setup(scenarioName: string, groupLabel: string): Promise<AdapterContext> {
  if (scenarioName === 'View Active Hiring Pipeline') {
    const session = await signInAsHRSpecialist();
    const { container } = getRenderedApp(session);
    return { container, session };
  }
  if (scenarioName === 'Draft and Refine a Position Description with LLM Assistance') {
    const { setupPositionDetail, clickLLMSuggest, acceptSuggestion, rejectSuggestion } = await import('./test-driver');
    const session = await signInAsHRSpecialist();
    const { container } = await setupPositionDetail(session, 'IT Specialist (Full Stack Engineer)');
    if (groupLabel.includes('Mid-conditions')) {
      await clickLLMSuggest(container);
    } else {
      await clickLLMSuggest(container);
      await acceptSuggestion(container, 0);
      await rejectSuggestion(container, 1);
      await acceptSuggestion(container, 2);
    }
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
  if (scenarioName === 'Draft and Refine a Position Description with LLM Assistance') {
    return verifyPDDraft(ctx, groupLabel, postcondition);
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

async function verifyPDDraft(ctx: AdapterContext, groupLabel: string, postcondition: string): Promise<void> {
  const { container } = ctx;

  const verifiers: Record<string, () => void> = {
    'Maria sees a suggestions panel appear alongside the editor.': () => {
      const panel = container.querySelector('[data-testid="suggestions-panel"]');
      if (!panel) throw new Error('Suggestions panel not found');
    },
    'Maria sees at least one suggested edit with an explanation of why the change improves the PD.': () => {
      const suggestions = container.querySelectorAll('[data-testid="suggestion"]');
      if (suggestions.length === 0) throw new Error('No suggestions found');
      for (const s of suggestions) {
        const explanation = s.querySelector('[data-testid="suggestion-explanation"]');
        if (!explanation || !explanation.textContent?.trim()) {
          throw new Error('Suggestion missing explanation');
        }
      }
    },
    'Each suggestion references a specific section of the PD (duties or specialized experience).': () => {
      const suggestions = container.querySelectorAll('[data-testid="suggestion"]');
      if (suggestions.length === 0) throw new Error('No suggestions found');
      for (const s of suggestions) {
        const section = s.querySelector('[data-testid="suggestion-section"]');
        if (!section) throw new Error('Suggestion missing section reference');
        const text = section.textContent?.toLowerCase() ?? '';
        if (!text.includes('duties') && !text.includes('specialized experience')) {
          throw new Error(`Suggestion section "${section.textContent}" does not reference duties or specialized experience`);
        }
      }
    },
    'Maria sees the PD working copy updated with the accepted duty statement suggestion.': () => {
      const editor = container.querySelector('[data-testid="pd-editor"]');
      if (!editor) throw new Error('PD editor not found');
      if (!editor.textContent?.includes('measurable outcomes')) {
        throw new Error('PD editor does not contain the accepted duty statement suggestion');
      }
    },
    'Maria sees the PD working copy updated with the accepted KSA element suggestion.': () => {
      const editor = container.querySelector('[data-testid="pd-editor"]');
      if (!editor) throw new Error('PD editor not found');
      if (!editor.textContent?.includes('knowledge, skills, and abilities')) {
        throw new Error('PD editor does not contain the accepted KSA element suggestion');
      }
    },
    'Maria sees the rejected specialized experience suggestion is not applied to the PD working copy.': () => {
      const editor = container.querySelector('[data-testid="pd-editor"]');
      if (!editor) throw new Error('PD editor not found');
      const suggestions = container.querySelectorAll('[data-testid="suggestion"]');
      const rejected = suggestions[1];
      if (rejected) {
        const proposedText = rejected.querySelector('[data-testid="suggestion-proposed-text"]')?.textContent ?? '';
        if (proposedText && editor.textContent?.includes(proposedText)) {
          throw new Error('Rejected suggestion was applied to the PD');
        }
      }
    },
    'Maria sees the suggestions panel shows which suggestions were accepted and which were rejected.': () => {
      const suggestions = container.querySelectorAll('[data-testid="suggestion"]');
      if (suggestions.length === 0) throw new Error('No suggestions found');
      let hasAccepted = false;
      let hasRejected = false;
      for (const s of suggestions) {
        const status = s.getAttribute('data-status');
        if (status === 'accepted') hasAccepted = true;
        if (status === 'rejected') hasRejected = true;
      }
      if (!hasAccepted) throw new Error('No accepted suggestion indicator found');
      if (!hasRejected) throw new Error('No rejected suggestion indicator found');
    },
  };

  const fn = verifiers[postcondition];
  if (!fn) throw new Error(`No verifier for postcondition: ${postcondition}`);
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
    const { authenticateAPI, getPositions, getPositionById, getPositionsWithoutAuth, getPositionByIdRaw, requestUnknownRoute } = await import('./test-driver');
    const token = await authenticateAPI();
    const positions = await getPositions(token);
    if (positions.length !== 7) {
      throw new Error(`Expected 7 positions, got ${positions.length}`);
    }
    const position = await getPositionById(token, positions[0].id);
    if (!position.title || !position.gsGrade || !position.status || !position.date) {
      throw new Error('Position missing required fields');
    }

    const unauthed = await getPositionsWithoutAuth();
    if (unauthed.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got ${unauthed.status}`);
    }

    const missing = await getPositionByIdRaw(token, 'no-such-position');
    if (missing.status !== 404) {
      throw new Error(`Expected 404 for unknown position id, got ${missing.status}`);
    }

    const unsupported = await requestUnknownRoute(token);
    if (unsupported.status !== 404) {
      throw new Error(`Expected 404 for unsupported method, got ${unsupported.status}`);
    }
  }
}
