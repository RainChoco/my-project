import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { apiClient } from '../lib';
import { useAuth } from '../context';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';

const loginSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

// TEMP DEV ONLY - pre-signed ma_staff (Alice Tan) token from design/test-tokens.md.
// Reuses the exact same login()/AuthContext flow as a real login; no auth logic changed.
// import.meta.env.DEV keeps this out of production builds. Remove this whole block when done.
const DEV_MA_STAFF_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImZ1bGxfbmFtZSI6IkFsaWNlIFRhbiIsImVtYWlsIjoiYWxpY2UudGFuQHRvd25tcy5nb3Yuc2ciLCJyb2xlIjoibWFfc3RhZmYiLCJpYXQiOjE3ODM2OTk5ODYsImV4cCI6MTc5MTQ3NTk4Nn0.dgHYHXwrhptOIAdFQ2cvlEP8VQdKDXETaNVjV1ckoBI';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);

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
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-center bg-[#E31E24] px-16 text-white lg:flex">
        <p className="absolute top-8 left-8 text-xl font-bold tracking-wide text-white">EM SERVICES</p>
        <h1 className="text-4xl font-bold tracking-tight">Streamlining Town Council Tenders</h1>
        <p className="mt-4 max-w-md text-lg text-red-100">
          AI-assisted tender intake, eligibility checks, and evaluation - built for Town Council procurement teams.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center bg-background p-8 lg:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="mb-6 text-2xl font-bold text-gray-700">Welcome back!</p>
          <Card className="w-full max-w-sm">
            <form onSubmit={formik.handleSubmit} noValidate>
              <CardContent className="flex flex-col gap-6 pt-8">
                <p className="mb-4 text-xl font-semibold text-gray-800">Login</p>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
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
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-xs text-destructive">{formik.errors.password}</p>
                  )}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                      id="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    />
                    Remember me
                  </label>
                  <button type="button" className="text-sm font-medium text-blue-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
                {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full transition-colors hover:bg-gray-800"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
                {import.meta.env.DEV && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      login(DEV_MA_STAFF_TOKEN);
                      const redirectTo = location.state?.from?.pathname ?? '/';
                      navigate(redirectTo, { replace: true });
                    }}
                  >
                    Dev Quick Login (ma_staff)
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>

        <div className="flex items-center justify-center gap-3 pb-4 text-xs text-gray-400">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <span aria-hidden="true">&middot;</span>
          <a href="#" className="hover:underline">Contact Support</a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
