import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../app/store';
import { getDashboardRoute } from '../../utils/permissions';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { UserCircleIcon, PencilIcon, LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import FileUpload from '../../components/common/FileUpload';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPw, setChangingPw] = useState(false);
  const [showPwSection, setShowPwSection] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(getDashboardRoute(user?.role));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      toast.success('Profile updated successfully!');
      if (res.data.data) setUser?.(res.data.data);
      setEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (pwForm.newPassword.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    setChangingPw(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPwSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const roleLabels = {
    admin: 'System Administrator',
    association_head: 'Association Head',
    tournament_organizer: 'Tournament Organizer',
    captain: 'Team Captain',
    vice_captain: 'Team Vice Captain',
    ground_officer: 'Ground Booking Officer',
    funds_officer: 'Funds Officer',
    player: 'Player',
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-xl mx-auto">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-dark-700/40">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="btn-secondary p-2 rounded-xl text-dark-100/80 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold" title="Go Back">
            <ArrowLeftIcon className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="section-title gradient-text text-xl">My Profile</h1>
            <p className="text-dark-100/60 text-xs">Manage your personal information and security settings</p>
          </div>
        </div>
        <button
          onClick={() => navigate(getDashboardRoute(user?.role))}
          className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Dashboard
        </button>
      </div>

      {/* Profile Card */}
      <div className="card space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-sport-500 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0 overflow-hidden">
            {form.avatar ? (
              <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-dark-100/50 text-sm">{user?.email}</p>
            <span className="badge badge-info mt-2 text-xs capitalize">
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>
        </div>

        {!editing ? (
          <div className="space-y-3 border-t border-dark-700/50 pt-4">
            {[
              { label: 'Full Name', value: user?.name },
              { label: 'Email Address', value: user?.email },
              { label: 'Phone Number', value: user?.phone || 'Not set' },
              { label: 'Role', value: roleLabels[user?.role] || user?.role },
              { label: 'Status', value: user?.status || 'active' },
            ].map(field => (
              <div key={field.label} className="flex justify-between items-center text-sm">
                <span className="text-dark-100/50">{field.label}</span>
                <span className="text-white font-medium capitalize">{field.value}</span>
              </div>
            ))}
            <button onClick={() => setEditing(true)} className="btn-primary w-full justify-center gap-2 mt-4">
              <PencilIcon className="w-4 h-4" />
              Edit Profile
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 border-t border-dark-700/50 pt-4">
            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input type="tel" className="input" placeholder="+92 300 1234567" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label">Avatar Image</label>
              <div className="flex items-center gap-3">
                <input type="text" className="input flex-1" placeholder="https://example.com/avatar.jpg" value={form.avatar}
                  onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))} />
                <FileUpload
                  folder="avatars"
                  label="Upload Photo"
                  onUpload={(url) => setForm(f => ({ ...f, avatar: url }))}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <LockClosedIcon className="w-4 h-4 text-yellow-400" />
            Change Password
          </h3>
          <button onClick={() => setShowPwSection(!showPwSection)} className="btn-ghost text-sm text-primary-400">
            {showPwSection ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPwSection && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" minLength={8} value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" value={pwForm.confirmPassword}
                onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} required />
            </div>
            <button type="submit" disabled={changingPw} className="btn-primary w-full justify-center">
              {changingPw ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      {/* Account Info */}
      <div className="card space-y-2 text-xs text-dark-100/40">
        <p>Account created: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
        <p>Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</p>
        <p>User ID: {user?._id || user?.id}</p>
      </div>
    </div>
  );
}
