const yup = require('yup');

const ROLES = ['ma_staff', 'evaluator', 'management', 'report_preparer', 'vendor_liaison'];

const registerSchema = yup.object({
  body: yup.object({
    full_name: yup.string().trim().required('full_name is required'),
    email: yup.string().email().required('email is required'),
    password: yup.string().min(8, 'password must be at least 8 characters').required('password is required'),
    role: yup.string().oneOf(ROLES, 'role must be one of: ' + ROLES.join(', ')).required('role is required')
  })
});

const loginSchema = yup.object({
  body: yup.object({
    email: yup.string().email().required('email is required'),
    password: yup.string().required('password is required')
  })
});

module.exports = {
  ROLES,
  registerSchema,
  loginSchema
};
