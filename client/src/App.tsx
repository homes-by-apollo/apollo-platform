import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ApolloSite from "./pages/ApolloSite";
import GetInTouch from "./pages/GetInTouch";
import FindYourHome from "./pages/FindYourHome";
import PublicBlog from "./pages/PublicBlog";
import SCOPSDashboard from "./pages/SCOPSDashboard";
import SCOPSProperties from "./pages/SCOPSProperties";
import SCOPSBlog from "./pages/SCOPSBlog";
import SCOPSUsers from "./pages/SCOPSUsers";
import SCOPSUtmBuilder from "./pages/SCOPSUtmBuilder";
import SCOPSScheduling from "./pages/SCOPSScheduling";
import AdminLogin from "./pages/AdminLogin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* Public site routes */}
      <Route path="/">{() => <ApolloSite initialPage="home" />}</Route>
      <Route path="/get-in-touch">{() => <GetInTouch />}</Route>
      <Route path="/find-your-home">{() => <FindYourHome />}</Route>
      <Route path="/blog" component={PublicBlog} />

      {/* Auth routes */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* SCOPS routes (new) */}
      <Route path="/scops" component={SCOPSDashboard} />
      <Route path="/scops/properties" component={SCOPSProperties} />
      <Route path="/scops/blog" component={SCOPSBlog} />
      <Route path="/scops/users" component={SCOPSUsers} />
      <Route path="/scops/utm-builder" component={SCOPSUtmBuilder} />
      <Route path="/scops/scheduling" component={SCOPSScheduling} />

      {/* Backward-compatibility redirects: /crm/* → /scops/* */}
      <Route path="/crm">{() => <Redirect to="/scops" />}</Route>
      <Route path="/crm/properties">{() => <Redirect to="/scops/properties" />}</Route>
      <Route path="/crm/blog">{() => <Redirect to="/scops/blog" />}</Route>
      <Route path="/crm/users">{() => <Redirect to="/scops/users" />}</Route>
      <Route path="/crm/utm-builder">{() => <Redirect to="/scops/utm-builder" />}</Route>
      <Route path="/crm/:rest*">{() => <Redirect to="/scops" />}</Route>

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
