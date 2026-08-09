# Test Cases - Calista (Frontend)

## boardPaperScopeC.test.jsx

| Test ID | Test Name | Description | Expected Outcome |
|---|---|---|---|
| FE-CT-001 | Blocks generation and lists every missing field when nothing is filled in | Renders `BoardPaperPage` with no tender/title/purpose/preparedBy filled in and clicks "Generate Board Paper" immediately. | A destructive toast is shown with title "Please complete all required fields" and description "Tender, Board Paper Title, Purpose, Prepared By", and neither `generateBoardPaper` nor navigation is called. |
| FE-CT-002 | Selects a tender, auto-fills the title, and generates the board paper (UC1 main flow) | Mocks `listTenders`/`generateBoardPaper`, selects tender "TC-CALISTA-001" from the combobox, selects purpose "Approval Required", and types a preparer name before submitting. | Selecting the tender auto-fills the vendor name and a title of "Board Paper - TC-CALISTA-001"; `generateBoardPaper` is called with the correct `{tenderId, title, purpose, preparedBy}` payload, and the app navigates to `/board-papers/result` with matching state. |
| FE-CT-003 | Shows an error toast and does not navigate when AI generation fails | Fills in the same valid form (tender, purpose, preparer name) but mocks `generateBoardPaper` to reject with an API error message "AI generation failed." | A destructive toast is shown with title "Error" and description "AI generation failed.", and `mockNavigate` is never called. |
