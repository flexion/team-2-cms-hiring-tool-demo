import React, { useState } from 'react';
import { Header, Title, PrimaryNav, Table, GridContainer } from '@trussworks/react-uswds';
import { getPositions, type Position } from './hiring-pipeline';

export default function HRSpecialist(): React.ReactElement {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const positions = getPositions();

  const navItems = [
    <a href="/" key="pipeline" className="usa-nav__link">
      Pipeline
    </a>,
  ];

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
                  onClick={() => setSelectedPosition(position.id)}
                  style={{ cursor: 'pointer' }}
                  className={selectedPosition === position.id ? 'usa-table__row--selected' : ''}
                >
                  <td>{position.date}</td>
                  <td>{position.title}</td>
                  <td>{position.gsGrade}</td>
                  <td>{position.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </GridContainer>
      </main>
    </div>
  );
}
