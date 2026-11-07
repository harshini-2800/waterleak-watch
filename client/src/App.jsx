import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';

import Navbar from './components/layout/Navbar.jsx';
import MobileNav from './components/layout/MobileNav.jsx';
import Footer from './components/layout/Footer.jsx';

import Home from './pages/Home.jsx';
import Report from './pages/Report.jsx';
import IncidentDetail from './pages/IncidentDetail.jsx';
import TrackReport from './pages/TrackReport.jsx';
import MapPage from './pages/MapPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import CrewJobs from './pages/CrewJobs.jsx';
import Analytics from './pages/Analytics.jsx';
import MyReports from './pages/MyReports.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30s
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function ProtectedAdminRoute({ children }) {
  const { user, isLoading, isAdmin } = useAuth();
  if (isLoading) return null;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedCrewRoute({ children }) {
  const { user, isLoading, isCrew, isAdmin } = useAuth();
  if (isLoading) return null;
  if (!user || (!isCrew && !isAdmin)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <div className="flex flex-col min-h-screen bg-background-deep text-slate-100 transition-colors">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/report" element={<Report />} />
                    <Route path="/incidents/:id" element={<IncidentDetail />} />
                    <Route path="/track" element={<TrackReport />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedAdminRoute>
                          <AdminDashboard />
                        </ProtectedAdminRoute>
                      }
                    />
                    <Route
                      path="/crew"
                      element={
                        <ProtectedCrewRoute>
                          <CrewJobs />
                        </ProtectedCrewRoute>
                      }
                    />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/my-reports" element={<MyReports />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
                <Footer />
                <MobileNav />
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#0B1730',
                    color: '#E2E8F0',
                    border: '1px solid rgba(34, 211, 238, 0.2)',
                    backdropFilter: 'blur(16px)',
                    fontSize: '13px'
                  }
                }}
              />
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

