# Scenarios

## Scenario: View Active Hiring Pipeline

### Actor
Maria Torres, a human HR Specialist

### Preconditions

- The system contains the following positions in the pipeline:

| # | Job Title | GS Grade | Status | Date |
|---|---|---|---|---|
| 1 | IT Specialist (Full Stack Engineer) | GS-13 | Drafting PD | 2026-05-15 |
| 2 | Data Scientist | GS-14 | In Classification Review | 2026-05-10 |
| 3 | IT Specialist (Cybersecurity) | GS-13 | Posted | 2026-05-01 |
| 4 | Health Insurance Specialist | GS-12 | Cert Issued | 2026-04-20 |
| 5 | IT Specialist (Systems Administration) | GS-13 | Interviewing | 2026-04-15 |
| 6 | Management Analyst | GS-14 | Drafting PD | 2026-05-20 |
| 7 | IT Specialist (Data Management) | GS-15 | In Classification Review | 2026-05-12 |

### Narrative

Maria securely signed in to the CMS Hiring Tool the next morning from her workstation. She needed to check the current state of her **hiring pipeline** — which positions were actively being prepared or were already in the posting process. The tool showed her a table of all **active positions**, each with a date, job title, GS grade, and current **status**. She could see at a glance that two positions were still in the drafting phase, two were under classification review, one was posted, one had a cert issued, and one was in the interviewing stage. She clicked on the "IT Specialist (Full Stack Engineer)" row to begin working on its position description.

### Postconditions

- Maria sees a table of 7 positions in the pipeline.
- Maria sees each position displays a date, job title, GS grade, and status.
- Maria sees the "IT Specialist (Full Stack Engineer)" position with status "Drafting PD".
- Maria sees the "Data Scientist" position with status "In Classification Review".
- Maria sees the "IT Specialist (Cybersecurity)" position with status "Posted".
- Maria sees the "Health Insurance Specialist" position with status "Cert Issued".
- Maria sees the "IT Specialist (Systems Administration)" position with status "Interviewing".

---

## Scenario: Draft and Refine a Position Description with LLM Assistance

### Actor
Maria Torres, a human HR Specialist

### Preconditions

- Maria previously viewed the hiring pipeline and the "IT Specialist (Full Stack Engineer)" GS-13 position exists with status "Drafting PD".
- The position has an initial PD working copy with a **duties** section and a **specialized experience** section, both containing draft content that needs refinement.
- The LLM service is available and configured.

### Narrative

Maria navigated to the **position detail** page for the IT Specialist (Full Stack Engineer) position. She saw the job title and GS grade displayed prominently, along with the **PD working copy** in a rich text editor. The current draft had a duties section describing full-stack development responsibilities and a specialized experience section listing required qualifications.

Maria wanted the LLM to review her draft against federal PD writing conventions. She clicked the **"LLM Suggest"** button. The system sent her current PD content to the LLM, which analyzed it against federal position description rules — proper duty statement structure, appropriate specialized experience language, KSA alignment, and OHC formatting expectations.

### Mid-conditions (after Maria requests LLM suggestions)

- Maria sees a suggestions panel appear alongside the editor.
- Maria sees at least one suggested edit with an explanation of why the change improves the PD.
- Each suggestion references a specific section of the PD (duties or specialized experience).

The LLM returned three **suggestions**: one to strengthen a duty statement with measurable outcomes, one to align specialized experience language with OPM qualification standards, and one to add a missing KSA element. Each suggestion showed the proposed text change and an explanation of the federal PD writing rule it addressed.

Maria accepted the first suggestion about strengthening the duty statement — the editor updated with the new text. She rejected the second suggestion because she had specific agency context the LLM didn't know about. She accepted the third suggestion about the missing KSA element.

### Postconditions

- Maria sees the PD working copy updated with the accepted duty statement suggestion.
- Maria sees the PD working copy updated with the accepted KSA element suggestion.
- Maria sees the rejected specialized experience suggestion is not applied to the PD working copy.
- Maria sees the suggestions panel shows which suggestions were accepted and which were rejected.

---

## Scenario: Review Applicant Resume Against PD Requirements

### Actor
Maria Torres, a human HR Specialist

### Preconditions

- The "Health Insurance Specialist" GS-12 position exists with status "Cert Issued".
- The position has a finalized PD with duties and specialized experience sections containing 4 distinct requirements.
- The position has 3 attached applicant resumes (filtered and screened by OHC certificate):
  - Jordan Mitchell
  - Priya Ramanathan
  - David Chen
- The LLM service is available and configured.

### Narrative

Maria navigated to the position detail page for the Health Insurance Specialist position. She scrolled to the **applicant resumes** section and saw the three candidates whose resumes had been filtered and screened through the **OHC certificate** process. She clicked on Jordan Mitchell's resume to open the **resume reader**.

The resume reader displayed a split-pane view. The left pane showed the PD **requirements** — duties and specialized experience criteria — rendered as clickable sections. The right pane showed Jordan Mitchell's **resume content** rendered as clickable passages. The system had used the LLM to compute a **bidirectional mapping** between PD requirements and resume passages, showing which parts of the resume related to which requirements.

Maria clicked on the first PD requirement (a duty statement about administering health insurance programs). The resume reader **highlighted** the passages in Jordan's resume that mapped to that requirement, using color-coding to indicate relevance. She then clicked a passage in Jordan's resume about their Medicare Part D experience — the reader highlighted which PD requirements that passage related to, showing it mapped to two different duties.

### Mid-conditions (after Maria clicks a PD requirement)

- Maria sees highlighted passages in the resume pane that relate to the selected PD requirement.
- Maria sees color-coding indicating the strength or category of the match.

### Postconditions

- Maria sees the resume reader with the PD requirements in the left pane.
- Maria sees Jordan Mitchell's resume content in the right pane.
- Maria sees that clicking a resume passage highlights the related PD requirements in the left pane.
- Maria sees that the bidirectional mapping covers all 4 PD requirements.
- Maria sees visual indicators distinguishing strong matches from partial matches.
