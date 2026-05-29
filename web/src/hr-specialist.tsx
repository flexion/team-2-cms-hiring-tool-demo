import React, { useState } from 'react';
import { Header, Title, PrimaryNav, Table, GridContainer, Button } from '@trussworks/react-uswds';
import {
  getPositions,
  getPositionById,
  getPDWorkingCopy,
  updatePDWorkingCopy,
  suggestPDEdits,
  type Position,
  type LLMSuggestion,
  type PDWorkingCopy,
} from './internal_vs_external/hiring-pipeline';

interface SuggestionState extends LLMSuggestion {
  status: 'pending' | 'accepted' | 'rejected';
}

export default function HRSpecialist(): React.ReactElement {
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
  const [pdContent, setPdContent] = useState<PDWorkingCopy | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionState[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const positions = getPositions();

  const navItems = [
    <a href="/" key="pipeline" className="usa-nav__link" onClick={(e) => { e.preventDefault(); setSelectedPositionId(null); setShowSuggestions(false); setSuggestions([]); }}>
      Pipeline
    </a>,
  ];

  function handleRowClick(positionId: string) {
    setSelectedPositionId(positionId);
    const pd = getPDWorkingCopy(positionId);
    setPdContent(pd ?? null);
    setShowSuggestions(false);
    setSuggestions([]);
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
          ) : (
            <>
              <h1 className="usa-heading" style={{ fontSize: '32px', fontWeight: 700, margin: '16px 0' }}>
                {selectedPosition.title}
              </h1>
              <p><strong>GS Grade:</strong> {selectedPosition.gsGrade}</p>

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
