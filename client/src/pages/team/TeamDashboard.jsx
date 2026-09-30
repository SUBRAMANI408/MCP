import React, { useEffect, useState } from 'react';
import { captainApi } from '../../api/captainApi';
import {
  UsersIcon, TrophyIcon, UserGroupIcon, CalendarDaysIcon,
  PlayIcon, ClockIcon, CheckCircleIcon, ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
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

export default function TeamDashboard() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [friendlies, setFriendlies] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const teamRes = await captainApi.getMyTeam().catch(err => {
        if (err.response?.status !== 404) {
          toast.error('Failed to load team data');
        }
        return null;
      });
      const bookingsRes = await captainApi.getBookings().catch(() => ({ data: { data: [] } }));
      const friendliesRes = await captainApi.getFriendlyMatches({ status: 'pending' }).catch(() => ({ data: { data: [] } }));

      if (teamRes) setTeam(teamRes.data.data);
      setBookings(bookingsRes.data.data || []);
      setFriendlies(friendliesRes.data.data || []);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!team) return (
    <div className="card text-center py-12">
      <h3 className="text-lg font-bold text-white mb-2">No Team Registered</h3>
      <p className="text-sm text-dark-100/60 mb-4">You are not currently registered or assigned as captain of any team.</p>
    </div>
  );

  const winRate = team.matchesPlayed > 0 ? ((team.wins || 0) / team.matchesPlayed * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">{team.name} Dashboard</h1>
          <p className="text-dark-100/60 text-sm mt-1">Lead captain panel, team roster, statistics, and bookings</p>
        </div>
      </div>

      {/* Roster & Vice Captain Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Team Captain" value={team.captainId?.name} icon={UserGroupIcon} color="bg-primary-600" subtitle={team.captainId?.email} />
        <StatCard title="Vice Captain" value={team.viceCaptainId?.name || 'Not assigned'} icon={UserGroupIcon} color="bg-purple-600" />
        <StatCard title="Roster size" value={team.players?.length} icon={UsersIcon} color="bg-blue-600" subtitle="Total players" />
        <StatCard title="Win Percentage" value={`${winRate}%`} icon={ArrowTrendingUpIcon} color="bg-sport-600" subtitle={`${team.wins || 0} Wins / ${team.losses || 0} Losses`} />
      </div>

      {/* Telemetry performance */}
      <h2 className="text-lg font-bold text-white mb-2">Team Statistics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Matches Played" value={team.matchesPlayed || 0} icon={PlayIcon} color="bg-indigo-600" />
        <StatCard title="Tournament Matches" value={team.tournamentMatchesPlayed || 0} icon={TrophyIcon} color="bg-pink-600" />
        <StatCard title="Friendly Matches" value={team.friendlyMatchesPlayed || 0} icon={UserGroupIcon} color="bg-teal-600" />
        <StatCard title="Draws count" value={team.draws || 0} icon={ClockIcon} color="bg-yellow-600" />
        <StatCard title="Pending Friendlies" value={friendlies.length} icon={ClockIcon} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ground Booking details */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Your Ground Bookings ({bookings.length})</h3>
          {bookings.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-6 text-center">No ground bookings scheduled</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {bookings.map(b => (
                <div key={b._id} className="card-sm bg-dark-900 border border-dark-700/30 flex justify-between items-center p-3">
                  <div>
                    <div className="text-xs font-semibold text-white">{b.groundId?.name}</div>
                    <div className="text-[10px] text-dark-100/40 mt-0.5">{new Date(b.date).toDateString()} — {b.purpose}</div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-info text-xs font-mono">{b.startTime} - {b.endTime}</span>
                    <span className={`badge ${
                      b.status === 'approved' ? 'badge-success' :
                      b.status === 'pending' ? 'badge-pending' : 'badge-danger'
                    } ml-2 capitalize`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Friendly Requests */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Incoming Friendly Challenges</h3>
          {friendlies.length === 0 ? (
            <p className="text-xs text-dark-100/40 py-6 text-center">No pending friendly challenges</p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {friendlies.map(f => {
                const otherTeam = f.requestingTeamId?._id === team._id ? f.respondingTeamId : f.requestingTeamId;
                const isIncoming = f.respondingTeamId?._id === team._id;
                
                return (
                  <div key={f._id} className="card-sm bg-dark-900 border border-dark-700/30 flex justify-between items-center p-3">
                    <div>
                      <div className="text-xs font-semibold text-white">{otherTeam?.name}</div>
                      <div className="text-[10px] text-dark-100/40 mt-0.5">{new Date(f.date).toDateString()} — {f.time}</div>
                      {f.message && <div className="text-[9px] text-dark-100/30 mt-0.5">"{f.message}"</div>}
                    </div>
                    <div>
                      <span className={`badge ${isIncoming ? 'badge-info' : 'badge-pending'} text-xs capitalize`}>
                        {isIncoming ? 'Incoming' : 'Sent'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
