import React, { useState } from 'react';
import { Header, Title, PrimaryNav, Table, GridContainer, Button } from '@trussworks/react-uswds';
import {
  getPositions,
  getPositionById,
  getPDWorkingCopy,
  updatePDWorkingCopy,
  suggestPDEdits,
  getApplicantResumes,
  getApplicantResumeById,
  getPDRequirements,
  mapResumeToRequirements,
  type Position,
  type LLMSuggestion,
  type PDWorkingCopy,
  type ApplicantResume,
  type PDRequirement,
  type ResumeMapping,
} from './internal_vs_external/hiring-pipeline';

interface SuggestionState extends LLMSuggestion {
  status: 'pending' | 'accepted' | 'rejected';
}

export default function HRSpecialist(): React.ReactElement {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [pdContent, setPdContent] = useState<PDWorkingCopy | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionState[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [selectedPassageId, setSelectedPassageId] = useState<string | null>(null);
  const positions = getPositions();

  const navItems = [
    <a href="/" key="pipeline" className="usa-nav__link" onClick={(e) => { e.preventDefault(); resetToPipeline(); }}>
      Pipeline
    </a>,
  ];

  function resetToPipeline() {
    setSelectedPositionId(null);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedResumeId(null);
    setSelectedRequirementId(null);
    setSelectedPassageId(null);
  }

  function handleRowClick(positionId: string) {
    setSelectedPositionId(positionId);
    const pd = getPDWorkingCopy(positionId);
    setPdContent(pd ?? null);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedResumeId(null);
    setSelectedRequirementId(null);
    setSelectedPassageId(null);
  }

  function handleOpenResume(resumeId: string) {
    setSelectedResumeId(resumeId);
    setSelectedRequirementId(null);
    setSelectedPassageId(null);
  }

  function handleCloseResume() {
    setSelectedResumeId(null);
    setSelectedRequirementId(null);
    setSelectedPassageId(null);
  }

  function handleSelectRequirement(reqId: string) {
    setSelectedRequirementId(reqId);
    setSelectedPassageId(null);
  }

  function handleSelectPassage(passageId: string) {
    setSelectedPassageId(passageId);
    setSelectedRequirementId(null);
  }

  function handleLLMSuggest() {
    if (!pdContent) return;
    const raw = suggestPDEdits(pdContent);
    setSuggestions(raw.map(s => ({ ...s, status: 'pending' as const })));
    setShowSuggestions(true);
  }

  function handleAccept(index: number) {
    setSuggestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'accepted' };
      return updated;
    });
    if (pdContent && selectedPositionId) {
      const suggestion = suggestions[index];
      const newPd = { ...pdContent };
      if (suggestion.section === 'duties') {
        newPd.duties = newPd.duties + '\n\n' + suggestion.proposedText;
      } else {
        newPd.specializedExperience = newPd.specializedExperience + '\n\n' + suggestion.proposedText;
      }
      setPdContent(newPd);
      updatePDWorkingCopy(selectedPositionId, newPd);
    }
  }

  function handleReject(index: number) {
    setSuggestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'rejected' };
      return updated;
    });
  }

  const selectedPosition = selectedPositionId ? getPositionById(selectedPositionId) : null;
  const applicantResumes: ApplicantResume[] = selectedPositionId ? getApplicantResumes(selectedPositionId) : [];
  const pdRequirements: PDRequirement[] = selectedPositionId ? getPDRequirements(selectedPositionId) : [];
  const selectedResume = selectedPositionId && selectedResumeId
    ? getApplicantResumeById(selectedPositionId, selectedResumeId)
    : undefined;
  const resumeMapping: ResumeMapping | null = selectedResume
    ? mapResumeToRequirements(pdRequirements, selectedResume)
    : null;

  function findRequirementMapping(reqId: string) {
    return resumeMapping?.requirements.find(r => r.id === reqId);
  }
  function findPassageMapping(passageId: string) {
    return resumeMapping?.passageIndex.find(e => e.passageId === passageId);
  }
  function passageMatchStrengthForReq(reqId: string, passageId: string): 'strong' | 'partial' | null {
    const reqMapping = findRequirementMapping(reqId);
    if (!reqMapping) return null;
    const m = reqMapping.passages.find(p => p.passageId === passageId);
    return m ? m.matchStrength : null;
  }

  return (
    <div>
      <Header basic>
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <Title>
              <span data-testid="app-name">CMS Hiring Tool</span>
            </Title>
          </div>
          <PrimaryNav items={navItems} />
        </div>
      </Header>

      <main>
        <GridContainer>
          {!selectedPosition ? (
            <>
              <h1 className="usa-heading" style={{ fontSize: '32px', fontWeight: 700, margin: '16px 0' }}>
                Hiring Pipeline
              </h1>
              <Table bordered striped fullWidth data-testid="pipeline-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Job Title</th>
                    <th scope="col">GS Grade</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(position => (
                    <tr
                      key={position.id}
                      onClick={() => handleRowClick(position.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(position.id); } }}
                      tabIndex={0}
                      role="button"
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{position.date}</td>
                      <td>{position.title}</td>
                      <td>{position.gsGrade}</td>
                      <td>{position.status}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          ) : selectedResume ? (
            <ResumeReader
              applicant={selectedResume}
              requirements={pdRequirements}
              mapping={resumeMapping!}
              selectedRequirementId={selectedRequirementId}
              selectedPassageId={selectedPassageId}
              onSelectRequirement={handleSelectRequirement}
              onSelectPassage={handleSelectPassage}
              onClose={handleCloseResume}
            />
          ) : (
            <>
              <h1 className="usa-heading" style={{ fontSize: '32px', fontWeight: 700, margin: '16px 0' }}>
                {selectedPosition.title}
              </h1>
              <p><strong>GS Grade:</strong> {selectedPosition.gsGrade}</p>

              {applicantResumes.length > 0 && (
                <section data-testid="applicant-resumes-section" style={{ margin: '24px 0' }}>
                  <h2>Applicant Resumes (OHC certificate)</h2>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {applicantResumes.map(resume => (
                      <li key={resume.id} style={{ margin: '8px 0' }}>
                        <a
                          href="#"
                          data-testid="applicant-resume-link"
                          onClick={(e) => { e.preventDefault(); handleOpenResume(resume.id); }}
                          style={{ color: '#005ea2', cursor: 'pointer' }}
                        >
                          {resume.applicantName}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: showSuggestions ? '2fr 1fr' : '1fr', gap: '16px' }}>
                <div data-testid="pd-editor">
                  <h2>Position Description</h2>
                  <h3>Duties</h3>
                  <p>{pdContent?.duties}</p>
                  <h3>Specialized Experience</h3>
                  <p>{pdContent?.specializedExperience}</p>
                  <Button type="button" data-testid="llm-suggest-button" onClick={handleLLMSuggest}>
                    LLM Suggest
                  </Button>
                </div>

                {showSuggestions && (
                  <div data-testid="suggestions-panel">
                    <h2>Suggestions</h2>
                    {suggestions.map((suggestion, i) => (
                      <div key={i} data-testid="suggestion" data-status={suggestion.status} style={{ borderBottom: '1px solid #dfe1e2', padding: '12px 0' }}>
                        <span data-testid="suggestion-section">{suggestion.section}</span>
                        <p data-testid="suggestion-proposed-text">{suggestion.proposedText}</p>
                        <p data-testid="suggestion-explanation"><em>{suggestion.explanation}</em></p>
                        {suggestion.status === 'pending' && (
                          <div>
                            <Button type="button" data-testid="accept-button" onClick={() => handleAccept(i)}>Accept</Button>
                            <Button type="button" data-testid="reject-button" secondary onClick={() => handleReject(i)}>Reject</Button>
                          </div>
                        )}
                        {suggestion.status === 'accepted' && <span>Accepted</span>}
                        {suggestion.status === 'rejected' && <span>Rejected</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </GridContainer>
      </main>
    </div>
  );
}

interface ResumeReaderProps {
  applicant: ApplicantResume;
  requirements: PDRequirement[];
  mapping: ResumeMapping;
  selectedRequirementId: string | null;
  selectedPassageId: string | null;
  onSelectRequirement: (id: string) => void;
  onSelectPassage: (id: string) => void;
  onClose: () => void;
}

function ResumeReader({
  applicant,
  requirements,
  mapping,
  selectedRequirementId,
  selectedPassageId,
  onSelectRequirement,
  onSelectPassage,
  onClose,
}: ResumeReaderProps): React.ReactElement {
  const reqMappingById = new Map(mapping.requirements.map(r => [r.id, r]));
  const passageIndexByPassageId = new Map(mapping.passageIndex.map(e => [e.passageId, e.requirementIds]));

  const passagesHighlightedByReq = selectedRequirementId
    ? new Map(
        (reqMappingById.get(selectedRequirementId)?.passages ?? []).map(p => [p.passageId, p.matchStrength]),
      )
    : new Map<string, 'strong' | 'partial'>();

  const requirementsHighlightedByPassage = selectedPassageId
    ? new Set(passageIndexByPassageId.get(selectedPassageId) ?? [])
    : new Set<string>();

  const overallMatchStrengthByPassage = new Map<string, 'strong' | 'partial'>();
  for (const req of mapping.requirements) {
    for (const p of req.passages) {
      const current = overallMatchStrengthByPassage.get(p.passageId);
      if (p.matchStrength === 'strong') {
        overallMatchStrengthByPassage.set(p.passageId, 'strong');
      } else if (!current) {
        overallMatchStrengthByPassage.set(p.passageId, 'partial');
      }
    }
  }

  return (
    <section data-testid="resume-reader" style={{ margin: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
          Resume Reader: <span data-testid="resume-applicant-name">{applicant.applicantName}</span>
        </h1>
        <Button type="button" outline onClick={onClose} data-testid="close-resume-reader">
          Back to Position
        </Button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <aside data-testid="pd-requirements-pane" style={{ borderRight: '1px solid #dfe1e2', paddingRight: '12px' }}>
          <h2 style={{ fontSize: '18px' }}>PD Requirements</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {requirements.map(req => {
              const mappedPassageCount = reqMappingById.get(req.id)?.passages.length ?? 0;
              const isSelected = selectedRequirementId === req.id;
              const isHighlightedByPassage = requirementsHighlightedByPassage.has(req.id);
              const highlighted = isSelected || isHighlightedByPassage;
              return (
                <li
                  key={req.id}
                  data-testid="pd-requirement"
                  data-section={req.section}
                  data-mapped-passage-count={mappedPassageCount}
                  data-highlighted={highlighted ? 'true' : 'false'}
                  data-selected={isSelected ? 'true' : 'false'}
                  onClick={() => onSelectRequirement(req.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectRequirement(req.id); } }}
                  tabIndex={0}
                  role="button"
                  style={{
                    cursor: 'pointer',
                    padding: '10px',
                    margin: '6px 0',
                    backgroundColor: highlighted ? '#e1f3f8' : '#f0f0f0',
                    borderLeft: isSelected ? '4px solid #005ea2' : '4px solid transparent',
                  }}
                >
                  <strong style={{ fontSize: '12px', textTransform: 'uppercase', color: '#71767a' }}>{req.section}</strong>
                  <p style={{ margin: '4px 0 0 0' }}>{req.text}</p>
                </li>
              );
            })}
          </ul>
        </aside>
        <div data-testid="resume-pane" style={{ paddingLeft: '12px' }}>
          <h2 style={{ fontSize: '18px' }}>Resume Content</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {applicant.passages.map(passage => {
              const reqHighlightStrength = passagesHighlightedByReq.get(passage.id) ?? null;
              const overallStrength = overallMatchStrengthByPassage.get(passage.id) ?? null;
              const matchStrength = reqHighlightStrength ?? overallStrength;
              const isSelected = selectedPassageId === passage.id;
              const isReqHighlighted = reqHighlightStrength !== null;
              const bg = isReqHighlighted
                ? (reqHighlightStrength === 'strong' ? '#94bfa2' : '#d4eed4')
                : isSelected
                  ? '#fff1d2'
                  : (overallStrength === 'strong' ? '#e8f5ed' : overallStrength === 'partial' ? '#f5f9f5' : '#fafafa');
              return (
                <li
                  key={passage.id}
                  data-testid="resume-passage"
                  data-passage-id={passage.id}
                  data-highlighted={isReqHighlighted ? 'true' : 'false'}
                  data-match-strength={matchStrength ?? ''}
                  data-selected={isSelected ? 'true' : 'false'}
                  onClick={() => onSelectPassage(passage.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectPassage(passage.id); } }}
                  tabIndex={0}
                  role="button"
                  style={{
                    cursor: 'pointer',
                    padding: '10px',
                    margin: '6px 0',
                    backgroundColor: bg,
                    borderLeft: isSelected ? '4px solid #005ea2' : '4px solid transparent',
                  }}
                >
                  {passage.text}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
