import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminMonitoring() {
  const [dashboard, setDashboard] = useState(null);
  const [liveMatches, setLiveMatches] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    Promise.all([
      adminApi.getDashboard().catch(() => null),
      api.get('/matches?status=live').catch(() => ({ data: { data: [] } })),
      api.get('/bookings').catch(() => ({ data: { data: [] } })),
      adminApi.getAuditLogs({ limit: 10 }).catch(() => ({ data: { data: [] } }))
    ])
      .then(([dashRes, matchesRes, bookingsRes, logsRes]) => {
        if (dashRes) setDashboard(dashRes.data.data);
        setLiveMatches(matchesRes.data.data || []);
        
        // Filter bookings today
        const todayStr = new Date().toISOString().split('T')[0];
        const todayBookings = (bookingsRes.data.data || []).filter(b => b.date?.startsWith(todayStr));
        setBookings(todayBookings);

        setLogs(logsRes.data.data || []);
      })
      .catch(() => toast.error('Monitoring auto-refresh update failed'))
      .finally(() => setLoading(false));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="section-title gradient-text">Real-Time Telemetry</h1>
          <p className="text-dark-100/60 text-sm mt-1">Telemetry console monitoring system-wide active threads, socket state, live scoreboards, and audit triggers. Auto-refreshing: 30s</p>
        </div>
        <span className="badge badge-success py-1.5 px-3 animate-pulse">Live Telemetry Connected</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Match & Booking Activity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Live matches */}
          <div className="card space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-white">Ongoing Match Scoreboards</h3>
              <span className="badge badge-live">Live</span>
            </div>

            {liveMatches.length === 0 ? (
              <p className="text-sm text-dark-100/40 py-6 text-center">No ongoing live matches right now</p>
            ) : (
              <div className="space-y-3">
                {liveMatches.map(m => (
                  <div key={m._id} className="card-sm bg-dark-900 border border-dark-700/30 flex justify-between items-center p-4">
                    <div>
                      <span className="badge badge-info text-[9px] uppercase tracking-wider mb-1 block w-max">{m.sport}</span>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{m.teamA?.name}</span>
                        <span className="text-primary-400">vs</span>
                        <span>{m.teamB?.name}</span>
                      </div>
                      <div className="text-xs text-dark-100/40 mt-1">{m.groundId?.name || 'TBD Ground'}</div>
                    </div>
                    <div className="text-right space-y-2">
                      <span className="badge badge-live py-1">Score summary active</span>
                      <Link to={`/live/${m._id}`} className="btn-secondary py-1 px-3 text-xs block">
                        Watch Live
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Ground Bookings */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white">Today's Ground Allocations</h3>
            {bookings.length === 0 ? (
              <p className="text-sm text-dark-100/40 py-6 text-center">No ground bookings scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b._id} className="card-sm bg-dark-900 border border-dark-700/30 flex justify-between items-center p-3">
                    <div>
                      <div className="text-xs font-semibold text-white">{b.groundId?.name}</div>
                      <div className="text-[10px] text-dark-100/40 mt-0.5">{b.teamId?.name} — {b.purpose}</div>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-info text-xs font-mono">{b.startTime} - {b.endTime}</span>
                      <span className="badge badge-success ml-2 capitalize">{b.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Active Users & Timeline Activity log */}
        <div className="space-y-6">
          {/* Telemetry counts */}
          <div className="card space-y-4 bg-gradient-to-br from-primary-950/20 to-sport-950/10 border-primary-500/20">
            <h3 className="font-semibold text-white">Active System Threads</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-[10px] text-dark-100/40 font-bold uppercase">Online Accounts</p>
                <p className="text-2xl font-bold text-sport-500 mt-1">{dashboard?.activeUsers || 0}</p>
              </div>
              <div className="bg-dark-900/60 p-3 rounded-xl border border-dark-700/30">
                <p className="text-[10px] text-dark-100/40 font-bold uppercase">Ongoing Matches</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{liveMatches.length}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-white">Live Event Audit Feed</h3>
            {logs.length === 0 ? (
              <p className="text-xs text-dark-100/40 py-6 text-center">No recent logs recorded</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-700/50 max-h-[350px] overflow-y-auto pr-1">
                {logs.map(l => (
                  <div key={l._id} className="flex gap-4 items-start pl-2 relative">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5 z-10 border-2 border-dark-800 flex-shrink-0" />
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-dark-100/40">{new Date(l.createdAt).toLocaleTimeString()}</div>
                      <div className="text-xs font-semibold text-white capitalize">{l.action?.replace(/_/g, ' ')}</div>
                      <div className="text-[10px] text-dark-100/60">by {l.performedBy?.name || 'System'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
