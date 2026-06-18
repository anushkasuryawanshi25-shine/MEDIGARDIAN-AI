import React, { useState } from 'react';
import { Users, BellRing, Plus, ShieldCheck, Mail, Phone, AlertTriangle, Send } from 'lucide-react';

export default function FamilyCareTab({ familyMembers, addFamilyMember, caregiverAlerts, triggerEmergencySOS, medications = [], history = [], onSendEncouragement, verificationHistory = [] }) {
  const [motivationSender, setMotivationSender] = useState('Emily Pendelton');
  const [motivationMsg, setMotivationMsg] = useState('');

  const handleSendMotivation = () => {
    if (!motivationMsg.trim()) return;
    if (onSendEncouragement) {
      onSendEncouragement(motivationMsg, motivationSender);
      setMotivationMsg('');
    }
  };

  // Compile caregiver alerts from both missed doses and dangerous/suspicious scans
  const compileAlerts = () => {
    const standard = caregiverAlerts.map(a => ({
      id: `std-${a.id}`,
      title: 'Missed Medicine Warning',
      text: a.text,
      time: a.time,
      date: a.date,
      type: 'danger'
    }));

    const scans = verificationHistory
      .filter(item => item.matchStatus === 'incorrect' || item.expiryStatus === 'expired' || item.matchStatus === 'needs_review')
      .map(item => {
        const isDanger = item.matchStatus === 'incorrect' || item.expiryStatus === 'expired';
        return {
          id: `scan-${item.id}`,
          title: isDanger ? '🚨 Dangerous Scan Alert' : '⚠️ Suspicious Scan Warning',
          text: `${item.name} (${item.strength || 'No strength'}) verification failed. Brand: ${item.brand || 'N/A'}. Details: ${item.matchReport}`,
          time: item.time,
          date: item.date,
          type: isDanger ? 'danger' : 'warning'
        };
      });

    return [...scans, ...standard];
  };

  const combinedAlerts = compileAlerts();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Daughter',
    phone: '',
    email: '',
    alertsEnabled: true
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    
    addFamilyMember({
      ...formData,
      status: 'Pending Invite'
    });

    setFormData({
      name: '',
      relationship: 'Daughter',
      phone: '',
      email: '',
      alertsEnabled: true
    });
    setShowInviteForm(false);
  };

  return (
    <div className="view-container">
      {/* emergency alert banner */}
      <div className="card" style={{ border: '2px solid var(--danger)', background: 'var(--danger-light)', marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />
            <div>
              <strong style={{ fontSize: '1.1rem', color: '#7f1d1d', display: 'block' }}>Emergency Caregiver Broadcast</strong>
              <span style={{ fontSize: '0.85rem', color: '#991b1b' }}>
                Instantly broadcast an urgent check-in request to all registered family members.
              </span>
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={triggerEmergencySOS}
            style={{ backgroundColor: 'var(--danger)', borderColor: 'var(--danger)', gap: '8px' }}
          >
            🚨 Trigger Caregiver Alert
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Connected Family Members (Span 8) */}
        <div className="card span-8">
          <div className="card-header-row">
            <h3 className="card-title">
              <Users size={20} style={{ color: 'var(--primary)' }} />
              Family Circle
            </h3>
            <button className="btn btn-primary" onClick={() => setShowInviteForm(!showInviteForm)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Plus size={16} /> Invite Member
            </button>
          </div>

          {showInviteForm && (
            <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px', border: '1px solid var(--primary-light)', backgroundColor: 'rgba(2, 132, 199, 0.02)' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary-hover)' }}>Invite Caregiver</h4>
              <div className="dashboard-grid">
                <div className="form-group span-6">
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group span-6">
                  <label className="form-label">Relationship</label>
                  <select name="relationship" value={formData.relationship} onChange={handleInputChange} className="form-select">
                    <option value="Daughter">Daughter</option>
                    <option value="Son">Son</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Private Nurse">Private Nurse</option>
                  </select>
                </div>
                <div className="form-group span-6">
                  <label className="form-label">Email Address *</label>
                  <input type="email" name="email" placeholder="caregiver@email.com" value={formData.email} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group span-6">
                  <label className="form-label">Phone Number (SMS alerts)</label>
                  <input type="text" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group span-12" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                  <input type="checkbox" name="alertsEnabled" checked={formData.alertsEnabled} onChange={handleInputChange} id="alertsCheckbox" style={{ width: '18px', height: '18px' }} />
                  <label htmlFor="alertsCheckbox" className="form-label" style={{ margin: 0, textTransform: 'none', fontSize: '0.9rem' }}>
                    Enable real-time missed medication SMS notifications
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Invite</button>
              </div>
            </form>
          )}

          {/* Members list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {familyMembers.map(member => (
              <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1px solid var(--border)', borderRadius: '16px', backgroundColor: 'var(--background)' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyOrigin: 'center', justifyContent: 'center', fontWeight: '800' }}>
                    {member.name ? member.name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'CG'}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{member.name}</strong>
                      <span className="pill-badge blue" style={{ fontSize: '0.65rem' }}>{member.relationship}</span>
                      <span className={`pill-badge ${member.status === 'Connected' ? 'green' : 'warning'}`} style={{ fontSize: '0.65rem' }}>{member.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {member.phone || 'No phone'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12} /> {member.email}</span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="pill-badge teal" style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', fontSize: '0.75rem' }}>
                    {member.alertsEnabled ? '🔔 SMS Active' : '🔕 Muted'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Alerts Feed & Motivation Panel (Span 4) */}
        <div className="span-4" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Caregiver Alerts Feed */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>
              <BellRing size={20} style={{ color: 'var(--secondary)' }} />
              Caregiver Alerts Feed
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              Chronological audit log of missed dose warnings broadcasted to registered caregivers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '180px', overflowY: 'auto' }}>
              {combinedAlerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No alerts sent today. Great adherence!
                </div>
              ) : (
                combinedAlerts.map(alert => (
                  <div key={alert.id} style={{ padding: '12px', borderLeft: alert.type === 'danger' ? '3px solid var(--danger)' : '3px solid var(--warning)', backgroundColor: alert.type === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)', borderRadius: '0 12px 12px 0', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: alert.type === 'danger' ? '#7f1d1d' : '#92400e', fontWeight: '700', marginBottom: '4px' }}>
                      <span>{alert.title}</span>
                      <span>{alert.time}</span>
                    </div>
                    <p style={{ color: alert.type === 'danger' ? '#991b1b' : '#b45309', margin: 0, lineHeight: '1.4' }}>
                      {alert.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Caregiver Motivation Portal */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} style={{ color: 'var(--primary)' }} />
              Caregiver Motivation Portal
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '16px' }}>
              Send supportive notes or a +20 XP encouragement boost directly to the patient's dashboard rewards board.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Caregiver Sender</label>
                <select 
                  value={motivationSender} 
                  onChange={(e) => setMotivationSender(e.target.value)} 
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-dark)',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  {familyMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.relationship})</option>
                  ))}
                  <option value="Family Care Group">Family Care Group</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Encouraging Note</label>
                <textarea 
                  rows="3"
                  placeholder="e.g. So proud of you keeping your streak alive!"
                  value={motivationMsg}
                  onChange={(e) => setMotivationMsg(e.target.value)}
                  style={{ 
                    fontSize: '0.85rem', 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-dark)', 
                    resize: 'none',
                    outline: 'none',
                    backgroundColor: 'var(--card-bg)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSendMotivation}
                style={{ width: '100%', gap: '8px', fontSize: '0.85rem', padding: '10px 16px' }}
                disabled={!motivationMsg.trim()}
              >
                🚀 Send Encouragement Boost
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Family Caregiver Oversight Dashboard Row */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div className="card span-12">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            🛡️ Family Oversight Dashboard
          </h3>
          
          <div className="dashboard-grid">
            {/* Missed / Taken Meds Oversight */}
            <div className="card span-4" style={{ border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--danger-hover)' }}>⚠️ Missed Medications</h4>
              {medications.filter(m => m.status === 'missed').length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No missed medications listed.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {medications.filter(m => m.status === 'missed').map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--danger-light)', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <strong>{m.name} ({m.dose})</strong>
                      <span style={{ color: 'var(--danger)', fontWeight: '700' }}>Missed ({m.time})</span>
                    </div>
                  ))}
                </div>
              )}

              <h4 style={{ fontSize: '0.9rem', marginTop: '20px', marginBottom: '12px', color: 'var(--success-hover)' }}>✓ Taken Medications</h4>
              {medications.filter(m => m.status === 'taken').length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No medications marked taken yet today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {medications.filter(m => m.status === 'taken').map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: 'var(--success-light)', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <strong>{m.name} ({m.dose})</strong>
                      <span style={{ color: 'var(--success)', fontWeight: '700' }}>Taken ({m.time})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Reminder History */}
            <div className="card span-4" style={{ border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--primary-hover)' }}>⏰ Caregiver Reminder History</h4>
              {history.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No reminder history logs recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {history.map(log => (
                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.775rem' }}>
                      <div>
                        <strong>{log.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({log.dose})</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scheduled: {log.scheduledTime}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={`pill-badge ${log.status === 'taken' ? 'green' : log.status === 'missed' ? 'red' : 'warning'}`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{log.actionTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medicine Verification Audits */}
            <div className="card span-4" style={{ border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--primary-hover)' }}>🛡️ Medicine Verification Audits</h4>
              {verificationHistory.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No verification logs recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {verificationHistory.map(log => {
                    const isDanger = log.matchStatus === 'incorrect' || log.expiryStatus === 'expired';
                    const isWarning = log.matchStatus === 'needs_review' || log.expiryStatus === 'soon';
                    let badgeColor = 'green';
                    if (isDanger) badgeColor = 'red';
                    else if (isWarning) badgeColor = 'warning';

                    return (
                      <div key={log.id} style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '0.775rem', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{log.name} {log.strength}</strong>
                          <span className={`pill-badge ${badgeColor}`} style={{ fontSize: '0.6rem' }}>
                            {log.matchStatus.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          Brand: {log.brand || 'N/A'} | Expiry: {log.expiryDate}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Scan Date: {log.date} {log.time}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
