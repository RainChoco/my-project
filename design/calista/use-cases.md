# Use Cases – AI Board Paper & Proposal Generation
Author: Calista Tan

---

## UC1 – Generate AI Board Paper

### Actor
Procurement Officer

### Trigger
The officer selects a completed tender and clicks "Generate Board Paper".

### Main Flow
1. Officer opens the Board Paper Generator.
2. Officer selects a completed tender.
3. Officer enters the board paper title.
4. Officer selects the report purpose.
5. Officer selects the report language.
6. Officer chooses the sections to include.
7. Officer uploads supporting documents (optional).
8. Officer clicks **Generate Board Paper**.
9. The system generates a structured AI board paper.
10. The generated board paper is saved to the database.
11. The system displays the generated board paper.

### Alternative Flow
- No tender selected → System prompts the user to select a tender.
- AI generation fails → System displays an error message.
- Required fields are missing → Generation is cancelled until completed.

### Post-condition
A board paper is successfully generated and stored.

---

## UC2 – View Generated Board Paper

### Actor
Manager

### Trigger
Manager opens a generated board paper.

### Main Flow
1. Manager selects a generated report.
2. System retrieves the report.
3. System displays all generated sections.
4. Manager reviews the report.

### Alternative Flow
- Report not found.
- Database connection error.

### Post-condition
Board paper is displayed successfully.

---

## UC3 – Edit Generated Board Paper

### Actor
Procurement Officer

### Trigger
Officer clicks **Edit**.

### Main Flow
1. Officer opens the generated report.
2. Officer edits the title or selected sections.
3. Officer saves the changes.
4. System updates the report.

### Alternative Flow
- Validation fails.
- Save operation unsuccessful.

### Post-condition
Updated board paper is stored.

---

## UC4 – Export Board Paper as PDF

### Actor
Manager

### Trigger
Manager clicks **Export PDF**.

### Main Flow
1. Manager opens the report.
2. Clicks **Export PDF**.
3. System converts the report into PDF format.
4. PDF download begins.

### Alternative Flow
- PDF generation fails.

### Post-condition
PDF is downloaded successfully.

---

## UC5 – Generate Proposal

### Actor
Manager

### Trigger
Manager clicks **Generate Proposal**.

### Main Flow
1. Manager opens a generated board paper.
2. Clicks **Generate Proposal**.
3. AI creates a proposal using the board paper.
4. Proposal is saved.
5. Proposal is displayed.

### Alternative Flow
- AI generation fails.
- Board paper unavailable.

### Post-condition
Proposal is successfully generated and stored.
