import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlannerProvider } from './store/PlannerContext';
import { AuthProvider } from './store/AuthContext';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AppLayout from './layouts/AppLayout';
import DailyView from './pages/DailyView';
import WeeklyView from './pages/WeeklyView';
import MonthlyView from './pages/MonthlyView';
import Tasks from './pages/Tasks';
import Expenses from './pages/Expenses';
import Notes from './pages/Notes';
import Links from './pages/Links';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import PrivateCalendar from './pages/PrivateCalendar';
import SharedEventView from './pages/SharedEventView';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <PlannerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/shared/event/:uuid" element={<SharedEventView />} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<DailyView />} />
              <Route path="weekly" element={<WeeklyView />} />
              <Route path="monthly" element={<MonthlyView />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="notes" element={<Notes />} />
              <Route path="links" element={<Links />} />
              <Route path="templates" element={<Templates />} />
              <Route path="private" element={<PrivateCalendar />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PlannerProvider>
    </AuthProvider>
  );
}

export default App;