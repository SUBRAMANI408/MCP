import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function SystemSettings() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form fields states
  const [appName, setAppName] = useState('');
  const [logo, setLogo] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('');
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [passwordMinLength, setPasswordMinLength] = useState(6);
  const [sessionTimeout, setSessionTimeout] = useState(24);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(30);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    setLoading(true);
    adminApi.getSystemConfig()
      .then(res => {
        const c = res.data.data;
        setConfig(c);
        setAppName(c.appName || '');
        setLogo(c.logo || '');
        setSmtpHost(c.emailSettings?.smtpHost || '');
        setSmtpPort(c.emailSettings?.smtpPort || 587);
        setSmtpUser(c.emailSettings?.smtpUser || '');
        setEmailEnabled(c.notificationSettings?.emailEnabled ?? true);
        setPushEnabled(c.notificationSettings?.pushEnabled ?? true);
        setInAppEnabled(c.notificationSettings?.inAppEnabled ?? true);
        setPasswordMinLength(c.securitySettings?.passwordMinLength ?? 6);
        setSessionTimeout(c.securitySettings?.sessionTimeout ?? 24);
        setMaxLoginAttempts(c.securitySettings?.maxLoginAttempts ?? 5);
        setLockoutDuration(c.securitySettings?.lockoutDuration ?? 30);
      })
      .catch(() => toast.error('Failed to load system config'))
      .finally(() => setLoading(false));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setUpdating(true);

    const payload = {
      appName,
      logo,
      emailSettings: {
        smtpHost,
        smtpPort,
        smtpUser,
        enabled: !!smtpHost
      },
      notificationSettings: {
        emailEnabled,
        pushEnabled,
        inAppEnabled
      },
      securitySettings: {
        passwordMinLength,
        sessionTimeout,
        maxLoginAttempts,
        lockoutDuration
      }
    };

    adminApi.updateSystemConfig(payload)
      .then(() => {
        toast.success('System configuration updated successfully');
        loadSettings();
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to update system config'))
      .finally(() => setUpdating(false));
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
          <h1 className="section-title gradient-text">System Configuration</h1>
          <p className="text-dark-100/60 text-sm mt-1">Configure global application branding, email SMTP relays, password guidelines, and upload constraints</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Application branding */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Application Branding</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Application Title</label>
              <input type="text" className="input" value={appName} onChange={e => setAppName(e.target.value)} required />
            </div>
            <div>
              <label className="label">Logo Image URL</label>
              <input type="text" className="input" placeholder="https://example.com/logo.png" value={logo} onChange={e => setLogo(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Email config */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Email Relay Settings (SMTP)</h3>
          <p className="text-xs text-dark-100/40">These values configure Nodemailer integrations. Secure credentials must be set in your backend `.env` variables.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">SMTP Relay Host</label>
              <input type="text" className="input" placeholder="smtp.mailtrap.io" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
            </div>
            <div>
              <label className="label">SMTP Port</label>
              <input type="number" className="input" value={smtpPort} onChange={e => setSmtpPort(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">SMTP Username</label>
              <input type="text" className="input" placeholder="smtp-user" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Notification Broadcast Scopes</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-dark-700/30">
              <div>
                <div className="text-sm font-semibold text-white">Email Alerts Dispatch</div>
                <div className="text-xs text-dark-100/50">Dispatches email receipts, reset notifications, and alerts</div>
              </div>
              <button
                type="button"
                onClick={() => setEmailEnabled(!emailEnabled)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${emailEnabled ? 'bg-sport-600 text-white' : 'bg-dark-700 text-dark-100/60'}`}
              >
                {emailEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-dark-700/30">
              <div>
                <div className="text-sm font-semibold text-white">Push Alert Dispatch</div>
                <div className="text-xs text-dark-100/50">Fires web socket-based real time notifications</div>
              </div>
              <button
                type="button"
                onClick={() => setPushEnabled(!pushEnabled)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${pushEnabled ? 'bg-sport-600 text-white' : 'bg-dark-700 text-dark-100/60'}`}
              >
                {pushEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-dark-900 rounded-xl border border-dark-700/30">
              <div>
                <div className="text-sm font-semibold text-white">In-App Notification Feed</div>
                <div className="text-xs text-dark-100/50">Renders alerts inside users dashboards notification log</div>
              </div>
              <button
                type="button"
                onClick={() => setInAppEnabled(!inAppEnabled)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${inAppEnabled ? 'bg-sport-600 text-white' : 'bg-dark-700 text-dark-100/60'}`}
              >
                {inAppEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        {/* Security configuration */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-white">Security & Password Policy</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Minimum Password Length</label>
              <input type="number" className="input" min="6" value={passwordMinLength} onChange={e => setPasswordMinLength(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Session Timeout (Hours)</label>
              <input type="number" className="input" min="1" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Max Failed Login Attempts</label>
              <input type="number" className="input" min="3" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Lockout Duration (Minutes)</label>
              <input type="number" className="input" min="5" value={lockoutDuration} onChange={e => setLockoutDuration(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={updating} className="btn-primary w-full justify-center py-3">
          {updating ? 'Saving Configuration...' : 'Save Configuration'}
        </button>

      </form>
    </div>
  );
}
