import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotificationStore } from '../app/store';
import {
  HomeIcon, UserGroupIcon, CalendarIcon, TrophyIcon,
  ChatBubbleLeftRightIcon, BellIcon, UserCircleIcon,
  Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  UsersIcon, DocumentChartBarIcon, CalendarDaysIcon,
  BoltIcon, MagnifyingGlassIcon, PlayIcon
} from '@heroicons/react/24/outline';

const TeamLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();

  const navItems = [
    { to: '/team/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { to: '/team/profile', icon: UserGroupIcon, label: 'Team Profile' },
    { to: '/team/players', icon: UsersIcon, label: 'Player Management' },
    { to: '/team/matches', icon: BoltIcon, label: 'Matches' },
    { to: '/team/book-ground', icon: CalendarIcon, label: 'Book Ground' },
    { to: '/team/register-tournament', icon: TrophyIcon, label: 'Tournaments' },
    { to: '/team/friendly-matches', icon: ChatBubbleLeftRightIcon, label: 'Friendly Matches' },
    { to: '/team/calendar', icon: CalendarDaysIcon, label: 'Calendar' },
    { to: '/team/reports', icon: DocumentChartBarIcon, label: 'Reports' },
    { to: '/match/setup', icon: PlayIcon, label: 'Start Live Match' },
    { to: '/calendar', icon: CalendarDaysIcon, label: 'Unified Calendar' },
    { to: '/search', icon: MagnifyingGlassIcon, label: 'Search' },
  ];

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-dark-800 border-r border-dark-700/50 w-64 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:static`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center">
            <UserGroupIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">My Team</p>
            <p className="text-xs text-dark-100/50 capitalize">{user?.role === 'captain' ? 'Team Captain' : 'Vice Captain'}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
          {user?.teamId && (
            <NavLink to={`/chat/${user.teamId}`} className="sidebar-link">
              <ChatBubbleLeftRightIcon className="w-5 h-5 flex-shrink-0" />
              Team Chat
            </NavLink>
          )}
        </nav>
        <div className="p-3 border-t border-dark-700/50">
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-700/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-100/50 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </button>
          <button onClick={logout} className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-dark-700/50 bg-dark-800/50 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden btn-ghost">
            {sidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => navigate('/notifications')} className="relative btn-ghost">
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <button onClick={() => navigate('/profile')} className="btn-ghost"><UserCircleIcon className="w-5 h-5" /></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><Outlet /></main>
      </div>
    </div>
  );
};

export default TeamLayout;
