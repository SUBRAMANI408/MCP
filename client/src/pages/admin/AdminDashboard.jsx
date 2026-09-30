import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/adminApi';
import {
  UsersIcon, BuildingOffice2Icon, UserGroupIcon, TrophyIcon,
  MapPinIcon, CubeIcon, CalendarDaysIcon, CurrencyDollarIcon,
  ClockIcon, CheckCircleIcon, PlayIcon, ShieldCheckIcon, UserIcon
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

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(res => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  // Helper to extract role counts
  const getRoleCount = (roleName) => {
    const roleObj = stats?.usersByRole?.find(r => r._id === roleName);
    return roleObj ? roleObj.count : 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Admin Dashboard</h1>
          <p className="text-dark-100/60 text-sm mt-1">Platform overview & real-time telemetry</p>
        </div>
      </div>

      {/* Financial Overview */}
      <h2 className="text-lg font-bold text-white mb-2">Financial telemetry</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Revenue Collected" value={formatCurrency(stats?.totalRevenue || 0)} icon={CurrencyDollarIcon} color="bg-sport-600" />
        <StatCard title="Total Expenses Approved" value={formatCurrency(stats?.totalExpenses || 0)} icon={CurrencyDollarIcon} color="bg-red-600" />
        <StatCard title="Net Operating Balance" value={formatCurrency((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0))} icon={CurrencyDollarIcon} color="bg-primary-600" />
      </div>

      {/* Platform Objects */}
      <h2 className="text-lg font-bold text-white mb-2">Platform Objects</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard title="Associations" value={stats?.totalAssociations} icon={BuildingOffice2Icon} color="bg-primary-600" />
        <StatCard title="Teams" value={stats?.totalTeams} icon={UserGroupIcon} color="bg-purple-600" />
        <StatCard title="Grounds" value={stats?.totalGrounds} icon={MapPinIcon} color="bg-orange-600" />
        <StatCard title="Active Sports" value={stats?.totalSports} icon={CubeIcon} color="bg-yellow-600" />
        <StatCard title="Tournaments" value={stats?.totalTournaments} icon={TrophyIcon} color="bg-pink-600" />
        <StatCard title="Bookings" value={stats?.totalBookings} icon={CalendarDaysIcon} color="bg-teal-600" />
      </div>

      {/* Matches Overview */}
      <h2 className="text-lg font-bold text-white mb-2">Matches Telemetry</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Ongoing Matches (Live)" value={stats?.ongoingMatches} icon={PlayIcon} color="bg-red-600" subtitle="Active scoreboard" />
        <StatCard title="Upcoming Matches" value={stats?.upcomingMatches} icon={ClockIcon} color="bg-blue-600" subtitle="Scheduled" />
        <StatCard title="Completed Matches" value={stats?.completedMatches} icon={CheckCircleIcon} color="bg-sport-600" subtitle="History logs" />
        <StatCard title="Friendly Matches" value={stats?.totalFriendlyMatches} icon={UserGroupIcon} color="bg-indigo-600" subtitle="Direct challenges" />
      </div>

      {/* Users & Roles Overview */}
      <h2 className="text-lg font-bold text-white mb-2">Users by Role</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={UsersIcon} color="bg-primary-600" subtitle={`Active accounts: ${stats?.activeUsers}`} />
        <StatCard title="Association Heads" value={getRoleCount('association_head')} icon={ShieldCheckIcon} color="bg-blue-600" />
        <StatCard title="Tournament Organizers" value={getRoleCount('tournament_organizer')} icon={TrophyIcon} color="bg-pink-600" />
        <StatCard title="Booking Officers" value={getRoleCount('ground_officer')} icon={MapPinIcon} color="bg-orange-600" />
        <StatCard title="Funds Officers" value={getRoleCount('funds_officer')} icon={CurrencyDollarIcon} color="bg-teal-600" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Team Captains" value={getRoleCount('captain')} icon={UserIcon} color="bg-yellow-600" />
        <StatCard title="Team Vice Captains" value={getRoleCount('vice_captain')} icon={UserIcon} color="bg-purple-600" />
        <StatCard title="Players" value={getRoleCount('player')} icon={UserIcon} color="bg-indigo-600" />
      </div>

      {/* Visual Charts / Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Users Breakdown</h3>
          <div className="space-y-3">
            {(stats?.usersByRole || []).map(({ _id, count }) => (
              <div key={_id} className="flex items-center justify-between">
                <span className="text-dark-100/70 text-sm capitalize">{_id?.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 bg-dark-700 rounded-full w-32 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-sport-500 rounded-full"
                      style={{ width: `${Math.min(100, (count / (stats?.totalUsers || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-white font-medium text-sm w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white mb-4">Net Balance Summary</h3>
            <p className="text-dark-100/50 text-sm">Operation capacity</p>
          </div>
          <div className="text-center py-8">
            <p className="text-5xl font-bold gradient-text">{formatCurrency((stats?.totalRevenue || 0) - (stats?.totalExpenses || 0))}</p>
            <p className="text-xs text-dark-100/40 mt-2">Active operating budget</p>
          </div>
          <div className="grid grid-cols-2 border-t border-dark-700/50 pt-4 text-center">
            <div>
              <p className="text-xs text-dark-100/50">Total Revenue</p>
              <p className="text-lg font-bold text-sport-500">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
            <div className="border-l border-dark-700/50">
              <p className="text-xs text-dark-100/50">Total Expenses</p>
              <p className="text-lg font-bold text-red-500">{formatCurrency(stats?.totalExpenses || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
