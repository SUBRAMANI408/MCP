import React, { useState, useEffect } from 'react';
import { captainApi } from '../../api/captainApi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon,
  TrophyIcon, UserGroupIcon, MapPinIcon, ClockIcon
} from '@heroicons/react/24/outline';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TeamCalendar() {
  const [team, setTeam] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    captainApi.getMyTeam()
      .then(async teamRes => {
        const t = teamRes.data.data;
        setTeam(t);
        // Load matches and friendly matches
        const [matchRes, friendlyRes, bookingRes] = await Promise.all([
          api.get('/matches', { params: { teamId: t._id, limit: 100 } }).catch(() => ({ data: { data: [] } })),
          captainApi.getFriendlyMatches({ limit: 100 }).catch(() => ({ data: { data: [] } })),
          captainApi.getBookings({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        ]);

        const matchEvents = (matchRes.data.data || []).map(m => ({
          id: m._id,
          date: m.scheduledAt ? new Date(m.scheduledAt) : null,
          title: `${m.teamA?.name || 'Team'} vs ${m.teamB?.name || 'TBD'}`,
          type: 'match',
          status: m.status,
          detail: m.groundId?.name || '',
        })).filter(e => e.date);

        const friendlyEvents = (friendlyRes.data.data || []).map(f => ({
          id: f._id,
          date: f.date ? new Date(f.date) : null,
          title: `Friendly: ${f.requestingTeamId?.name || 'Team'} vs ${f.respondingTeamId?.name || 'TBD'}`,
          type: 'friendly',
          status: f.status,
          detail: f.venue || '',
        })).filter(e => e.date);

        const bookingEvents = (bookingRes.data.data || []).map(b => ({
          id: b._id,
          date: b.date ? new Date(b.date) : null,
          title: `Ground: ${b.groundId?.name || 'Booking'}`,
          type: 'booking',
          status: b.status,
          detail: `${b.startTime} - ${b.endTime}`,
        })).filter(e => e.date);

        setEvents([...matchEvents, ...friendlyEvents, ...bookingEvents]);
      })
      .catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getEventsForDay = (day) => {
    return events.filter(e => {
      const d = e.date;
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const eventTypeColors = {
    match: 'bg-primary-500',
    friendly: 'bg-sport-500',
    booking: 'bg-yellow-500',
    tournament: 'bg-purple-500',
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
          <h1 className="section-title gradient-text">Team Calendar</h1>
          <p className="text-dark-100/60 text-sm mt-1">View all matches, friendly games, and ground bookings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="btn-ghost p-2">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-white">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="btn-ghost p-2">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-dark-100/40 font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              const isSelected = selectedDay === day;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`h-12 rounded-xl flex flex-col items-center justify-start pt-1.5 transition-all relative text-sm font-medium ${
                    isSelected ? 'bg-primary-600 text-white' :
                    isToday ? 'bg-dark-700 text-primary-400 border border-primary-500/50' :
                    'hover:bg-dark-700/50 text-dark-100/70'
                  }`}
                >
                  {day}
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((e, idx) => (
                        <span key={idx} className={`w-1.5 h-1.5 rounded-full ${eventTypeColors[e.type] || 'bg-gray-500'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-dark-700/50">
            {Object.entries(eventTypeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                <span className="text-xs text-dark-100/50 capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Event Details */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">
            {selectedDay
              ? `Events on ${MONTHS[month]} ${selectedDay}`
              : 'Upcoming Events'}
          </h3>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {(selectedDay ? selectedDayEvents : events.filter(e => e.date >= new Date()).sort((a,b) => a.date - b.date).slice(0, 10)).map(event => (
              <div key={event.id} className="p-3 rounded-xl bg-dark-900 border border-dark-700/30 space-y-1">
                <div className="flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${eventTypeColors[event.type] || 'bg-gray-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{event.title}</p>
                    {event.detail && (
                      <div className="flex items-center gap-1 text-xs text-dark-100/40 mt-0.5">
                        <MapPinIcon className="w-3 h-3" />
                        {event.detail}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge capitalize text-[9px] ${
                        event.status === 'live' ? 'badge-danger' :
                        event.status === 'completed' ? 'badge-success' :
                        event.status === 'approved' ? 'badge-success' : 'badge-pending'
                      }`}>{event.status}</span>
                      <span className={`badge capitalize text-[9px] ${eventTypeColors[event.type]?.replace('bg-', 'text-') || ''} bg-dark-700`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(selectedDay ? selectedDayEvents : events.filter(e => e.date >= new Date())).length === 0 && (
              <p className="text-dark-100/40 text-sm text-center py-8">
                {selectedDay ? 'No events on this day' : 'No upcoming events'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
