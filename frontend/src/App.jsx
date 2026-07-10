import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardPage } from './features/dashboard';

// Root component. Each scope adds its own <Route> here as its pages are built:
// features/tenders (Zheng Hong), features/evaluations (Jerrold),
// features/board-papers (Calista), features/clarifications (Sulaiman), features/auth (group).
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
