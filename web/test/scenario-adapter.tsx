import React from 'react';
import { signInAsHRSpecialist, clickRow, getRenderedApp } from './test-driver';

export const implementedScenarios = new Set([
  'View Active Hiring Pipeline',
  'Programmatic mirror of "View Active Hiring Pipeline"',
  'Draft and Refine a Position Description with LLM Assistance',
  'Review Applicant Resume Against PD Requirements',
  'Programmatic mirror of "Review Applicant Resume Against PD Requirements"',
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
  if (scenarioName === 'Review Applicant Resume Against PD Requirements') {
    const { setupPositionDetail, openResumeReader, clickPDRequirement } = await import('./test-driver');
    const session = await signInAsHRSpecialist();
    const { container } = await setupPositionDetail(session, 'Health Insurance Specialist');
    await openResumeReader(container, 'Jordan Mitchell');
    if (groupLabel.includes('Mid-conditions')) {
      await clickPDRequirement(container, 0);
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
  if (scenarioName === 'Review Applicant Resume Against PD Requirements') {
    return verifyResumeReview(ctx, groupLabel, postcondition);
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

async function verifyResumeReview(ctx: AdapterContext, groupLabel: string, postcondition: string): Promise<void> {
  const { container } = ctx;
  const { clickResumePassage } = await import('./test-driver');

  const verifiers: Record<string, () => void | Promise<void>> = {
    'Maria sees highlighted passages in the resume pane that relate to the selected PD requirement.': () => {
      const resumePane = container.querySelector('[data-testid="resume-pane"]');
      if (!resumePane) throw new Error('Resume pane not found');
      const highlighted = resumePane.querySelectorAll('[data-testid="resume-passage"][data-highlighted="true"]');
      if (highlighted.length === 0) {
        throw new Error('No highlighted passages found after clicking PD requirement');
      }
    },
    'Maria sees color-coding indicating the strength or category of the match.': () => {
      const resumePane = container.querySelector('[data-testid="resume-pane"]');
      if (!resumePane) throw new Error('Resume pane not found');
      const highlighted = resumePane.querySelectorAll('[data-testid="resume-passage"][data-highlighted="true"]');
      if (highlighted.length === 0) {
        throw new Error('No highlighted passages found');
      }
      let hasStrength = false;
      for (const p of highlighted) {
        const strength = p.getAttribute('data-match-strength');
        if (strength === 'strong' || strength === 'partial') hasStrength = true;
      }
      if (!hasStrength) {
        throw new Error('No match-strength color-coding found on highlighted passages');
      }
    },
    'Maria sees the resume reader with the PD requirements in the left pane.': () => {
      const leftPane = container.querySelector('[data-testid="pd-requirements-pane"]');
      if (!leftPane) throw new Error('PD requirements pane not found');
      const requirements = leftPane.querySelectorAll('[data-testid="pd-requirement"]');
      if (requirements.length === 0) throw new Error('No PD requirements rendered');
    },
    'Maria sees Jordan Mitchell’s resume content in the right pane.': () => {
      verifyResumePane(container);
    },
    "Maria sees Jordan Mitchell's resume content in the right pane.": () => {
      verifyResumePane(container);
    },
    'Maria sees that clicking a resume passage highlights the related PD requirements in the left pane.': async () => {
      await clickResumePassage(container, 0);
      const leftPane = container.querySelector('[data-testid="pd-requirements-pane"]');
      if (!leftPane) throw new Error('PD requirements pane not found');
      const highlightedReqs = leftPane.querySelectorAll('[data-testid="pd-requirement"][data-highlighted="true"]');
      if (highlightedReqs.length === 0) {
        throw new Error('No PD requirements highlighted after clicking a resume passage');
      }
    },
    'Maria sees that the bidirectional mapping covers all 4 PD requirements.': () => {
      const leftPane = container.querySelector('[data-testid="pd-requirements-pane"]');
      if (!leftPane) throw new Error('PD requirements pane not found');
      const requirements = leftPane.querySelectorAll('[data-testid="pd-requirement"]');
      if (requirements.length !== 4) {
        throw new Error(`Expected 4 PD requirements, found ${requirements.length}`);
      }
      for (const r of requirements) {
        const mapped = r.getAttribute('data-mapped-passage-count');
        if (!mapped || Number(mapped) <= 0) {
          throw new Error(`PD requirement "${r.textContent?.slice(0, 40)}..." has no mapped passages (data-mapped-passage-count=${mapped})`);
        }
      }
    },
    'Maria sees visual indicators distinguishing strong matches from partial matches.': () => {
      const resumePane = container.querySelector('[data-testid="resume-pane"]');
      if (!resumePane) throw new Error('Resume pane not found');
      const passages = resumePane.querySelectorAll('[data-testid="resume-passage"]');
      let hasStrong = false;
      let hasPartial = false;
      for (const p of passages) {
        const strength = p.getAttribute('data-match-strength');
        if (strength === 'strong') hasStrong = true;
        if (strength === 'partial') hasPartial = true;
      }
      if (!hasStrong || !hasPartial) {
        throw new Error(`Need both strong and partial matches; got strong=${hasStrong}, partial=${hasPartial}`);
      }
    },
  };

  const fn = verifiers[postcondition];
  if (!fn) throw new Error(`No verifier for postcondition: ${postcondition}`);
  await fn();
}

function verifyResumePane(container: HTMLElement): void {
  const rightPane = container.querySelector('[data-testid="resume-pane"]');
  if (!rightPane) throw new Error('Resume pane not found');
  const passages = rightPane.querySelectorAll('[data-testid="resume-passage"]');
  if (passages.length === 0) throw new Error('No resume passages rendered in right pane');
  const heading = container.querySelector('[data-testid="resume-applicant-name"]');
  if (!heading || !heading.textContent?.includes('Jordan Mitchell')) {
    throw new Error('Resume pane does not show Jordan Mitchell as the applicant');
  }
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
  if (scenarioName === 'Review Applicant Resume Against PD Requirements') {
    const { authenticateAPI, getPositions, getPositionById, getApplicantResumes, getResumeContent, getResumeMapping } = await import('./test-driver');
    const token = await authenticateAPI();
    const positions = await getPositions(token);
    const hisPosition = positions.find(p => p.title === 'Health Insurance Specialist');
    if (!hisPosition) throw new Error('Health Insurance Specialist position not found');
    const detail = await getPositionById(token, hisPosition.id);
    const resumes = await getApplicantResumes(token, hisPosition.id);
    if (resumes.length !== 3) throw new Error(`Expected 3 resumes, got ${resumes.length}`);
    const jordan = resumes.find(r => r.applicantName === 'Jordan Mitchell');
    if (!jordan) throw new Error('Jordan Mitchell not in applicant resumes');
    await getResumeContent(token, hisPosition.id, jordan.id);
    await getResumeMapping(token, hisPosition.id, jordan.id);
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
  if (scenarioName === 'Review Applicant Resume Against PD Requirements') {
    const { authenticateAPI, getPositions, getApplicantResumes, getResumeContent, getResumeMapping } = await import('./test-driver');
    const token = await authenticateAPI();
    const positions = await getPositions(token);
    const hisPosition = positions.find(p => p.title === 'Health Insurance Specialist');
    if (!hisPosition) throw new Error('Health Insurance Specialist position not found');
    const resumes = await getApplicantResumes(token, hisPosition.id);
    const expectedNames = ['Jordan Mitchell', 'Priya Ramanathan', 'David Chen'];
    for (const name of expectedNames) {
      if (!resumes.some(r => r.applicantName === name)) {
        throw new Error(`Expected resume for ${name} not found`);
      }
    }
    const jordan = resumes.find(r => r.applicantName === 'Jordan Mitchell')!;
    const content = await getResumeContent(token, hisPosition.id, jordan.id);
    if (!Array.isArray(content.passages) || content.passages.length === 0) {
      throw new Error('Jordan Mitchell resume has no passages');
    }
    const mapping = await getResumeMapping(token, hisPosition.id, jordan.id);
    if (!Array.isArray(mapping.requirements) || mapping.requirements.length !== 4) {
      throw new Error(`Expected 4 mapped PD requirements, got ${mapping.requirements?.length}`);
    }
    for (const req of mapping.requirements) {
      if (!Array.isArray(req.passages)) {
        throw new Error(`Requirement ${req.id} mapping missing passages array`);
      }
    }
    let hasStrong = false;
    let hasPartial = false;
    for (const req of mapping.requirements) {
      for (const p of req.passages) {
        if (p.matchStrength === 'strong') hasStrong = true;
        if (p.matchStrength === 'partial') hasPartial = true;
      }
    }
    if (!hasStrong || !hasPartial) {
      throw new Error(`Mapping must include both strong and partial matches; got strong=${hasStrong}, partial=${hasPartial}`);
    }
    if (!Array.isArray(mapping.passageIndex) || mapping.passageIndex.length === 0) {
      throw new Error('Mapping missing reverse-index from passage to requirements');
    }
    for (const entry of mapping.passageIndex) {
      if (!Array.isArray(entry.requirementIds) || entry.requirementIds.length === 0) {
        throw new Error(`Passage ${entry.passageId} has no related requirements`);
      }
    }
  }
}
