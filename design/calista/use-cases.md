# Use Cases – AI Board Paper & Proposal Generation
Author: Calista Tan

---

# UC1 – Generate AI Board Paper

## Actor
Procurement Officer

## Trigger
Officer selects a completed tender and clicks **Generate Board Paper**.

## Main Flow

1. Officer opens the Board Paper Generator.
2. Officer selects a completed tender.
3. Officer enters the Board Paper title.
4. Officer selects the report purpose.
5. Officer selects the report language.
6. Officer chooses the report sections.
7. Officer uploads supporting documents (optional).
8. Officer clicks **Generate Board Paper**.
9. AI analyses the tender information.
10. System generates the Board Paper.
11. System saves the Board Paper into the database.
12. Generated Board Paper is displayed.

## Alternative / Edge Cases

- No tender selected.
- Board Paper title is empty.
- AI generation fails.
- Database connection unavailable.
- Uploaded document format is unsupported.

## Post-condition

A new Board Paper is generated and stored successfully.

---

# UC2 – View Generated Board Paper

## Actor

Manager

## Trigger

Manager opens a generated Board Paper.

## Main Flow

1. Manager selects a Board Paper.
2. System retrieves the report.
3. System displays all generated sections.
4. Manager reviews the report.

## Alternative / Edge Cases

- Board Paper not found.
- Database unavailable.

## Post-condition

Board Paper is displayed.

---

# UC3 – Edit Generated Board Paper

## Actor

Procurement Officer

## Trigger

Officer clicks **Edit**.

## Main Flow

1. Officer edits the title.
2. Officer edits report sections.
3. Officer saves changes.
4. System validates the information.
5. Database is updated.

## Alternative / Edge Cases

- Validation fails.
- Save unsuccessful.
- User cancels editing.

## Post-condition

Updated Board Paper is saved.

---

# UC4 – Export Board Paper as PDF

## Actor

Manager

## Trigger

Manager clicks **Download PDF**.

## Main Flow

1. Manager opens the report.
2. Clicks Download PDF.
3. System converts the report into PDF.
4. PDF download begins.

## Alternative / Edge Cases

- PDF conversion fails.
- File download interrupted.

## Post-condition

Board Paper PDF is downloaded.

---

# UC5 – Generate Proposal

## Actor

Manager

## Trigger

Manager clicks **Generate Proposal**.

## Main Flow

1. Manager opens a generated Board Paper.
2. Clicks Generate Proposal.
3. AI analyses the Board Paper.
4. AI generates a proposal.
5. Proposal is saved.
6. Proposal is displayed.

## Alternative / Edge Cases

- Board Paper unavailable.
- AI service unavailable.
- Proposal generation fails.

## Post-condition

Proposal is generated successfully.

---

# UC6 – View Generated Proposal

## Actor

Procurement Officer

## Trigger

Officer opens Proposal History.

## Main Flow

1. Officer selects a proposal.
2. System retrieves proposal details.
3. Proposal is displayed.

## Alternative / Edge Cases

- Proposal not found.
- Database unavailable.

## Post-condition

Proposal is displayed successfully.
