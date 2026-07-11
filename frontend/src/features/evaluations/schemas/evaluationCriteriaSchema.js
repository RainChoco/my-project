import * as Yup from 'yup';

// Mirrors backend/src/validators/evaluationCriteriaValidator.js exactly.
export const CATEGORIES = ['price', 'quality'];

export const createCriteriaSchema = Yup.object({
  criteria_name: Yup.string().trim().required('criteria_name is required'),
  category: Yup.string()
    .oneOf(CATEGORIES, 'category must be one of: ' + CATEGORIES.join(', '))
    .required('category is required'),
  weight_percentage: Yup.number()
    .typeError('weight_percentage must be a number')
    .moreThan(0, 'weight_percentage must be greater than 0')
    .max(100, 'weight_percentage must not exceed 100')
    .required('weight_percentage is required'),
});

export const updateCriteriaSchema = Yup.object({
  criteria_name: Yup.string().trim().optional(),
  weight_percentage: Yup.number()
    .typeError('weight_percentage must be a number')
    .moreThan(0, 'weight_percentage must be greater than 0')
    .max(100, 'weight_percentage must not exceed 100')
    .optional(),
});
