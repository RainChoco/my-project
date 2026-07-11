import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context';
import { AppRoutes } from './routes';
import { Toaster } from './components/ui/toaster';

// Root component. Route tree and per-role access lives in routes/routeConfig.jsx
// and routes/AppRoutes.jsx - add new feature routes there, not here.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
