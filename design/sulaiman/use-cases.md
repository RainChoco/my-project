# Use Cases - Sulaiman (Scope D: Alternate Proposal Communication System)

## UC-D1: AI Detection of Pricing Deviation (Main vs Alternative Offer)

- **Actor:** System (Gemini AI) / MA Staff
- **Trigger:** A tender with both a Main Offer and an Alternative Offer price completes PQM scoring (Scope B) and becomes available for clarification screening.
- **Main Flow:**
  1. System reads the tender's `main_offer_price` and `alternative_offer_price` (and any associated term sheets) once evaluation data is available.
  2. System sends both offers to Gemini to compute the pricing deviation and flag whether it exceeds a configured tolerance threshold.
  3. System creates a `clarification_logs` row with `status: 'flagged'`, storing the computed deviation amount/percentage and a short AI-generated rationale.
  4. MA staff / Evaluator is notified that a new clarification candidate is ready for review.
- **Edge Case / Alternative Flow:**
  - **No Alternative Offer submitted:** system skips deviation detection entirely for that tender - there is nothing to compare against, so no `clarification_logs` row is created.
  - **Deviation is within tolerance:** system still records the comparison result (for audit purposes) but sets `status: 'no_action_required'` instead of `'flagged'`, so it doesn't clutter the vendor liaison's action queue.

## UC-D2: AI Auto-Draft Clarification / Notification Message

- **Actor:** System (Gemini AI) / MA Staff
- **Trigger:** MA staff opens a `clarification_logs` row with `status: 'flagged'` to act on it.
- **Main Flow:**
  1. MA staff selects "Draft Clarification Message" on the flagged log.
  2. System sends the tender reference, vendor name, main/alternative offer figures, and the computed deviation to System / Gemini with a prompt to draft an official clarification request.
  3. Gemini returns a structured draft message (subject + body) asking the vendor to confirm or justify the pricing deviation.
  4. System saves the draft onto the `clarification_logs` row (`draft_message`, `status: 'draft_ready'`) - it is **not** sent yet.
- **Edge Case / Alternative Flow:**
  - **Gemini fails or times out:** system leaves the log at `status: 'flagged'` and surfaces an error so staff can retry the draft or write the message manually, rather than silently blocking the workflow.

## UC-D3: Review & Edit Draft Before Dispatch

- **Actor:** Vendor liaison staff / MA procurement staff
- **Trigger:** A `clarification_logs` row reaches `status: 'draft_ready'`.
- **Main Flow:**
  1. Staff opens the draft message alongside the source figures (main offer, alternative offer, computed deviation) it was generated from.
  2. Staff edits the subject/body as needed to correct tone, figures, or add context.
  3. Staff approves the message, moving `status` to `'approved'` and recording `approved_by` and `approved_at`.
- **Edge Case / Alternative Flow:**
  - **Staff notices the AI cited an incorrect figure (e.g. wrong offer amount):** system requires the edit to be saved before approval is allowed - a draft cannot be approved unchanged if the staff member flags a figure discrepancy, since sending a hallucinated number to a vendor is the exact reputational risk this review gate exists to prevent.

## UC-D4: Send Notification to Tenderer

- **Actor:** Vendor liaison staff
- **Trigger:** A `clarification_logs` row reaches `status: 'approved'`.
- **Main Flow:**
  1. Staff selects "Send to Vendor" on the approved message.
  2. System dispatches the message to the vendor's registered contact (email, or logged as a manual dispatch if sent outside the system).
  3. System updates the log to `status: 'sent'`, recording `sent_at` and the final message content actually dispatched.
  4. Log becomes visible in the tender's communication history awaiting a vendor response.
- **Edge Case / Alternative Flow:**
  - **Vendor has no contact information on file:** system blocks dispatch and prompts staff to add vendor contact details first, rather than silently failing to deliver the notification.

## UC-D5: Log Vendor Response to Clarification

- **Actor:** Vendor liaison staff (recording on behalf of the vendor)
- **Trigger:** The vendor replies to a sent clarification request (e.g. by email or letter).
- **Main Flow:**
  1. Staff opens the corresponding `clarification_logs` row (`status: 'sent'`).
  2. Staff records the vendor's response - confirmation of the alternative price, a revised offer, or a justification for the deviation - and attaches any supporting document.
  3. System saves the response, sets `status: 'responded'`, and records `responded_at`.
  4. Evaluators (Scope B) are notified that a response is available if it affects the tender's scoring.
- **Edge Case / Alternative Flow:**
  - **Vendor response introduces a new revised price:** system does not auto-update `main_offer_price`/`alternative_offer_price` on the tender record - it flags the tender for MA staff to manually confirm and apply the revision via Scope A, keeping the pricing change auditable rather than silently overwritten.

## UC-D6: View & Filter Clarification/Notification Logs

- **Actor:** Vendor liaison staff, MA procurement staff, Evaluators
- **Trigger:** A user needs to check the status of clarification requests across one or more tenders.
- **Main Flow:**
  1. User opens the clarification log list.
  2. System fetches `clarification_logs`, optionally filtered by tender, vendor, or `status` (`flagged`, `draft_ready`, `approved`, `sent`, `responded`, `resolved`).
  3. System displays each log's tender reference, vendor, deviation summary, current status, and last activity date.
  4. User selects a log to view the full message thread (draft history, sent message, vendor response).
- **Edge Case / Alternative Flow:**
  - **No logs match the filter:** system shows an empty state rather than an error, and preserves the applied filter so the user can adjust it.

## UC-D7: Manage Job Adjustment Request

- **Actor:** Vendor liaison staff
- **Trigger:** A vendor's response to a clarification implies a change to job scope, timeline, or terms (not just price) that needs to be formally logged and communicated back.
- **Main Flow:**
  1. Staff opens a `clarification_logs` row with `status: 'responded'`.
  2. Staff creates a linked job adjustment request, describing the requested change and its justification.
  3. Staff drafts (optionally AI-assisted, per UC-D2) and sends a follow-up notification confirming the adjustment terms to the vendor, reusing the review-before-send gate (UC-D3, UC-D4).
  4. System logs the adjustment request against the tender and clarification log for audit purposes.
- **Edge Case / Alternative Flow:**
  - **Requested adjustment materially changes the tender's price or scope after evaluation has started:** system blocks silent acceptance and requires the adjustment to be routed through the same approval roles that would review a tender edit (per Scope A's UC-A3 restriction on editing tenders mid-evaluation), so a job adjustment can't bypass the evaluation audit trail.

## UC-D8: Resend / Escalate Unanswered Notification

- **Actor:** Vendor liaison staff
- **Trigger:** A `clarification_logs` row has remained at `status: 'sent'` past a configured follow-up window (e.g. 5 business days) with no vendor response.
- **Main Flow:**
  1. System surfaces overdue `sent` logs on the vendor liaison staff's dashboard.
  2. Staff selects "Resend Reminder" on an overdue log.
  3. System generates a follow-up reminder message referencing the original clarification and sends it, appending a new entry to the log's message history rather than replacing the original.
  4. System resets the follow-up window from the new `sent_at` date.
- **Edge Case / Alternative Flow:**
  - **Tender's evaluation deadline is imminent and the vendor still hasn't responded:** system flags the log as `status: 'escalated'` and notifies MA procurement staff directly, since an unresolved pricing deviation close to deadline needs management attention rather than another automated reminder.

## UC-D9: Close / Resolve Clarification Log

- **Actor:** Vendor liaison staff / MA procurement staff
- **Trigger:** A vendor response (and any resulting job adjustment) has been reviewed and no further action is needed on a clarification.
- **Main Flow:**
  1. Staff opens a `clarification_logs` row with `status: 'responded'`.
  2. Staff records the final outcome (e.g. "deviation justified, no change" / "price revised and accepted" / "vendor declined to adjust").
  3. System sets `status: 'resolved'`, records `resolved_by` and `resolved_at`, and locks the log from further edits.
- **Edge Case / Alternative Flow:**
  - **Staff attempts to resolve a log with no outcome notes:** system rejects the save - a resolution must always carry a documented outcome, since it is what the audit trail relies on to explain why a flagged pricing deviation was accepted without further negotiation.
