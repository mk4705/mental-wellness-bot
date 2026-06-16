// App.js — Root component: sets up React Router and wraps everything in AuthProvider
// Route definitions are centralized here to maintain high level structure visibility.

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

import { LoginPage }      from "./pages/LoginPage";
import { RegisterPage }   from "./pages/RegisterPage";
import { IndexRedirect }  from "./pages/IndexRedirect";
import { ChatPage }       from "./pages/ChatPage";
import { DashboardPage }  from "./pages/DashboardPage";
import { MemoryPage }     from "./pages/MemoryPage";
import { NotFoundPage }   from "./pages/NotFoundPage";

function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute><IndexRedirect /></ProtectedRoute>
            } />
            <Route path="/chat/:sessionId" element={
              <ProtectedRoute><ChatPage /></ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute><DashboardPage /></ProtectedRoute>
            } />
            <Route path="/memory" element={
              <ProtectedRoute><MemoryPage /></ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}

export default App;