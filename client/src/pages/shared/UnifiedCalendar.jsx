import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_COLORS = {
  booking: 'bg-blue-500',
  friendly: 'bg-green-500',
  tournament: 'bg-yellow-500',
  practice: 'bg-purple-500',
};

const EVENT_LABELS = {
  booking: '📍',
  friendly: '🤝',
  tournament: '🏆',
  practice: '🏋️',
};

export default function UnifiedCalendar() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [year, month]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const requests = [];

      // Ground bookings
      if (['captain', 'vice_captain', 'ground_officer', 'association_head', 'admin'].includes(user?.role)) {
        requests.push(
          api.get('/bookings', { params: { month: month + 1, year, limit: 100 } })
            .then(r => (r.data.data || []).map(b => ({
              id: b._id, type: 'booking',
              title: `${b.teamId?.name || 'Booking'} @ ${b.groundId?.name || ''}`,
              date: b.date,
              time: `${b.startTime} – ${b.endTime}`,
              status: b.status,
            })))
        );
      }

      // Friendly matches
      if (['captain', 'vice_captain'].includes(user?.role)) {
        requests.push(
          api.get('/friendly-matches', { params: { limit: 100 } })
            .then(r => (r.data.data || []).filter(m => m.status === 'accepted').map(m => ({
              id: m._id, type: 'friendly',
              title: `${m.requestingTeamId?.name} vs ${m.respondingTeamId?.name}`,
              date: m.date,
              time: m.time,
              status: m.status,
            })))
        );
      }

      // Tournament fixtures
      if (user?.teamId) {
        requests.push(
          api.get('/fixtures', { params: { limit: 100 } })
            .then(r => (r.data.data || []).map(f => ({
              id: f._id, type: 'tournament',
              title: `${f.teamA?.name || 'TBD'} vs ${f.teamB?.name || 'TBD'}`,
              date: f.scheduledDate,
              time: f.scheduledTime,
              status: f.status,
            })))
        );
      }

      const allEventArrays = await Promise.allSettled(requests);
      const merged = allEventArrays
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);
      setEvents(merged);
    } catch {} finally { setLoading(false); }
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => {
      if (!e.date) return false;
      const evDate = new Date(e.date).toISOString().slice(0, 10);
      return evDate === dateStr;
    });
  };

  const selectedEvents = selected ? getEventsForDay(selected) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary p-2.5 rounded-xl animate-fade-in" title="Go Back">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="section-title gradient-text flex items-center gap-2">
              <CalendarDaysIcon className="w-6 h-6" /> Calendar
            </h1>
            <p className="text-dark-100/50 text-sm mt-0.5">All bookings, matches & events</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-dark-100/60">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </div>
        ))}
      </div>

      {/* Month navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="btn-ghost p-2"><ChevronLeftIcon className="w-5 h-5" /></button>
          <h2 className="font-bold text-white text-lg">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="btn-ghost p-2"><ChevronRightIcon className="w-5 h-5" /></button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-dark-100/40 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
            const isSelected = day && selected === day;

            return (
              <div
                key={i}
                onClick={() => day && setSelected(isSelected ? null : day)}
                className={`relative min-h-[60px] rounded-xl p-1.5 cursor-pointer transition-all ${
                  !day ? '' :
                  isSelected ? 'bg-primary-600/20 border border-primary-500/50' :
                  isToday ? 'bg-primary-500/10 border border-primary-500/30' :
                  'hover:bg-dark-700/50'
                }`}
              >
                {day && (
                  <>
                    <span className={`text-xs font-medium block text-center mb-1 ${
                      isToday ? 'text-primary-400 font-bold' :
                      isSelected ? 'text-white' :
                      'text-dark-100/70'
                    }`}>{day}</span>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((ev, j) => (
                        <div key={j} className={`w-full h-1.5 rounded-full ${EVENT_COLORS[ev.type] || 'bg-dark-500'}`} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-dark-100/40 text-center">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selected && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <CalendarDaysIcon className="w-4 h-4" />
            {MONTHS[month]} {selected}, {year}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-dark-100/40 text-sm text-center py-4">No events on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-dark-900/50">
                  <span className="text-lg flex-shrink-0">{EVENT_LABELS[ev.type] || '📅'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{ev.title}</p>
                    {ev.time && <p className="text-xs text-dark-100/50 mt-0.5">🕐 {ev.time}</p>}
                    <span className={`badge text-xs mt-1 capitalize ${ev.status === 'approved' || ev.status === 'accepted' ? 'badge-success' : ev.status === 'pending' ? 'badge-pending' : 'badge-info'}`}>{ev.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}
