import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { getDashboardRoute } from '../utils/permissions';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import AssociationLayout from '../layouts/AssociationLayout';
import TeamLayout from '../layouts/TeamLayout';
import PlayerLayout from '../layouts/PlayerLayout';
import BookingOfficerLayout from '../layouts/BookingOfficerLayout';
import FundsOfficerLayout from '../layouts/FundsOfficerLayout';
import TournamentOrganizerLayout from '../layouts/TournamentOrganizerLayout';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import RegisterPage from '../pages/auth/RegisterPage';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageAssociations from '../pages/admin/ManageAssociations';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageSports from '../pages/admin/ManageSports';
import ManageGrounds from '../pages/admin/ManageGrounds';
import ManageAnnouncements from '../pages/admin/ManageAnnouncements';
import SendNotifications from '../pages/admin/SendNotifications';
import AdminReports from '../pages/admin/AdminReports';
import AuditLog from '../pages/admin/AuditLog';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import AdminMonitoring from '../pages/admin/AdminMonitoring';
import SystemSettings from '../pages/admin/SystemSettings';
import FeedbackManagement from '../pages/admin/FeedbackManagement';
import SecurityPanel from '../pages/admin/SecurityPanel';

// Association Head pages
import AssociationDashboard from '../pages/association/AssociationDashboard';
import AssociationProfile from '../pages/association/AssociationProfile';
import TeamApprovalQueue from '../pages/association/TeamApprovalQueue';
import ManageOrganizers from '../pages/association/ManageOrganizers';
import AssociationAnnouncements from '../pages/association/Announcements';
import AssociationReports from '../pages/association/AssociationReports';
import ExpenseApprovalQueue from '../pages/association/ExpenseApprovalQueue';

// Tournament Organizer pages
import TournamentDashboard from '../pages/tournament/TournamentDashboard';
import CreateTournament from '../pages/tournament/CreateTournament';
import TournamentDetails from '../pages/tournament/TournamentDetails';
import FixtureManager from '../pages/tournament/FixtureManager';
import ResultEntry from '../pages/tournament/ResultEntry';
import TournamentStandings from '../pages/tournament/TournamentStandings';

// Team pages
import TeamDashboard from '../pages/team/TeamDashboard';
import TeamProfile from '../pages/team/TeamProfile';
import TournamentRegistration from '../pages/team/TournamentRegistration';
import FriendlyMatches from '../pages/team/FriendlyMatches';
import BookingRequest from '../pages/team/BookingRequest';
import PlayerManagement from '../pages/team/PlayerManagement';
import MatchManagement from '../pages/team/MatchManagement';
import TeamCalendar from '../pages/team/TeamCalendar';
import TeamReports from '../pages/team/TeamReports';

// Booking Officer pages
import BookingDashboard from '../pages/booking/BookingDashboard';
import BookingCalendar from '../pages/booking/BookingCalendar';
import BookingReports from '../pages/booking/BookingReports';

// Funds Officer pages
import FundsDashboard from '../pages/funds/FundsDashboard';
import CollectIncome from '../pages/funds/CollectIncome';
import ExpenseRequests from '../pages/funds/ExpenseRequests';
import TransactionLedger from '../pages/funds/TransactionLedger';
import FinancialReports from '../pages/funds/FinancialReports';

// Player pages
import PlayerDashboard from '../pages/player/PlayerDashboard';
import PlayerTeamInfo from '../pages/player/PlayerTeamInfo';
import PlayerLiveMatches from '../pages/player/PlayerLiveMatches';
import MyStats from '../pages/player/MyStats';

// Shared pages
import LiveScoreConsole from '../pages/shared/LiveScoreConsole';
import LiveScoreView from '../pages/shared/LiveScoreView';
import MatchSummary from '../pages/shared/MatchSummary';
import ChatPage from '../pages/shared/ChatPage';
import NotificationsPage from '../pages/shared/NotificationsPage';
import ProfilePage from '../pages/shared/ProfilePage';
import GroundsPage from '../pages/shared/GroundsPage';
import TournamentListPage from '../pages/shared/TournamentListPage';
import LiveMatchSetup from '../pages/shared/LiveMatchSetup';
import SearchPage from '../pages/shared/SearchPage';
import UnifiedCalendar from '../pages/shared/UnifiedCalendar';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getDashboardRoute(user?.role)} replace />;
  }
  return children;
};

const AppRouter = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to={getDashboardRoute(user?.role)} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to={getDashboardRoute(user?.role)} />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="monitoring" element={<AdminMonitoring />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="associations" element={<ManageAssociations />} />
        <Route path="sports" element={<ManageSports />} />
        <Route path="grounds" element={<ManageGrounds />} />
        <Route path="announcements" element={<ManageAnnouncements />} />
        <Route path="notifications" element={<SendNotifications />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="security" element={<SecurityPanel />} />
        <Route path="feedback" element={<FeedbackManagement />} />
      </Route>

      {/* Association Head routes */}
      <Route path="/association" element={<ProtectedRoute allowedRoles={['association_head']}><AssociationLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<AssociationDashboard />} />
        <Route path="profile" element={<AssociationProfile />} />
        <Route path="team-approvals" element={<TeamApprovalQueue />} />
        <Route path="organizers" element={<ManageOrganizers />} />
        <Route path="announcements" element={<AssociationAnnouncements />} />
        <Route path="expense-approvals" element={<ExpenseApprovalQueue />} />
        <Route path="reports" element={<AssociationReports />} />
      </Route>

      {/* Tournament Organizer routes */}
      <Route path="/tournament" element={<ProtectedRoute allowedRoles={['tournament_organizer', 'admin']}><TournamentOrganizerLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<TournamentDashboard />} />
        <Route path="create" element={<CreateTournament />} />
        <Route path=":id" element={<TournamentDetails />} />
        <Route path=":id/fixtures" element={<FixtureManager />} />
        <Route path=":id/results" element={<ResultEntry />} />
        <Route path=":id/standings" element={<TournamentStandings />} />
      </Route>

      {/* Team Captain routes */}
      <Route path="/team" element={<ProtectedRoute allowedRoles={['captain', 'vice_captain']}><TeamLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<TeamDashboard />} />
        <Route path="profile" element={<TeamProfile />} />
        <Route path="players" element={<PlayerManagement />} />
        <Route path="matches" element={<MatchManagement />} />
        <Route path="register-tournament" element={<TournamentRegistration />} />
        <Route path="friendly-matches" element={<FriendlyMatches />} />
        <Route path="book-ground" element={<BookingRequest />} />
        <Route path="calendar" element={<TeamCalendar />} />
        <Route path="reports" element={<TeamReports />} />
      </Route>

      {/* Booking Officer routes */}
      <Route path="/bookings" element={<ProtectedRoute allowedRoles={['ground_officer', 'admin']}><BookingOfficerLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<BookingDashboard />} />
        <Route path="calendar" element={<BookingCalendar />} />
        <Route path="reports" element={<BookingReports />} />
      </Route>

      {/* Funds Officer routes */}
      <Route path="/funds" element={<ProtectedRoute allowedRoles={['funds_officer', 'admin', 'association_head']}><FundsOfficerLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<FundsDashboard />} />
        <Route path="collect" element={<CollectIncome />} />
        <Route path="expenses" element={<ExpenseRequests />} />
        <Route path="ledger" element={<TransactionLedger />} />
        <Route path="reports" element={<FinancialReports />} />
      </Route>

      {/* Player routes */}
      <Route path="/player" element={<ProtectedRoute allowedRoles={['player']}><PlayerLayout /></ProtectedRoute>}>
        <Route path="dashboard" element={<PlayerDashboard />} />
        <Route path="my-team" element={<PlayerTeamInfo />} />
        <Route path="stats" element={<MyStats />} />
        <Route path="live" element={<PlayerLiveMatches />} />
      </Route>

      {/* Shared routes (all authenticated) */}
      <Route path="/live/:id" element={<ProtectedRoute><LiveScoreView /></ProtectedRoute>} />
      <Route path="/score/:id" element={<ProtectedRoute allowedRoles={['captain', 'vice_captain', 'player', 'tournament_organizer', 'admin']}><LiveScoreConsole /></ProtectedRoute>} />
      <Route path="/match/setup" element={<ProtectedRoute allowedRoles={['captain', 'vice_captain', 'tournament_organizer', 'admin']}><LiveMatchSetup /></ProtectedRoute>} />
      <Route path="/match/:id/summary" element={<ProtectedRoute><MatchSummary /></ProtectedRoute>} />
      <Route path="/chat/:groupId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/grounds" element={<ProtectedRoute><GroundsPage /></ProtectedRoute>} />
      <Route path="/tournaments" element={<ProtectedRoute><TournamentListPage /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><UnifiedCalendar /></ProtectedRoute>} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to={isAuthenticated ? getDashboardRoute(user?.role) : '/login'} />} />
      <Route path="/dashboard" element={<Navigate to={isAuthenticated ? getDashboardRoute(user?.role) : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;
