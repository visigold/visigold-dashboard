import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ClientProvider } from "./contexts/ClientContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import ClientsPage from "./pages/ClientsPage";
import PerformancePage from "./pages/PerformancePage";
import QuizPage from "./pages/QuizPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage, { isAuthenticated, logout } from "./pages/LoginPage";
import AdminClientAccessPage from "./pages/AdminClientAccessPage";
import ClientLoginPage from "./pages/ClientLoginPage";
import ClientDashboardPage from "./pages/ClientDashboardPage";

function Router({ onLogout }: { onLogout: () => void }) {
  return (
    <DashboardLayout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={ClientsPage} />
        <Route path="/performance" component={PerformancePage} />
        <Route path="/quiz" component={QuizPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/admin/client-access" component={AdminClientAccessPage} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
  }, []);

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ClientProvider>
          <TooltipProvider>
            <Toaster />
            <Switch>
              {/* Routes publiques pour les clients */}
              <Route path="/client-login" component={ClientLoginPage} />
              <Route path="/client-dashboard" component={ClientDashboardPage} />
              
              {/* Routes protégées pour l'admin */}
              <Route path="/:rest*">
                {authenticated ? (
                  <Router onLogout={handleLogout} />
                ) : (
                  <LoginPage onSuccess={() => setAuthenticated(true)} />
                )}
              </Route>
            </Switch>
          </TooltipProvider>
        </ClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
