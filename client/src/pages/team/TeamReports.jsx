import React, { useState, useEffect } from 'react';
import { captainApi } from '../../api/captainApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  TrophyIcon, UserGroupIcon, ChartBarIcon,
  DocumentArrowDownIcon, ArrowTrendingUpIcon, FireIcon
} from '@heroicons/react/24/outline';

export default function TeamReports() {
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [friendlies, setFriendlies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const teamRes = await captainApi.getMyTeam();
      const t = teamRes.data.data;
      setTeam(t);

      const [matchRes, friendlyRes, bookingRes] = await Promise.all([
        api.get('/matches', { params: { teamId: t._id, limit: 200 } }).catch(() => ({ data: { data: [] } })),
        captainApi.getFriendlyMatches({ limit: 200 }).catch(() => ({ data: { data: [] } })),
        captainApi.getBookings({ limit: 200 }).catch(() => ({ data: { data: [] } })),
      ]);

      setMatches(matchRes.data.data || []);
      setFriendlies(friendlyRes.data.data || []);
      setBookings(bookingRes.data.data || []);
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  if (!team) return <div className="card text-center py-12 text-dark-100/50">No team found.</div>;

  const completed = matches.filter(m => m.status === 'completed');
  const wins = team.wins || 0;
  const losses = team.losses || 0;
  const draws = team.draws || 0;
  const played = team.matchesPlayed || completed.length;
  const winRate = played > 0 ? ((wins / played) * 100).toFixed(1) : 0;

  const tournamentMatches = matches.filter(m => m.type === 'tournament');
  const friendlyMatches = matches.filter(m => m.type === 'friendly');

  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const pendingBookings = bookings.filter(b => b.status === 'pending');

  const tabs = [
    { key: 'performance', label: 'Performance' },
    { key: 'matches', label: 'Match History' },
    { key: 'grounds', label: 'Ground Bookings' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Team Reports</h1>
          <p className="text-dark-100/60 text-sm mt-1">Comprehensive analytics and reports for your team</p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary gap-2 text-sm"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-primary-600 text-white' : 'text-dark-100/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Matches Played', value: played, color: 'bg-primary-600', icon: TrophyIcon },
              { label: 'Wins', value: wins, color: 'bg-green-600', icon: ArrowTrendingUpIcon },
              { label: 'Losses', value: losses, color: 'bg-red-600', icon: FireIcon },
              { label: 'Win Rate', value: `${winRate}%`, color: 'bg-sport-600', icon: ChartBarIcon },
            ].map(stat => (
              <div key={stat.label} className="card flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-dark-100/50">{stat.label}</p>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Win/Loss/Draw breakdown */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Match Results Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: 'Wins', value: wins, total: played, color: 'bg-green-500' },
                { label: 'Losses', value: losses, total: played, color: 'bg-red-500' },
                { label: 'Draws', value: draws, total: played, color: 'bg-yellow-500' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-100/70">{item.label}</span>
                    <span className="text-white font-medium">{item.value} / {item.total}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tournament vs Friendly */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 text-primary-400" />
                Tournament Matches
              </h3>
              <div className="text-3xl font-bold text-white">{tournamentMatches.length}</div>
              <p className="text-xs text-dark-100/40 mt-1">
                {tournamentMatches.filter(m => m.status === 'completed').length} completed
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <UserGroupIcon className="w-4 h-4 text-sport-400" />
                Friendly Matches
              </h3>
              <div className="text-3xl font-bold text-white">{team.friendlyMatchesPlayed || friendlyMatches.length}</div>
              <p className="text-xs text-dark-100/40 mt-1">
                {friendlies.filter(f => f.status === 'pending').length} pending requests
              </p>
            </div>
          </div>

          {/* Player Stats Table */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Roster Summary</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {team.players?.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center text-xs text-white font-bold">
                            {p.name?.[0]}
                          </div>
                          <span className="text-white font-medium text-sm">{p.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge capitalize text-xs ${
                          p._id === team.captainId?._id ? 'badge-info' :
                          p._id === team.viceCaptainId?._id ? 'badge-pending' : 'badge-success'
                        }`}>
                          {p._id === team.captainId?._id ? 'Captain' :
                           p._id === team.viceCaptainId?._id ? 'Vice Captain' : 'Player'}
                        </span>
                      </td>
                      <td className="text-dark-100/60 text-sm">{p.email}</td>
                      <td><span className="badge badge-success text-xs">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Match History</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Match</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {matches.slice(0, 50).map(m => (
                  <tr key={m._id}>
                    <td>
                      <span className="text-white text-sm">
                        {m.teamA?.name || 'TBD'} vs {m.teamB?.name || 'TBD'}
                      </span>
                    </td>
                    <td><span className={`badge text-xs ${m.type === 'tournament' ? 'badge-info' : 'badge-pending'}`}>{m.type}</span></td>
                    <td className="text-dark-100/60 text-sm">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="font-mono text-white text-sm">
                      {m.status !== 'scheduled' ? `${m.scoreSummary?.teamA ?? 0} - ${m.scoreSummary?.teamB ?? 0}` : 'TBD'}
                    </td>
                    <td>
                      <span className={`badge capitalize text-xs ${
                        m.status === 'live' ? 'badge-danger' :
                        m.status === 'completed' ? 'badge-success' : 'badge-pending'
                      }`}>{m.status}</span>
                    </td>
                  </tr>
                ))}
                {matches.length === 0 && (
                  <tr><td colSpan={5} className="text-center text-dark-100/40 py-8">No match history found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'grounds' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Bookings', value: bookings.length, color: 'bg-primary-600' },
              { label: 'Approved', value: approvedBookings.length, color: 'bg-green-600' },
              { label: 'Pending', value: pendingBookings.length, color: 'bg-yellow-600' },
            ].map(s => (
              <div key={s.label} className="card">
                <p className="text-dark-100/50 text-xs">{s.label}</p>
                <p className="text-3xl font-bold text-white mt-1">{s.value}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Booking History</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ground</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b._id}>
                      <td className="text-white font-medium">{b.groundId?.name || '-'}</td>
                      <td className="text-dark-100/60 text-sm">{b.date ? new Date(b.date).toLocaleDateString() : '-'}</td>
                      <td className="text-dark-100/60 text-sm">{b.startTime} - {b.endTime}</td>
                      <td className="text-dark-100/60 text-sm capitalize">{b.purpose || '-'}</td>
                      <td>
                        <span className={`badge capitalize text-xs ${
                          b.status === 'approved' ? 'badge-success' :
                          b.status === 'rejected' ? 'badge-danger' : 'badge-pending'
                        }`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-dark-100/40 py-8">No bookings found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
