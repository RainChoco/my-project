const yup = require('yup');

const CATEGORIES = ['price', 'quality'];

const idOnlySchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  })
});

const listCriteriaSchema = yup.object({
  query: yup.object({
    is_active: yup.boolean().optional()
  })
});

const createCriteriaSchema = yup.object({
  body: yup.object({
    criteria_name: yup.string().trim().required('criteria_name is required'),
    category: yup.string()
      .oneOf(CATEGORIES, 'category must be one of: ' + CATEGORIES.join(', '))
      .required('category is required'),
    weight_percentage: yup.number()
      .moreThan(0, 'weight_percentage must be greater than 0')
      .max(100, 'weight_percentage must not exceed 100')
      .required('weight_percentage is required')
  })
});

const updateCriteriaSchema = yup.object({
  params: yup.object({
    id: yup.number().integer().positive().required()
  }),
  body: yup.object({
    criteria_name: yup.string().trim().optional(),
    weight_percentage: yup.number()
      .moreThan(0, 'weight_percentage must be greater than 0')
      .max(100, 'weight_percentage must not exceed 100')
      .optional()
  })
});

module.exports = {
  CATEGORIES,
  idOnlySchema,
  listCriteriaSchema,
  createCriteriaSchema,
  updateCriteriaSchema
};
