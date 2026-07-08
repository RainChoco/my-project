## Problem

Town Council Managing Agents currently run tender evaluations manually - comparing vendor terms, checking eligibility, calculating Price-Quality Method (PQM) scores, and drafting board papers by hand. This full-stack application uses Generative AI (Gemini) to automate eligibility parsing, bid comparison, PQM scoring, risk assessment, and generation of board paper and presentation content, reducing manual effort and inconsistency across evaluators.

## Solution

The application is a full-stack tender evaluation platform where MA staff ingest vendor bid documents and Gemini parses eligibility data and structures bid terms for review. PQM scores and risk matrices are computed deterministically in the backend for accuracy, with human review gates before evaluators log approvals with a full audit trail. Approved data then flows automatically into board paper text, a 28-slide interview deck, vendor clarification logs, and a strategic rankings dashboard, turning a fragmented manual process into one connected workflow.

## Task Allocation

| Member | Scope of Features | Features Owned |
|---|---|---|
| Zheng Hong | Ingestion & CRUD | Tender Submission Intake; Tender CRUD & Status Tracking; Document Storage; AI Eligibility Parsing; Eligibility Flag Review Screen |
| Jerrold | Evaluation & Approval | Evaluation Criteria Weight Setup; AI Bid Term Extraction; PQM Score Calculation; AI Risk Matrix Generation; Risk Matrix Review Gate; Approval/Rejection Workflow; Approval Audit Trail |
| Calista | Board Papers/Decks Generation | Board Paper Text Generation; 28-Slide Interview Deck Generation; Report/Deck Versioning; Export to Editable Format |
| Sulaiman | Alternate Proposal Communication | Pricing Deviation Detection; Clarification Request Drafting; Draft Review-Before-Log Gate; Vendor Response Logging |
| Kai Xuan | Strategic Rankings Dashboard | Tender Ranking List; KPI/Analytics Dashboard; Multi-Level Filtering; Scoring List Submit & Archive |
| All (Group) | Shared Infrastructure | Authentication (register, login, JWT middleware, RBAC); Deployment setup |
