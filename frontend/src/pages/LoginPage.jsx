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
        // Login is usually the first request after the app's been idle, so it's
        // the one most likely to hit Render's backend mid cold-start (can take
        // 30-50s to wake up). Extended timeout + retryOnColdStart give it room
        // to survive that instead of failing on apiClient's normal 20s default -
        // safe to retry through a timeout here since re-submitting the same
        // login has no harmful side effect, unlike e.g. a create/update request.
        const response = await apiClient.post('/auth/login', values, {
          timeout: 45000,
          retryOnColdStart: true,
        });
        login(response.data.data.token);
        const redirectTo = location.state?.from?.pathname ?? '/';
        navigate(redirectTo, { replace: true });
      } catch (error) {
        // Logged so a misconfigured VITE_API_BASE_URL or backend CORS
        // rejection is visible in the browser console instead of only
        // surfacing as a generic message to the user.
        console.error('Login request failed:', error);

        if (error.response) {
          setServerError(error.response.data?.message ?? 'Login failed. Please try again.');
        } else if (error.request) {
          // Request went out but no response came back - CORS rejection, wrong
          // API base URL, or the backend is unreachable/still cold-starting
          // (apiClient already retried a couple of times before giving up).
          setServerError(
            'Unable to reach the server. It may be waking up from being idle - please wait a moment and try again.'
          );
        } else {
          setServerError('Login failed. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-center border-r-2 border-[#E31E24] bg-white px-16 text-slate-900 lg:flex">
        <img src="/em-services-logo.png" alt="EM Services" className="absolute top-8 left-8 h-9 w-auto" />
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Streamlining Town Council Tenders</h1>
        <p className="mt-4 max-w-md text-lg text-[#E31E24]">
          AI-assisted tender intake, eligibility checks, and evaluation - built for Town Council procurement teams.
        </p>
      </div>

      <div className="relative flex w-full flex-col items-center bg-[#E31E24] p-8 lg:w-1/2">
        <div className="flex flex-1 flex-col items-center justify-center">
          <p className="mb-6 text-2xl font-bold text-white">Welcome back!</p>
          <Card className="w-full max-w-sm border-2 border-white/40 shadow-xl">
            <form onSubmit={formik.handleSubmit} noValidate>
              <CardContent className="flex flex-col gap-6 pt-8">
                <p className="mb-4 text-xl font-semibold text-[#E31E24]">Login</p>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    className="h-10 rounded-md border border-input bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E31E24]"
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
                    className="h-10 rounded-md border border-input bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#E31E24]"
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
                      className="h-4 w-4 rounded border-input text-[#E31E24] focus:ring-[#E31E24]"
                    />
                    Remember me
                  </label>
                  <button type="button" className="text-sm font-medium text-[#E31E24] hover:underline">
                    Forgot password?
                  </button>
                </div>
                {serverError && <p className="text-sm text-destructive">{serverError}</p>}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full bg-[#E31E24] text-white transition-colors hover:bg-[#c01a1f]"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
                {import.meta.env.DEV && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#E31E24] text-[#E31E24] hover:bg-red-50 hover:text-[#c01a1f]"
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

        <div className="flex items-center justify-center gap-3 pb-4 text-xs text-red-100">
          <a href="#" className="hover:text-white hover:underline">Privacy Policy</a>
          <span aria-hidden="true">&middot;</span>
          <a href="#" className="hover:text-white hover:underline">Contact Support</a>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
