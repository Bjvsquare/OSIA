import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './features/auth/AuthContext';
import { OnboardingProvider } from './features/onboarding/context/OnboardingContext';
import { TourProvider } from './features/tour/TourContext';
import { GuidedTour } from './features/tour/GuidedTour';
import { VoiceAgentButton } from './features/voice/VoiceAgentButton';
import { FeedbackButton } from './features/feedback/FeedbackButton';
import { OnboardingFlow } from './features/onboarding/OnboardingFlow';
import { VoiceTestPage } from './features/onboarding/components/VoiceTestPage';
import { RealtimeMinimal } from './features/onboarding/components/RealtimeMinimal';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { SharedViewPage } from './features/connect/SharedViewPage';
import { PrivacyDashboard } from './features/settings/PrivacyDashboard';
import { SettingsPage } from './features/settings/SettingsPage';
import { AdminPage } from './features/admin/AdminPage';
import { AdminRoute } from './features/admin/AdminRoute';
import { useAuth } from './features/auth/AuthContext';
import { FocusGateModal } from './features/auth/FocusGateModal';
import { AccountTypeSelector } from './features/auth/AccountTypeSelector';
import { Scene } from './components/canvas/Scene';
import { FoundingCircleLanding } from './features/founding/FoundingCircleLanding';
import { TwinHome } from './features/home/TwinHome';
import { LayerDetail } from './features/layers/LayerDetail';
import { CheckInPage } from './features/checkin/CheckInPage';
import { TimelinePage } from './features/journey/TimelinePage';
import { ReadinessPage } from './features/journey/ReadinessPage';
import { ConnectInvitePage } from './features/connect/ConnectInvitePage';
import { SharedPromptsPage } from './features/connect/SharedPromptsPage';
import { TeamHomePage } from './features/team/TeamHomePage';
import { TeamSessionPage } from './features/team/TeamSessionPage';
import { TeamPatternsPage } from './features/team/TeamPatternsPage';
import { ProDashboardPage } from './features/pro/ProDashboardPage';
import { EnterpriseAdminPage } from './features/enterprise/EnterpriseAdminPage';
import { DeveloperPortalPage } from './features/developer/DeveloperPortalPage';
import { PatternsPage } from './features/patterns/PatternsPage';
import { ProtocolsPage } from './features/protocols/ProtocolsPage';
import { BlueprintRefinementPage } from './features/refinement/BlueprintRefinementPage';
import { PricingPage } from './features/subscription/PricingPage';
import { SubscriptionManagement } from './features/subscription/SubscriptionManagement';
import { CheckoutSimulationPage } from './features/subscription/CheckoutSimulationPage';
import { ConnectPage } from './features/connect/ConnectPage';
import { TeamPage } from './features/team/TeamPage';
import { JourneyPage } from './features/journey/JourneyPage';
import { LayerLabPage } from './features/lab/LayerLabPage';
import { HighFidVizPage } from './features/lab/HighFidVizPage';
import { ThesisPage } from './features/thesis/ThesisPage';
import { InsightsHubPage } from './features/insights/InsightsHubPage';
import { ConnectorsPage } from './features/connectors/ConnectorsPage';
import { BlueYardPage } from './features/lab/BlueYardPage';
import { OsiaPage } from './features/osia/OsiaPage';
import { OrganizationSignupFlow } from './features/organization/components/OrganizationSignupFlow';
import { OrganizationSearchPage } from './features/organization/components/OrganizationSearchPage';
import { JoinOrganizationFlow } from './features/organization/components/JoinOrganizationFlow';
import { OrganizationPublicProfile } from './features/organization/components/OrganizationPublicProfile';
import { OrgDashboard } from './features/organization/OrgDashboard';
import { ConsentManagementScreen } from './features/organization/components/ConsentManagementScreen';
import { TeamDynamicsPage } from './features/teams/TeamDynamicsPage';
import { KYCSubmissionFlow } from './features/kyc/KYCSubmissionFlow';
import { KYCStatusPage } from './features/kyc/KYCStatusPage';
// Removed redundant organization imports
import type { ReactNode } from 'react';


// Guard routes that require authentication AND onboarding completion
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { auth, isLoading, logout } = useAuth();
  const [focusChecked, setFocusChecked] = useState(() => {
    return sessionStorage.getItem('OSIA_focus_checked') === 'true';
  });

  if (isLoading) return null;

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!auth.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!focusChecked) {
    return (
      <FocusGateModal
        onEnter={() => {
          sessionStorage.setItem('OSIA_focus_checked', 'true');
          setFocusChecked(true);
        }}
        onExit={() => {
          logout();
        }}
      />
    );
  }

  return <>{children}</>;
}

// Guard for the onboarding flow itself - prevent re-entry if already complete
function OnboardingGuard({ children }: { children: ReactNode }) {
  const { auth, isLoading } = useAuth();

  if (isLoading) return null;

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (auth.onboardingCompleted) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <OnboardingProvider>
            <TourProvider>
              <Scene />
              <GuidedTour />
              <VoiceAgentButton />
              <FeedbackButton />
              <Routes>
                {/* PUBLIC DEBUG ROUTE - BYPASSING ALL GUARDS */}
                <Route path="/lab/blueyard" element={<BlueYardPage />} />
                <Route path="/lab/osia" element={<OsiaPage />} />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/get-started" element={<AccountTypeSelector />} />
                <Route path="/signup/organization" element={<OrganizationSearchPage />} />
                <Route path="/signup/organization/register" element={<OrganizationSignupFlow />} />
                <Route path="/signup/join-organization" element={<JoinOrganizationFlow />} />
                <Route path="/org/:slug" element={<OrganizationPublicProfile />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/checkout/simulation" element={<CheckoutSimulationPage />} />
                <Route path="/" element={<FoundingCircleLanding />} />

                {/* Onboarding Flow - Gated by OnboardingGuard */}
                <Route element={<OnboardingGuard><AppLayout /></OnboardingGuard>}>
                  <Route path="/welcome" element={<OnboardingFlow />} />
                  <Route path="/onboarding" element={<OnboardingFlow />} />
                  <Route path="/onboarding/q/:questionId" element={<OnboardingFlow />} />
                  <Route path="/insight/first" element={<OnboardingFlow />} />
                </Route>

                {/* Main App - Gated by ProtectedRoute (requires onboarding) */}
                <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                  <Route path="/home" element={<TwinHome />} />
                  <Route path="/vision" element={<OsiaPage />} />
                  <Route path="/voice-test" element={<VoiceTestPage />} />
                  <Route path="/voice-minimal" element={<RealtimeMinimal />} />
                  <Route path="/patterns" element={<PatternsPage />} />
                  <Route path="/thesis" element={<ThesisPage />} />
                  <Route path="/insights" element={<InsightsHubPage />} />
                  <Route path="/connectors" element={<ConnectorsPage />} />
                  <Route path="/protocols" element={<ProtocolsPage />} />
                  <Route path="/refinement" element={<BlueprintRefinementPage />} />
                  <Route path="/layer/:layerId" element={<LayerDetail />} />
                  <Route path="/checkin" element={<CheckInPage />} />
                  <Route path="/history" element={<TimelinePage />} />
                  <Route path="/readiness" element={<ReadinessPage />} />
                  <Route path="/connect" element={<ConnectPage />} />
                  <Route path="/connect/invite" element={<ConnectInvitePage />} />
                  <Route path="/connect/prompts" element={<SharedPromptsPage />} />
                  <Route path="/connect/shared-view" element={<SharedViewPage />} />
                  <Route path="/privacy" element={<PrivacyDashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/subscription" element={<SubscriptionManagement />} />

                  {/* Teams & Collective */}
                  {/* Teams & Collective */}
                  <Route path="/teams" element={<TeamHomePage />} />
                  <Route path="/teams/:teamId" element={<TeamPage />} />
                  <Route path="/teams/:teamId/dynamics" element={<TeamDynamicsPage />} />

                  {/* Organization Admin & Dashboard */}
                  <Route path="/organizations" element={<OrgDashboard />} />
                  <Route path="/organization/:orgId" element={<OrgDashboard />} />
                  <Route path="/organization/:orgId/culture" element={<OrgDashboard />} />
                  <Route path="/my-consent" element={<ConsentManagementScreen />} />

                  <Route path="/teams/:teamId/session" element={<TeamSessionPage />} />
                  <Route path="/teams/:teamId/patterns" element={<TeamPatternsPage />} />
                  <Route path="/team" element={<Navigate to="/teams" replace />} />

                  {/* Journey & History */}
                  <Route path="/journey" element={<JourneyPage />} />
                  <Route path="/history" element={<TimelinePage />} />
                  <Route path="/readiness" element={<ReadinessPage />} />

                  {/* Professional & Enterprise */}
                  <Route path="/pro" element={<ProDashboardPage />} />
                  <Route path="/enterprise" element={<EnterpriseAdminPage />} />
                  <Route path="/developer" element={<DeveloperPortalPage />} />

                  {/* Internal / Lab */}
                  <Route path="/lab/layers" element={<LayerLabPage />} />
                  <Route path="/lab/high-fidelity" element={<HighFidVizPage />} />

                  {/* KYC Verification */}
                  <Route path="/kyc" element={<KYCSubmissionFlow />} />
                  <Route path="/kyc/status" element={<KYCStatusPage />} />
                </Route>

                {/* Fullscreen Lab Routes (No Layout) */}
                {/* BlueYard moved to public for debugging */}

                {/* Admin Panel - Irrespective of onboarding but requires Auth + Admin role */}
                <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
                  <Route path="/admin/*" element={<AdminPage />} />
                </Route>
              </Routes>
            </TourProvider>
          </OnboardingProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
