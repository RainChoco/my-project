# Database Schema – AI Board Paper & Proposal Generation
Author: Calista Tan

---

# Table: board_papers

### Description

Stores AI-generated Board Papers.

| Field | Data Type | Constraints |
|--------|-----------|-------------|
| board_paper_id | SERIAL | Primary Key |
| tender_id | INTEGER | Foreign Key, NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| purpose | VARCHAR(50) | NOT NULL |
| language | VARCHAR(30) | DEFAULT 'English' |
| executive_summary | TEXT | NULL |
| background | TEXT | NULL |
| scope_of_work | TEXT | NULL |
| financial_analysis | TEXT | NULL |
| risk_assessment | TEXT | NULL |
| recommendation | TEXT | NULL |
| created_by | INTEGER | Foreign Key |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Foreign Keys

- tender_id → tenders.tender_id
- created_by → users.user_id

---

# Table: proposals

### Description

Stores AI-generated Proposal Reports.

| Field | Data Type | Constraints |
|--------|-----------|-------------|
| proposal_id | SERIAL | Primary Key |
| board_paper_id | INTEGER | Foreign Key, NOT NULL |
| proposal_summary | TEXT | NOT NULL |
| status | VARCHAR(30) | DEFAULT 'Generated' |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Foreign Keys

- board_paper_id → board_papers.board_paper_id

---

# Table: uploaded_documents

### Description

Stores supporting documents uploaded for AI analysis.

| Field | Data Type | Constraints |
|--------|-----------|-------------|
| document_id | SERIAL | Primary Key |
| board_paper_id | INTEGER | Foreign Key |
| file_name | VARCHAR(255) | NOT NULL |
| file_type | VARCHAR(50) | NOT NULL |
| file_url | TEXT | NOT NULL |
| uploaded_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### Foreign Keys

- board_paper_id → board_papers.board_paper_id

---

# Database Relationships

```
Users (1)
      │
      ▼
Board Papers (Many)
      │
      ├──────────────► Uploaded Documents (Many)
      │
      └──────────────► Proposal (1)

Tender (1)
      │
      ▼
Board Papers (Many)
```

---

# Database Normalisation

The database follows **Third Normal Form (3NF)**.

- Each table has a single Primary Key.
- Foreign Keys maintain relationships between tables.
- Non-key attributes depend only on their table's Primary Key.
- Duplicate data is minimised to improve scalability.
- The schema supports future expansion without major structural changes.
