import * as Yup from 'yup';

// Mirrors backend/src/validators/evaluationCriteriaValidator.js exactly.
export const CATEGORIES = ['price', 'quality', 'experience', 'capability', 'compliance', 'other'];

export const CATEGORY_LABELS = {
  price: 'Price',
  quality: 'Quality',
  experience: 'Experience',
  capability: 'Capability',
  compliance: 'Compliance',
  other: 'Other',
};

export const createCriteriaSchema = Yup.object({
  criteria_name: Yup.string().trim().required('criteria_name is required'),
  category: Yup.string()
    .oneOf(CATEGORIES, 'category must be one of: ' + CATEGORIES.join(', '))
    .required('category is required'),
  description: Yup.string().trim()
    .min(10, 'Describe what evaluators should assess (at least 10 characters).')
    .max(500, 'description must be 500 characters or fewer')
    .required('description is required'),
  weight_percentage: Yup.number()
    .typeError('weight_percentage must be a number')
    .moreThan(0, 'weight_percentage must be greater than 0')
    .max(100, 'weight_percentage must not exceed 100')
    .required('weight_percentage is required'),
});

export const updateCriteriaSchema = Yup.object({
  criteria_name: Yup.string().trim().optional(),
  description: Yup.string().trim()
    .max(500, 'description must be 500 characters or fewer')
    .optional(),
  weight_percentage: Yup.number()
    .typeError('weight_percentage must be a number')
    .moreThan(0, 'weight_percentage must be greater than 0')
    .max(100, 'weight_percentage must not exceed 100')
    .optional(),
});
