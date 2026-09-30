import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../app/store';
import { associationApi } from '../../api/associationApi';
import {
  UsersIcon, TrophyIcon, UserGroupIcon, MapPinIcon, PlayIcon,
  ClockIcon, CheckCircleIcon, CurrencyDollarIcon, CalendarDaysIcon,
  ShieldCheckIcon, UserIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/validators';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="card hover:border-dark-600/50 transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-dark-100/60 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value ?? '-'}</p>
        {subtitle && <p className="text-xs text-dark-100/40 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

export default function AssociationDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.associationId) {
      associationApi.getDashboard(user.associationId)
        .then(res => setStats(res.data.data))
        .catch(() => toast.error('Failed to load dashboard statistics'))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Association Control Panel</h1>
          <p className="text-dark-100/60 text-sm mt-1">Management console and telemetry overview for your association</p>
        </div>
      </div>

      {/* Financial Health */}
      <h2 className="text-lg font-bold text-white mb-2">Association Financial Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={CurrencyDollarIcon} color="bg-sport-600" />
        <StatCard title="Total Expenses" value={formatCurrency(stats?.totalExpenses || 0)} icon={CurrencyDollarIcon} color="bg-red-600" />
        <StatCard title="Available Balance" value={formatCurrency(stats?.fundBalance || 0)} icon={ArrowTrendingUpIcon} color="bg-primary-600" />
      </div>

      {/* Telemetry Objects */}
      <h2 className="text-lg font-bold text-white mb-2">Association Objects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Teams" value={stats?.totalTeams} icon={UserGroupIcon} color="bg-primary-600" subtitle={`Pending approvals: ${stats?.pendingTeamApprovals}`} />
        <StatCard title="Active Teams" value={stats?.activeTeams} icon={UserGroupIcon} color="bg-sport-600" />
        <StatCard title="Grounds Used" value={stats?.totalGroundsUsed} icon={MapPinIcon} color="bg-orange-600" />
        <StatCard title="Total Bookings" value={stats?.totalGroundBookings} icon={CalendarDaysIcon} color="bg-teal-600" />
        <StatCard title="Live Matches" value={stats?.liveMatches} icon={PlayIcon} color="bg-red-600" />
      </div>

      {/* Tournament overview */}
      <h2 className="text-lg font-bold text-white mb-2">Tournament Monitoring</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Tournaments" value={stats?.totalTournaments} icon={TrophyIcon} color="bg-purple-600" />
        <StatCard title="Upcoming Tournaments" value={stats?.upcomingTournaments} icon={ClockIcon} color="bg-blue-600" />
        <StatCard title="Ongoing Tournaments" value={stats?.ongoingTournaments} icon={PlayIcon} color="bg-red-600" />
        <StatCard title="Completed Tournaments" value={stats?.completedTournaments} icon={CheckCircleIcon} color="bg-sport-600" />
      </div>

      {/* Officers breakdown */}
      <h2 className="text-lg font-bold text-white mb-2">Officer Scopes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Tournament Organizers" value={stats?.totalOrganizers} icon={TrophyIcon} color="bg-pink-600" />
        <StatCard title="Booking Officers" value={stats?.totalGroundOfficers} icon={MapPinIcon} color="bg-teal-600" />
        <StatCard title="Funds Officers" value={stats?.totalFundsOfficers} icon={CurrencyDollarIcon} color="bg-yellow-600" />
      </div>

      {/* Users & Team Captains */}
      <h2 className="text-lg font-bold text-white mb-2">Users Breakdown</h2>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Total Players" value={stats?.totalPlayers} icon={UsersIcon} color="bg-primary-600" subtitle={`Active: ${stats?.activePlayers}`} />
        <StatCard title="Captains" value={stats?.totalCaptains} icon={UserIcon} color="bg-yellow-600" />
        <StatCard title="Vice Captains" value={stats?.totalViceCaptains} icon={UserIcon} color="bg-purple-600" />
        <StatCard title="Friendly Matches" value={stats?.friendlyMatches} icon={UserGroupIcon} color="bg-indigo-600" />
      </div>
    </div>
  );
}
