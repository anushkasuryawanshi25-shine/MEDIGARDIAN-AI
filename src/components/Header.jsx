import React from 'react';
import { Bell, Calendar, Percent, Sparkles } from 'lucide-react';

export default function Header({ activeTab, adherenceRate, notifications, clearNotifications, triggerDemoMode }) {
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'overview':
        return { title: 'Patient Overview', desc: 'Welcome back! Here is a summary of your health plan today.' };
      case 'medications':
        return { title: 'My Medications', desc: 'Manage prescriptions and track daily adherence.' };
      case 'ai-guardian':
        return { title: 'MediGuardian AI', desc: 'Interact with your simulated AI health companion.' };
      case 'vitals':
        return { title: 'Vitals & Analytics', desc: 'Log vital indicators and observe clinical trends.' };
      case 'prescriptions':
        return { title: 'Prescription OCR Scanner', desc: 'Scan prescription labels to instantly add medications.' };
      case 'settings':
        return { title: 'Settings', desc: 'Manage your profile, alerts, and medical preferences.' };
      default:
        return { title: 'MediGuardian Dashboard', desc: '' };
    }
  };

  const { title, desc } = getTabTitle(activeTab);

  // Format today's date nicely
  const getFormattedDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('en-US', options);
  };

  const isCriticalAdherence = adherenceRate < 75;

  return (
    <header className="app-header">
      <div className="header-title-sec">
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>

      <div className="header-actions">
        {/* Hackathon Demo Mode Trigger */}
        <button 
          className="btn btn-secondary" 
          onClick={triggerDemoMode}
          style={{ 
            borderColor: 'var(--primary)', 
            color: 'var(--primary)', 
            padding: '8px 16px', 
            fontSize: '0.85rem',
            background: 'var(--primary-light)',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          title="Populate clinical dataset for demo presentation"
        >
          <Sparkles size={14} />
          <span>Demo Data</span>
        </button>

        <div className="header-date">
          <Calendar size={16} style={{ marginRight: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
          <span>{getFormattedDate()}</span>
        </div>

        <div className={`header-stat-badge ${isCriticalAdherence ? 'critical' : ''}`}>
          <Percent size={16} />
          <span>Adherence: {adherenceRate}%</span>
        </div>

        <button className="notification-btn" title="View alerts" onClick={clearNotifications}>
          <Bell size={18} />
          {notifications.length > 0 && <span className="notification-dot"></span>}
        </button>
      </div>
    </header>
  );
}
