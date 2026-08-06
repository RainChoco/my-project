import * as Yup from 'yup';
import { BCA_GRADES, BIZSAFE_LEVELS } from './constants';

// Mirrors backend/src/validators/tenderValidator.js's createTenderSchema/updateTenderSchema
// (body portion) so client-side validation never drifts from what the API will accept.

// Blank number inputs come through Formik as '' - without this transform, Yup's number()
// casts '' to NaN and reports a "must be a number" typeError instead of "is required"
// (or, for optional fields, instead of just passing through as empty).
const blankToUndefined = (value, originalValue) => (originalValue === '' ? undefined : value);
const blankToNull = (value, originalValue) => (originalValue === '' ? null : value);

// Native <select> values are always strings ('true'/'false') - coerce back to a real
// boolean so the PATCH payload matches backend/src/validators/tenderValidator.js's
// eligibilityOverrideSchema (`passed: yup.boolean().required()`).
const stringToBoolean = (value, originalValue) => {
  if (typeof originalValue === 'boolean') return originalValue;
  if (originalValue === 'true') return true;
  if (originalValue === 'false') return false;
  return value;
};

export const createTenderSchema = Yup.object({
  contractId: Yup.string().trim().required('Please select a contract'),
  tender_ref_no: Yup.string().trim().required('Tender reference number is required'),
  vendor_name: Yup.string().trim().required('Vendor name is required'),
  submission_date: Yup.date().typeError('Enter a valid date').required('Submission date is required'),
  main_offer_price: Yup.number()
    .transform(blankToUndefined)
    .typeError('Main offer price must be a number')
    .positive('Main offer price must be a positive number')
    .required('Main offer price is required'),
  alternative_offer_price: Yup.number()
    .transform(blankToNull)
    .typeError('Alternative offer price must be a number')
    .positive('Alternative offer price must be a positive number')
    .nullable(),
  status: Yup.string()
    .oneOf(['draft', 'submitted', 'under_evaluation'], 'Invalid submission status')
    .required('Submission status is required'),
  eligibility_status: Yup.string()
    .oneOf(['eligible', 'flagged', 'pending'], 'Invalid eligibility status')
    .required('Initial eligibility status is required'),
  // -- Additional Vendor & Compliance Information (all optional) --
  vendor_uen: Yup.string().transform(blankToNull).trim().nullable(),
  contact_person_name: Yup.string().transform(blankToNull).trim().nullable(),
  contact_person_email: Yup.string().transform(blankToNull).trim().email('Enter a valid email').nullable(),
  proposed_completion_months: Yup.number()
    .transform(blankToNull)
    .typeError('Must be a number')
    .integer('Must be a whole number')
    .positive('Must be a positive number')
    .nullable(),
  tender_validity_days: Yup.number()
    .transform(blankToNull)
    .typeError('Must be a number')
    .integer('Must be a whole number')
    .positive('Must be a positive number')
    .nullable(),
  bizsafe_level: Yup.string().oneOf(BIZSAFE_LEVELS, 'Invalid bizSAFE level'),
  conflict_of_interest_declared: Yup.boolean(),
});

export const editTenderSchema = Yup.object({
  tender_ref_no: Yup.string().trim().required('Tender reference number is required'),
  vendor_name: Yup.string().trim().required('Vendor name is required'),
  submission_date: Yup.date().typeError('Enter a valid date').required('Submission date is required'),
  main_offer_price: Yup.number()
    .transform(blankToUndefined)
    .typeError('Main offer price must be a number')
    .positive('Main offer price must be a positive number')
    .required('Main offer price is required'),
  alternative_offer_price: Yup.number()
    .transform(blankToNull)
    .typeError('Alternative offer price must be a number')
    .positive('Alternative offer price must be a positive number')
    .nullable(),
  paid_up_capital: Yup.number()
    .transform(blankToNull)
    .typeError('Paid-up capital must be a number')
    .positive('Paid-up capital must be a positive number')
    .nullable(),
  bca_fm01_license_no: Yup.string().transform(blankToNull).nullable(),
  bca_fm01_grade: Yup.string().transform(blankToNull).oneOf([...BCA_GRADES, null], 'Invalid BCA grade').nullable(),
  non_debarment_declared: Yup.boolean(),
});

// Mirrors backend/src/validators/tenderValidator.js's eligibilityOverrideSchema (UC-A7).
export const eligibilityOverrideSchema = Yup.object({
  passed: Yup.boolean().transform(stringToBoolean).required('Select an outcome'),
  notes: Yup.string().trim().min(1, 'Notes is required').required('Notes is required'),
});

// Eligibility Configuration settings view (EligibilityConfigPage). Per-grade "required
// unless Unlimited" cross-field logic lives in the page's own formik `validate` function
// instead of here, since Yup's `when()` can't easily reach a sibling top-level field
// (bcaUnlimited.<grade>) from inside a nested bcaLimits.<grade> schema without threading
// validation context through - a plain optional-number check here is enough for the shape.
// max_tender_value itself mirrors backend/src/validators/tenderValidator.js's
// bcaGradeLimitUpdateSchema (positive number or null).
export const eligibilityConfigSchema = Yup.object({
  bcaLimits: Yup.object(
    Object.fromEntries(
      BCA_GRADES.map((grade) => [
        grade,
        Yup.number().transform(blankToUndefined).typeError('Must be a number').positive('Must be a positive number'),
      ])
    )
  ),
  minPaidUpCapital: Yup.number()
    .transform(blankToUndefined)
    .typeError('Must be a number')
    .positive('Must be a positive number')
    .required('Minimum paid-up capital is required'),
  minBizsafeLevel: Yup.string().oneOf(BIZSAFE_LEVELS, 'Invalid bizSAFE level').required(),
});
