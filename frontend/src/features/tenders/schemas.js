import * as Yup from 'yup';
import { BCA_GRADES } from './constants';

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
