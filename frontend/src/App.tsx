import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CreatorPage } from './pages/CreatorPage';
import { SheetPage } from './pages/SheetPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/creator" element={<CreatorPage />} />
          <Route path="/sheet" element={<SheetPage />} />
          <Route path="/" element={<Navigate to="/creator" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
