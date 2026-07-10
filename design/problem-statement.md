# Problem Statement

## Project
SCCCI AI Challenge - Tender Process Automation (Problem Statement 4C)

## Client Need
A Town Council Managing Agent (MA) currently runs its tender evaluation process manually - comparing vendor bid terms, checking eligibility, calculating Price-Quality Method (PQM) scores, assessing risk, and writing up findings for board approval. This is slow, inconsistent across evaluators, and error-prone, especially when eligibility checks and scoring calculations are done by hand across multiple vendor submissions.

## What We're Building
A full-stack application that uses Generative AI (ChatGPT) to automate the highest-effort parts of this process: parsing vendor tender documents to flag eligibility issues, comparing bid terms, computing PQM scores, generating a risk matrix, and producing structured content ready to drop into Executive Board Papers and Interview Presentation Decks.

## Target Users
`project-requirements.md` does not define explicit user roles or personas - only five functional scopes owned by team members. Based on those scopes, the inferred users are:

- MA / procurement staff who receive and manage tender submissions
- Evaluators / C-suite approvers who score bids and approve or reject them
- Report preparers who manage board papers and presentation decks
- Vendor liaison staff who log clarification requests and vendor responses
- Management / leadership who view dashboards and rankings

Note: whether these are distinct system roles with different permissions, or the same MA staff using different screens, has not yet been decided by the team and should be resolved before individual use-case docs are finalised.

## Most Important End-to-End Workflow
1. **Ingest** - vendor tender documents uploaded (Scope A) - AI parses and flags eligibility (paid-up capital, BCA FM01 licensing, non-debarment declaration)
2. **Evaluate** - evaluation criteria weights applied, AI computes PQM score (Scope B)
3. **Risk-check** - AI generates a Risk Assessment & Mitigation Matrix based on vendor constraints (Scope B)
4. **Approve** - C-suite roles log approval or rejection against the evaluation (Scope B)
5. **Report** - approved comparison data is transformed into Board Paper text and a 28-slide Interview Deck (Scope C)
6. **Rank/track** - results feed into the strategic dashboard and rankings (Scope E)

A parallel workflow hangs off steps 2-3: if AI detects a pricing deviation between a vendor's Main Offer and Alternative Offer, it drafts a clarification request (Scope D), which is logged along with the vendor's response.

Scope B is a hard dependency for C, D, and E - the shape of its scored/flagged tender data needs to be agreed on early since every other scope builds on it.

## Highest-Risk / Most Complex Areas
- **Eligibility parsing (A)** - reliably extracting paid-up capital, licensing numbers, and debarment status from unstructured vendor documents; false negatives have compliance consequences
- **PQM score correctness (B)** - this is a calculation, not free text; LLMs are unreliable at precise arithmetic, so the safer design computes the score deterministically in the backend and uses AI only to extract/structure inputs
- **AI-generated Risk Matrix (B)** - subjective, judgment-heavy content that needs a human-review gate before being treated as official
- **Approval workflow authorisation (B)** - "C-suite roles" logging approvals implies role-based access control and an audit trail
- **28-slide deck generation (C)** - mapping dynamic data into a fixed corporate template is a formatting/layout problem, not just a prompting problem
- **Auto-drafted vendor communications (D)** - AI drafting official outbound messages carries reputational/legal risk if it hallucinates figures; likely needs a review-before-send step
- **Cross-scope integration** - Scope B's output feeds C, D, and E, so misaligned data contracts here will block multiple team members late

## Explicitly Out of Scope
`project-requirements.md` does not include an "out of scope" section - this is a gap against the team's own submission guide, which expects `problem-statement.md` to define what success looks like (implying scope boundaries). The team should explicitly agree on boundaries before finalising this document - likely candidates for a course PoC include a real vendor self-service login, legally binding e-signatures, integration with a live town council system of record, and payment/financial transaction processing. These are suggestions only, not decisions already made.

## Open Gaps
- No explicit "out of scope" boundary in the requirements - needs team agreement
- User roles/personas are inferred above, not explicitly specified, and need confirmation before use-case docs are written

---
*This document reflects the team's understanding of the problem as of 2026-07-07, based on `project-requirements.md` and `submission-guide.md`. It should be revised as scope and roles are firmed up.*
