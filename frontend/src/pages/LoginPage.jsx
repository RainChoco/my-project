import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiClient } from '../lib';
import { useAuth } from '../context';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

const loginSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const response = await apiClient.post('/auth/login', values);
        login(response.data.data.token);
        const redirectTo = location.state?.from?.pathname ?? '/';
        navigate(redirectTo, { replace: true });
      } catch (error) {
        setServerError(error.response?.data?.message ?? 'Login failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-sm">
        <form onSubmit={formik.handleSubmit} noValidate>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Town Council Tender Process Automation</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-xs text-destructive">{formik.errors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.password && formik.errors.password && (
                <p className="text-xs text-destructive">{formik.errors.password}</p>
              )}
            </div>
            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
