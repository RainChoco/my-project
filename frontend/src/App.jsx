import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context';
import { AppRoutes } from './routes';

// Root component. Route tree and per-role access lives in routes/routeConfig.jsx
// and routes/AppRoutes.jsx - add new feature routes there, not here.
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
