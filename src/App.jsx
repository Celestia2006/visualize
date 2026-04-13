import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useUserStore } from "./store/userStore";
import AuthPage from "./pages/Auth/AuthPage";
import LandingPage from "./pages/Landing/Landingpage";
import SubjectPage from "./pages/Subject/Subjectpage";
import TopicPage from "./pages/Topic/Topicpage";

// Redirects to /auth if not logged in
function PrivateRoute({ children }) {
  const user = useUserStore((state) => state.user);
  return user ? children : <Navigate to="/auth" replace />;
}

// Redirects to /landing if already logged in (so login page isn't shown again)
function PublicRoute({ children }) {
  const user = useUserStore((state) => state.user);
  return user ? <Navigate to="/landing" replace /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />

        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        <Route
          path="/landing"
          element={
            <PrivateRoute>
              <LandingPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/subject/:subjectKey"
          element={
            <PrivateRoute>
              <SubjectPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/subject/:subjectKey/:topicKey"
          element={
            <PrivateRoute>
              <TopicPage />
            </PrivateRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
