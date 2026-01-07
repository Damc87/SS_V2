import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import { AppLayout } from '../layouts/Layout';
import { lazy } from 'react';

const Dashboard = lazy(() => import('../features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const ProjectsPage = lazy(() => import('../features/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const PhasesPage = lazy(() => import('../features/phases/PhasesPage').then((m) => ({ default: m.PhasesPage })));
const CostsPage = lazy(() => import('../features/costs/CostsPage').then((m) => ({ default: m.CostsPage })));
const ContractorsPage = lazy(() => import('../features/contractors/ContractorsPage').then((m) => ({ default: m.ContractorsPage })));
const DocumentsPage = lazy(() => import('../features/documents/DocumentsPage').then((m) => ({ default: m.DocumentsPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const PhaseOverview = lazy(() => import('../features/phase-overview/PhaseOverview').then((m) => ({ default: m.PhaseOverview })));
import { Toaster } from 'sonner';

export const App = () => {
  return (
    <HashRouter>
      <Toaster position="top-right" richColors duration={3200} />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/pregled-po-fazah" element={<PhaseOverview />} />
          <Route path="/projekti" element={<ProjectsPage />} />
          <Route path="/faze" element={<PhasesPage />} />
          <Route path="/stroski" element={<CostsPage />} />
          <Route path="/izvajalci" element={<ContractorsPage />} />
          <Route path="/dokumenti" element={<DocumentsPage />} />
          <Route path="/nastavitve" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};
