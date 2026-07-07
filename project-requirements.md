# Project Requirements - SCCCI AI Challenge (Tender Automation 4C)

## 1. Project Scope & Context
This full-stack application streamlines the Town Council Managing Agent (MA) Tender Evaluation Process. It leverages Generative AI to automate terms comparison across multiple vendor bids, calculate Price-Quality Method (PQM) scoring parameters, and generate structured content for Executive Board Papers and Interview Presentation Decks.

## 2. Core Functional Specifications
The application implements the specific workflows divided among the 5 team members:

### Scope A: Tender Document Receiving & CRUD (Zheng Hong)
- Core Entity: Tender Submissions (Bids) and associated Document Files.
- Basic Functions: Full CRUD capability to upload, edit, track, and delete vendor tender submittals.
- Enhanced AI Capability: Automated file ingestion to parse and flag critical eligibility requirements (Minimum S$2M paid-up capital, BCA FM01 licensing registration, and non-debarment declarations).

### Scope B: Evaluation, Processing & Risk Framework (Jerrold)
- Core Entity: Evaluation Matrices and Approval Workflows.
- Basic Functions: Create and manage evaluation criteria weights, log approvals/rejections by C-suite roles.
- Enhanced AI Capability: Process vendor bids to extract and compute Price-Quality Method (PQM) scores out of 100%, and generate an automated Risk Assessment & Mitigation Matrix based on vendor constraints.

### Scope C: Presentation Deck & Board Paper Generation (Calista)
- Core Entity: Generated Reports, Presentation Decks, and Board Papers.
- Basic Functions: Manage, version, and view generated board papers and presentation content.
- Enhanced AI Capability: Transform processed raw comparison tables dynamically into structured text outputs ready to copy-paste into corporate Board Papers and standardized 28-slide Interview Presentation Agenda templates.

### Scope D: Alternate Proposal Communication System (Sulaiman)
- Core Entity: Clarification/Alternate Proposal Logs.
- Basic Functions: Log and manage outbound messages, responses, and job adjustment requests sent to vendors.
- Enhanced AI Capability: Smart identification of pricing deviations between a vendor's "Main Offer" and "Alternative Offer," auto-drafting official clarification request logs to be dispatched to the vendor.

### Scope E: Strategic Dashboard & Tender Rankings (Kai Xuan)
- Core Entity: Tender Rankings, KPI Metrics, and Performance Checklists.
- Basic Functions: Submit and archive localized scoring lists, map out project lists.
- Enhanced AI Capability: Presentation-Ready Advanced Analytics Dashboard featuring Multi-Level Filtering (Owner, Category, Status Drill-Down) and interactive charts highlighting historical tender parameters.