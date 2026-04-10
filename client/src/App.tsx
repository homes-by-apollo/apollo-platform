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
import PublicBlogPost from "./pages/PublicBlogPost";
import BuyersGuideThankYou from "./pages/BuyersGuideThankYou";
import SCOPSDashboard from "./pages/SCOPSDashboard";
import SCOPSProperties from "./pages/SCOPSProperties";
import SCOPSBlog from "./pages/SCOPSBlog";
import SCOPSUsers from "./pages/SCOPSUsers";
import SCOPSUtmBuilder from "./pages/SCOPSUtmBuilder";
import SCOPSScheduling from "./pages/SCOPSScheduling";
import SCOPSPipeline from "./pages/SCOPSPipeline";
import SCOPSSettings from "./pages/SCOPSSettings";
import SCOPSEngine from "./pages/SCOPSEngine";
import SCOPSCampaigns from "./pages/SCOPSCampaigns";
import SCOPSFloorPlans from "./pages/SCOPSFloorPlans";
import SCOPSPropertyEdit from "./pages/SCOPSPropertyEdit";
import FAQsPage from "./pages/FAQsPage";
import FloorPlans from "./pages/FloorPlans";
import FloorPlanDetail from "./pages/FloorPlanDetail";
import ListingAlerts from "./pages/ListingAlerts";
import PahrumpVsLasVegas from "./pages/PahrumpVsLasVegas";
import FreeLotAnalysis from "./pages/FreeLotAnalysis";
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
      <Route path="/blog/:slug" component={PublicBlogPost} />
      <Route path="/buyers-guide-thank-you" component={BuyersGuideThankYou} />
      <Route path="/faqs" component={FAQsPage} />
      <Route path="/floor-plans" component={FloorPlans} />
      <Route path="/floor-plans/:slug" component={FloorPlanDetail} />
      <Route path="/listing-alerts" component={ListingAlerts} />
      <Route path="/pahrump-vs-las-vegas" component={PahrumpVsLasVegas} />
      <Route path="/free-lot-analysis" component={FreeLotAnalysis} />

      {/* Auth routes */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* SCOPS routes (new) */}
      <Route path="/scops" component={SCOPSDashboard} />
      <Route path="/scops/properties" component={SCOPSProperties} />
      <Route path="/scops/properties/new" component={SCOPSPropertyEdit} />
      <Route path="/scops/properties/:id/edit" component={SCOPSPropertyEdit} />
      <Route path="/scops/blog" component={SCOPSBlog} />
      <Route path="/scops/users" component={SCOPSUsers} />
      <Route path="/scops/utm-builder">{() => <Redirect to="/scops/campaigns?tab=utm" />}</Route>
      <Route path="/scops/scheduling" component={SCOPSPipeline} />
      <Route path="/scops/pipeline" component={SCOPSPipeline} />
      <Route path="/scops/scheduling/tours" component={SCOPSScheduling} />
      <Route path="/scops/settings" component={SCOPSSettings} />
      <Route path="/scops/engine" component={SCOPSEngine} />
      <Route path="/scops/email">{() => <Redirect to="/scops/campaigns?tab=email" />}</Route>
      <Route path="/scops/campaigns" component={SCOPSCampaigns} />
      <Route path="/scops/floor-plans" component={SCOPSFloorPlans} />

      {/* Backward-compatibility redirects: /crm/* → /scops/* */}
      <Route path="/crm">{() => <Redirect to="/scops" />}</Route>
      <Route path="/crm/properties">{() => <Redirect to="/scops/properties" />}</Route>
      <Route path="/crm/blog">{() => <Redirect to="/scops/blog" />}</Route>
      <Route path="/crm/users">{() => <Redirect to="/scops/users" />}</Route>
      <Route path="/crm/utm-builder">{() => <Redirect to="/scops/campaigns?tab=utm" />}</Route>
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
