import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { CreatorPage } from './pages/CreatorPage';
import { SheetPage } from './pages/SheetPage';
import { useCharacterStore } from './store/useCharacterStore';

function App() {
  const fetchItems = useCharacterStore(state => state.fetchItemsCatalog);
  const fetchSpells = useCharacterStore(state => state.fetchSpellsCatalog);
  const fetchFeats = useCharacterStore(state => state.fetchFeatsCatalog);

  useEffect(() => {
    fetchItems();
    fetchSpells();
    fetchFeats();
  }, [fetchItems, fetchSpells, fetchFeats]);

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
