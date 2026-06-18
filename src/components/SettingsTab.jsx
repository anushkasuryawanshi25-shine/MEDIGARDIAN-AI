import React, { useState, useEffect } from 'react';
import { Settings, User, Bell, Shield, CheckCircle } from 'lucide-react';
import { playTone, speakReminderText } from '../services/audio';

export default function SettingsTab({ patientInfo, updatePatientInfo, addNotification, onLogout, triggerTestAlarm }) {
  const [profile, setProfile] = useState({ ...patientInfo });
  const [saved, setSaved] = useState(false);
  const [toggles, setToggles] = useState({
    smsAlerts: true,
    emailAlerts: false,
    lowRefills: true,
    doctorSync: true
  });
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    return localStorage.getItem('mediguardian_gemini_api_key') || '';
  });
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('mediguardian_gemini_model_name') || 'models/gemini-1.5-flash';
  });

  const [firebaseConfig, setFirebaseConfig] = useState(() => {
    const saved = localStorage.getItem('mediguardian_firebase_config');
    return saved ? JSON.parse(saved) : { apiKey: '', projectId: '', messagingSenderId: '', appId: '' };
  });

  const handleFirebaseChange = (key, val) => {
    const updated = { ...firebaseConfig, [key]: val };
    setFirebaseConfig(updated);
    localStorage.setItem('mediguardian_firebase_config', JSON.stringify(updated));
  };

  const useFallbackModels = () => {
    const fallbacks = [
      { name: 'models/gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
      { name: 'models/gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
      { name: 'models/gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
      { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' }
    ];
    setAvailableModels(fallbacks);
  };

  const fetchModels = async (key) => {
    if (!key) return;
    const trimmedKey = key.trim();
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmedKey}`);
      if (response.ok) {
        const data = await response.json();
        const filtered = (data.models || [])
          .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
          .map(m => ({ name: m.name, displayName: m.displayName || m.name }));
        
        if (filtered.length > 0) {
          setAvailableModels(filtered);
          const names = filtered.map(f => f.name);
          if (!names.includes(selectedModel)) {
            const firstFlash = filtered.find(f => f.name.toLowerCase().includes('flash'));
            const defaultM = firstFlash ? firstFlash.name : filtered[0].name;
            setSelectedModel(defaultM);
            localStorage.setItem('mediguardian_gemini_model_name', defaultM);
          }
        } else {
          useFallbackModels();
        }
      } else {
        useFallbackModels();
      }
    } catch (err) {
      console.error("Failed to fetch models, using fallback list:", err);
      useFallbackModels();
    }
  };

  useEffect(() => {
    if (geminiApiKey) {
      fetchModels(geminiApiKey);
    } else {
      setAvailableModels([]);
    }
  }, [geminiApiKey]);

  const handleApiKeyChange = (e) => {
    const val = e.target.value.trim();
    setGeminiApiKey(val);
    localStorage.setItem('mediguardian_gemini_api_key', val);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (key) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
    addNotification(`Notification setting updated.`);
  };

  const handleSettingChange = (key, value) => {
    const updatedSettings = {
      ...(profile.settings || {}),
      [key]: value
    };
    const updatedProfile = {
      ...profile,
      settings: updatedSettings
    };
    
    if (key === 'elderlyMode' && value === true) {
      updatedSettings.alarmVolume = 100;
      updatedSettings.voiceEnabled = true;
      updatedSettings.vibrationEnabled = true;
    }

    setProfile(updatedProfile);
    updatePatientInfo(updatedProfile);
    addNotification(`Alarm setting '${key}' updated.`);
  };

  const testAlarmSound = () => {
    const vol = (profile.settings?.alarmVolume ?? 80) / 100;
    const tone = profile.settings?.reminderTone ?? 'Hospital Chime';
    const hasVoice = profile.settings?.voiceEnabled ?? false;
    
    playTone(tone, vol);
    
    if (profile.settings?.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    if (hasVoice) {
      setTimeout(() => {
        speakReminderText(`This is a test of the Medi Guardian voice reminder system. Volume set to ${Math.round(vol * 100)} percent.`);
      }, 800);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePatientInfo(profile);
    setSaved(true);
    addNotification('Profile settings saved successfully.');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="view-container">
      <div className="dashboard-grid">
        {/* Profile Card */}
        <div className="card span-8">
          <div className="card-header-row">
            <h3 className="card-title">
              <User size={20} style={{ color: 'var(--primary)' }} />
              Personal Patient Profile
            </h3>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontSize: '0.85rem', fontWeight: '700' }}>
                <CheckCircle size={16} /> Saved!
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="dashboard-grid">
              <div className="form-group span-6">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={profile.name} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group span-6">
                <label className="form-label">Primary Care Doctor</label>
                <input 
                  type="text" 
                  name="doctor" 
                  value={profile.doctor || ''} 
                  onChange={handleInputChange} 
                  className="form-input" 
                />
              </div>

              <div className="form-group span-4">
                <label className="form-label">Age</label>
                <input 
                  type="number" 
                  name="age" 
                  value={profile.age || ''} 
                  onChange={handleInputChange} 
                  className="form-input" 
                />
              </div>

              <div className="form-group span-4">
                <label className="form-label">Blood Type</label>
                <select 
                  name="bloodType" 
                  value={profile.bloodType || 'O+'} 
                  onChange={handleInputChange} 
                  className="form-select"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="form-group span-4">
                <label className="form-label">Emergency Phone</label>
                <input 
                  type="text" 
                  name="emergencyContact" 
                  value={profile.emergencyContact || ''} 
                  onChange={handleInputChange} 
                  className="form-input" 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px', width: '100%' }}>
              Save Profile Changes
            </button>
          </form>
        </div>

        {/* Notifications & Security settings */}
        <div className="card span-4">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>
            <Bell size={20} style={{ color: 'var(--secondary)' }} />
            App Alerts & Integrations
          </h3>

          <div className="settings-section">
            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">Daily Pill Reminders (SMS)</span>
                <span className="settings-desc">Receive texts 15 minutes before dosage times.</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={toggles.smsAlerts} 
                  onChange={() => handleToggle('smsAlerts')} 
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">Refill Warning Notifications</span>
                <span className="settings-desc">Alert when prescriptions drop to 1 refill.</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={toggles.lowRefills} 
                  onChange={() => handleToggle('lowRefills')} 
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row">
              <div className="settings-info">
                <span className="settings-label">Electronic Doctor Sync</span>
                <span className="settings-desc">Directly upload vitals to clinical EHR files.</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={toggles.doctorSync} 
                  onChange={() => handleToggle('doctorSync')} 
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Smart Alarm Preferences */}
          <div className="settings-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <Bell size={18} style={{ color: 'var(--secondary)' }} />
              <strong style={{ fontSize: '0.85rem' }}>Smart Alarm Preferences</strong>
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '4px' }}>
                <span>Alarm Volume</span>
                <span>{profile.settings?.alarmVolume || 80}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={profile.settings?.alarmVolume || 80}
                onChange={(e) => handleSettingChange('alarmVolume', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Reminder Tone</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select 
                  value={profile.settings?.reminderTone || 'Hospital Chime'}
                  onChange={(e) => handleSettingChange('reminderTone', e.target.value)}
                  className="form-select"
                  style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '10px' }}
                >
                  <option value="Hospital Chime">Hospital Chime (Soft)</option>
                  <option value="Pager Buzz">Pager Buzz (Standard)</option>
                  <option value="Pulse Alert">Pulse Alert (Teal)</option>
                </select>
                <button 
                  type="button"
                  onClick={testAlarmSound}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.75rem', borderRadius: '10px' }}
                  title="Test selected tone"
                >
                  🔊 Test
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Snooze Interval</label>
              <select 
                value={profile.settings?.snoozeInterval || 15}
                onChange={(e) => handleSettingChange('snoozeInterval', parseInt(e.target.value))}
                className="form-select"
                style={{ width: '100%', padding: '8px', fontSize: '0.8rem', borderRadius: '10px' }}
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>

            <div className="settings-row" style={{ padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="settings-label" style={{ fontSize: '0.75rem' }}>Device Vibration</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={profile.settings?.vibrationEnabled ?? true} 
                  onChange={() => handleSettingChange('vibrationEnabled', !(profile.settings?.vibrationEnabled ?? true))} 
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row" style={{ padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="settings-label" style={{ fontSize: '0.75rem' }}>Voice Synthesizer (TTS)</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={profile.settings?.voiceEnabled ?? false} 
                  onChange={() => handleSettingChange('voiceEnabled', !(profile.settings?.voiceEnabled ?? false))} 
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-row" style={{ padding: '4px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="settings-label" style={{ fontSize: '0.75rem', color: 'var(--primary-hover)', fontWeight: '700' }}>Elderly-Friendly Mode</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={profile.settings?.elderlyMode ?? false} 
                  onChange={() => handleSettingChange('elderlyMode', !(profile.settings?.elderlyMode ?? false))} 
                />
                <span className="slider"></span>
              </label>
            </div>

            <div style={{ marginTop: '12px' }}>
              <button 
                type="button" 
                onClick={() => triggerTestAlarm()} 
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '10px', fontSize: '0.8rem', borderColor: 'var(--primary)', color: 'var(--primary)', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}
              >
                🔔 Trigger Test Alarm Modal
              </button>
            </div>
          </div>

          {/* Google Gemini Integration */}
          <div className="settings-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <Settings size={18} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '0.85rem' }}>Google Gemini Integration</strong>
            </div>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Gemini API Key</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={handleApiKeyChange}
                className="form-input"
                style={{ width: '100%', borderRadius: '12px', fontSize: '0.8rem' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Used securely client-side for Chatbot and Prescription OCR.
              </span>
            </div>
            {availableModels.length > 0 && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: '700' }}>Select AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => {
                    const m = e.target.value;
                    setSelectedModel(m);
                    localStorage.setItem('mediguardian_gemini_model_name', m);
                    addNotification(`Active model changed to ${m.split('/').pop()}`);
                  }}
                  className="form-select"
                  style={{ width: '100%', borderRadius: '12px', fontSize: '0.8rem', padding: '10px' }}
                >
                  {availableModels.map(m => (
                    <option key={m.name} value={m.name}>{m.displayName}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Firebase Database Configuration */}
          <div className="settings-section" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <Shield size={18} style={{ color: 'var(--secondary)' }} />
              <strong style={{ fontSize: '0.85rem' }}>Firebase Configuration</strong>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Enter your Firebase Web Client config to synchronize schedules & history across devices.
            </p>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>API Key</label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={firebaseConfig.apiKey}
                onChange={(e) => handleFirebaseChange('apiKey', e.target.value.trim())}
                className="form-input"
                style={{ width: '100%', borderRadius: '10px', fontSize: '0.775rem', padding: '8px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Project ID</label>
              <input
                type="text"
                placeholder="mediguardian-app"
                value={firebaseConfig.projectId}
                onChange={(e) => handleFirebaseChange('projectId', e.target.value.trim())}
                className="form-input"
                style={{ width: '100%', borderRadius: '10px', fontSize: '0.775rem', padding: '8px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>Messaging Sender ID</label>
              <input
                type="text"
                placeholder="1234567890"
                value={firebaseConfig.messagingSenderId}
                onChange={(e) => handleFirebaseChange('messagingSenderId', e.target.value.trim())}
                className="form-input"
                style={{ width: '100%', borderRadius: '10px', fontSize: '0.775rem', padding: '8px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>App ID</label>
              <input
                type="text"
                placeholder="1:1234:web:abcd"
                value={firebaseConfig.appId}
                onChange={(e) => handleFirebaseChange('appId', e.target.value.trim())}
                className="form-input"
                style={{ width: '100%', borderRadius: '10px', fontSize: '0.775rem', padding: '8px' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <Shield size={18} style={{ color: 'var(--primary)' }} />
              <strong style={{ fontSize: '0.85rem' }}>Data Privacy</strong>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              Your health logs are encrypted locally. Access can be revoked at any time via your health provider portal.
            </p>
          </div>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={onLogout}
            style={{ marginTop: '16px', width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--danger-hover)', backgroundColor: 'var(--danger-light)', fontWeight: '700' }}
          >
            Sign Out of Portal
          </button>
        </div>
      </div>
    </div>
  );
}
