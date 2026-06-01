import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup, verify, impliedSetup, impliedVerify, implementedScenarios } from './scenario-adapter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const scenariosPath = resolve(__dirname, '..', '..', 'specs', 'scenarios.md');

interface ParsedScenario {
  name: string;
  segments: { label: string; conditions: string[] }[];
  constraints: string[];
}

function parseScenarios(content: string): ParsedScenario[] {
  const scenarios: ParsedScenario[] = [];
  const scenarioBlocks = content.split(/^## Scenario: /m).slice(1);

  for (const block of scenarioBlocks) {
    const nameMatch = block.match(/^(.+?)$/m);
    if (!nameMatch) continue;
    const name = nameMatch[1].trim();

    const segments: { label: string; conditions: string[] }[] = [];

    const midConditionMatches = block.matchAll(/^### Mid-conditions \((.+?)\)\s*\n([\s\S]*?)(?=\n### |\n---)/gm);
    for (const m of midConditionMatches) {
      const label = `Mid-conditions (${m[1]})`;
      const conditions = extractConditions(m[2]);
      if (conditions.length > 0) segments.push({ label, conditions });
    }

    const postconditionMatch = block.match(/^### Postconditions\s*\n([\s\S]+?)(?=\n---|\n## Scenario:)/m)
      ?? block.match(/^### Postconditions\s*\n([\s\S]+)/m);
    if (postconditionMatch) {
      const conditions = extractConditions(postconditionMatch[1]);
      if (conditions.length > 0) segments.push({ label: 'Postconditions', conditions });
    }

    const constraints: string[] = [];
    const constraintMatch = block.match(/^### Constraints\s*\n([\s\S]+?)(?=\n### |\n---)/m)
      ?? block.match(/^### Constraints\s*\n([\s\S]+)/m);
    if (constraintMatch) {
      constraints.push(...extractConditions(constraintMatch[1]));
    }

    scenarios.push({ name, segments, constraints });
  }

  return scenarios;
}

function extractConditions(text: string): string[] {
  return text
    .split('\n')
    .filter(line => line.trimStart().startsWith('- '))
    .map(line => line.replace(/^[\s]*- /, '').trim())
    .filter(line => line.length > 0);
}

const scenarioContent = readFileSync(scenariosPath, 'utf-8');
const allScenarios = parseScenarios(scenarioContent);
const activeScenarios = allScenarios.filter(s => implementedScenarios.has(s.name));

for (const scenario of activeScenarios) {
  describe(scenario.name, () => {
    for (const segment of scenario.segments) {
      describe(segment.label, () => {
        for (const condition of segment.conditions) {
          it(condition, async () => {
            const ctx = await setup(scenario.name, segment.label);
            await verify(ctx, scenario.name, segment.label, condition);
          });
        }
      });
    }
  });

  const impliedName = `Programmatic mirror of "${scenario.name}"`;
  if (implementedScenarios.has(impliedName)) {
    describe(impliedName, () => {
      it('all operations succeed through the HTTP interface', async () => {
        const ctx = await impliedSetup(scenario.name);
        await impliedVerify(ctx, scenario.name);
      });
    });
  }
}
