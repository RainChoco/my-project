# API Documentation – AI Board Paper & Proposal Generation
Author: Calista Tan

---

# API 1 – Generate AI Board Paper

## Method

POST

## Path

/api/boardpapers

## Description

Generate an AI Board Paper from a completed tender.

## Headers

Content-Type: application/json

Authorization: Bearer JWT Token

## Request Body

```json
{
    "tenderId": 1,
    "title": "Managing Agent Recommendation",
    "purpose": "Recommendation",
    "language": "English",
    "sections": [
        "Executive Summary",
        "Background",
        "Financial Analysis",
        "Risk Assessment"
    ]
}
```

## Success Response

```json
{
    "boardPaperId": 101,
    "status": "Generated Successfully"
}
```

## Error Codes

| Code | Description |
|------|-------------|
|400|Missing required fields|
|401|Unauthorised|
|404|Tender not found|
|500|AI generation failed|

---

# API 2 – View Generated Board Paper

## Method

GET

## Path

/api/boardpapers/:id

## Description

Retrieve a generated Board Paper.

## Headers

Authorization: Bearer JWT Token

## Success Response

```json
{
    "boardPaperId":101,
    "title":"Managing Agent Recommendation",
    "purpose":"Recommendation",
    "language":"English",
    "status":"Generated"
}
```

## Error Codes

| Code | Description |
|------|-------------|
|401|Unauthorised|
|404|Board Paper not found|
|500|Database error|

---

# API 3 – Update Board Paper

## Method

PUT

## Path

/api/boardpapers/:id

## Description

Update an existing Board Paper.

## Headers

Content-Type: application/json

Authorization: Bearer JWT Token

## Request Body

```json
{
    "title":"Updated Board Paper",
    "purpose":"Approval Required"
}
```

## Success Response

```json
{
    "message":"Board Paper updated successfully."
}
```

## Error Codes

| Code | Description |
|------|-------------|
|400|Invalid request|
|401|Unauthorised|
|404|Board Paper not found|
|500|Database error|

---

# API 4 – Generate Proposal

## Method

POST

## Path

/api/proposals

## Description

Generate a proposal from a Board Paper.

## Headers

Content-Type: application/json

Authorization: Bearer JWT Token

## Request Body

```json
{
    "boardPaperId":101
}
```

## Success Response

```json
{
    "proposalId":301,
    "status":"Proposal Generated"
}
```

## Error Codes

| Code | Description |
|------|-------------|
|401|Unauthorised|
|404|Board Paper not found|
|500|AI generation failed|

---

# API 5 – View Proposal

## Method

GET

## Path

/api/proposals/:id

## Description

Retrieve a generated proposal.

## Headers

Authorization: Bearer JWT Token

## Success Response

```json
{
    "proposalId":301,
    "status":"Generated"
}
```

## Error Codes

| Code | Description |
|------|-------------|
|401|Unauthorised|
|404|Proposal not found|
|500|Database error|
