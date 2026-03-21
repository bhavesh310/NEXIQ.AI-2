import { useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { useThemeStore } from "./store";

// Pages
import LandingPage from "./pages/LandingPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";

// App Router with OAuth handling
const AppRouter = () => {
  const location = useLocation();
  
  // Check for session_id in hash (OAuth callback)
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }
  
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
};

function App() {
  const { initTheme } = useThemeStore();
  
  useEffect(() => {
    initTheme();
  }, [initTheme]);
  
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
