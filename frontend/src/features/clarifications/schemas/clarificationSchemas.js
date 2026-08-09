import * as Yup from 'yup';
import { DISPATCH_CHANNEL_VALUES } from '../constants';

// Every schema below mirrors the corresponding body schema in
// backend/src/validators/clarificationValidator.js exactly, so client-side
// validation never drifts from what the API will accept.

export const editMessageSchema = Yup.object({
  subject: Yup.string().trim().nullable(),
  body: Yup.string().trim().min(1, 'body is required').required('body is required'),
});

export const sendClarificationSchema = Yup.object({
  dispatch_channel: Yup.string()
    .oneOf(DISPATCH_CHANNEL_VALUES, 'dispatch_channel must be one of: ' + DISPATCH_CHANNEL_VALUES.join(', '))
    .required('dispatch_channel is required'),
});

export const recordResponseSchema = Yup.object({
  subject: Yup.string().trim().nullable(),
  body: Yup.string().trim().min(1, 'body is required').required('body is required'),
  response_notes: Yup.string().trim().min(1, 'response_notes is required').required('response_notes is required'),
});

// source_message_id is resolved programmatically (the thread's latest
// vendor_response message), not collected as a form field.
export const createJobAdjustmentRequestSchema = Yup.object({
  description: Yup.string().trim().min(1, 'description is required').required('description is required'),
  justification: Yup.string().trim().min(1, 'justification is required').required('justification is required'),
  is_material: Yup.boolean().default(false),
});

export const resolveSchema = Yup.object({
  outcome_notes: Yup.string().trim().min(1, 'outcome_notes is required').required('outcome_notes is required'),
});

// Client-side only - detectDeviation takes tenderId from the URL, not a body,
// but the lookup dialog still needs to validate the id before enabling submit.
// Accepts either the tender's ref no (e.g. "TC-2026-006") or its internal numeric id -
// the backend resolves whichever was entered.
export const tenderIdLookupSchema = Yup.object({
  tender_id: Yup.string().trim().required('Tender ref no or id is required'),
});
