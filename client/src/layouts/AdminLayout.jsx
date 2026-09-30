import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotificationStore } from '../app/store';
import {
  HomeIcon, BuildingOffice2Icon, UsersIcon, TrophyIcon,
  ChartBarIcon, DocumentTextIcon, BellIcon, UserCircleIcon,
  Bars3Icon, XMarkIcon, ArrowRightOnRectangleIcon,
  MapPinIcon, MegaphoneIcon, PaperAirplaneIcon,
  PresentationChartLineIcon, ComputerDesktopIcon,
  Cog6ToothIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotificationStore();

  const navSections = [
    {
      title: 'Overview',
      items: [
        { to: '/admin/dashboard', icon: HomeIcon, label: 'Dashboard' },
        { to: '/admin/monitoring', icon: ComputerDesktopIcon, label: 'Monitoring' },
        { to: '/admin/analytics', icon: PresentationChartLineIcon, label: 'Analytics' },
      ]
    },
    {
      title: 'Management',
      items: [
        { to: '/admin/users', icon: UsersIcon, label: 'Users' },
        { to: '/admin/associations', icon: BuildingOffice2Icon, label: 'Associations' },
        { to: '/admin/sports', icon: TrophyIcon, label: 'Sports' },
        { to: '/admin/grounds', icon: MapPinIcon, label: 'Grounds' },
      ]
    },
    {
      title: 'Communication',
      items: [
        { to: '/admin/announcements', icon: MegaphoneIcon, label: 'Announcements' },
        { to: '/admin/notifications', icon: PaperAirplaneIcon, label: 'Send Notifications' },
      ]
    },
    {
      title: 'Insights',
      items: [
        { to: '/admin/reports', icon: ChartBarIcon, label: 'Reports' },
        { to: '/admin/audit-log', icon: ClipboardDocumentListIcon, label: 'Audit Log' },
      ]
    },
    {
      title: 'System',
      items: [
        { to: '/admin/settings', icon: Cog6ToothIcon, label: 'Settings' },
        { to: '/admin/security', icon: ShieldCheckIcon, label: 'Security' },
        { to: '/admin/feedback', icon: ChatBubbleLeftRightIcon, label: 'Feedback' },
      ]
    },
  ];

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-dark-800 border-r border-dark-700/50 transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-64 -translate-x-full'
      } lg:translate-x-0 lg:static lg:w-64`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-dark-700/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center">
            <TrophyIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm leading-tight">Sports</p>
            <p className="text-xs text-dark-100/50">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-dark-100/30">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-dark-700/50">
          <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-700/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-dark-100/50">System Admin</p>
            </div>
          </button>
          <button onClick={logout} className="w-full mt-1 flex items-center gap-3 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium">
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4 border-b border-dark-700/50 bg-dark-800/50 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden btn-ghost">
            {sidebarOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => navigate('/notifications')} className="relative btn-ghost">
              <BellIcon className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => navigate('/profile')} className="btn-ghost">
              <UserCircleIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
