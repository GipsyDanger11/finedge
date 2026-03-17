import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Analytics from "@/pages/Analytics";
import Alerts from "@/pages/Alerts";
import Community from "@/pages/Community";
import Login from "@/pages/Login";
import Logout from "@/pages/Logout";
import Market from "@/pages/Market";
import NotFound from "@/pages/NotFound";
import Portfolio from "@/pages/Portfolio";
import Profile from "@/pages/Profile";
import SharedPortfolio from "@/pages/SharedPortfolio";
import Settings from "@/pages/Settings";
import Trading from "@/pages/Trading";
import Transactions from "@/pages/Transactions";
import { AnimatePresence, motion } from "framer-motion";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { useLocation } from "wouter";

function AuthedLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  const [location] = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/login"} component={Login} />
          <Route path={"/logout"} component={Logout} />
          <Route path={"/share/:portfolioId"} component={SharedPortfolio} />
          <Route
            path={"/dashboard"}
            component={() => (
              <AuthedLayout>
                <Dashboard />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/portfolio"}
            component={() => (
              <AuthedLayout>
                <Portfolio />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/transactions"}
            component={() => (
              <AuthedLayout>
                <Transactions />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/trading"}
            component={() => (
              <AuthedLayout>
                <Trading />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/profile"}
            component={() => (
              <AuthedLayout>
                <Profile />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/settings"}
            component={() => (
              <AuthedLayout>
                <Settings />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/market"}
            component={() => (
              <AuthedLayout>
                <Market />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/analytics"}
            component={() => (
              <AuthedLayout>
                <Analytics />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/alerts"}
            component={() => (
              <AuthedLayout>
                <Alerts />
              </AuthedLayout>
            )}
          />
          <Route
            path={"/community"}
            component={() => (
              <AuthedLayout>
                <Community />
              </AuthedLayout>
            )}
          />
          <Route path={"/404"} component={NotFound} />
          {/* Final fallback route */}
          <Route component={NotFound} />
        </Switch>
      </motion.div>
    </AnimatePresence>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
