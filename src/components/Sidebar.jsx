import React from 'react';
import { 
  LayoutDashboard, 
  Pill, 
  MessageSquareHeart, 
  Activity, 
  FileText, 
  Settings,
  HeartPulse,
  QrCode,
  Users,
  ClipboardList,
  Trophy,
  Scan
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, patientInfo }) {
  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'verification', label: 'Medicine Scanner', icon: Scan },
    { id: 'ai-guardian', label: 'MediGuardian AI', icon: MessageSquareHeart },
    { id: 'gamification', label: 'Streaks & Rewards', icon: Trophy },
    { id: 'vitals', label: 'Vitals & Trends', icon: Activity },
    { id: 'prescriptions', label: 'Rx Scanner', icon: FileText },
    { id: 'passport', label: 'Health Passport', icon: QrCode },
    { id: 'family', label: 'Family Circle', icon: Users },
    { id: 'clinician', label: 'Clinician Portal', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'PT';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'PT';
    return parts
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <HeartPulse size={24} />
        </div>
        <span className="brand-name">MediGuardian AI</span>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`menu-item-btn ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="patient-badge">
          <div className="patient-avatar">
            {getInitials(patientInfo.name)}
          </div>
          <div className="patient-info">
            <span className="patient-name">{patientInfo.name}</span>
            <span className="patient-type">Patient ID: MG-2026</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
