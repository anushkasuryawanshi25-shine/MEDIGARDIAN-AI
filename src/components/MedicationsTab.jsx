import React, { useState } from 'react';
import { Pill, Plus, AlertTriangle, RefreshCw, Trash } from 'lucide-react';

export default function MedicationsTab({ medications, addMedication, updateMedicationStatus, deleteMedication, triggerTestAlarm, updateMedication, addNotification }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dose: '',
    duration: '30 days',
    frequency: 'Daily',
    time: 'Morning',
    instructions: '',
    refills: 3,
    doctor: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'refills' ? (value === '' ? null : parseInt(value)) : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.dose) return;
    
    // Automatically assign default reminder times based on categories
    let assignedTime = '09:00 AM';
    if (formData.time === 'Morning') assignedTime = '09:00 AM';
    else if (formData.time === 'Afternoon') assignedTime = '01:00 PM';
    else if (formData.time === 'Evening') assignedTime = '07:00 PM';
    else if (formData.time === 'Night') assignedTime = '09:00 PM';

    addMedication({
      ...formData,
      reminderTime: assignedTime
    });

    setFormData({
      name: '',
      dose: '',
      duration: '30 days',
      frequency: 'Daily',
      time: 'Morning',
      instructions: '',
      refills: 3,
      doctor: ''
    });
    setShowForm(false);
  };

  const lowRefillAlerts = medications.filter(m => m.refills !== undefined && m.refills !== null && m.refills <= 1);
  const takenCount = medications.filter(m => m.status === 'taken').length;
  const totalCount = medications.length;
  const adherenceScore = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  const handleCompleteCourse = (med) => {
    if (med.refills === undefined || med.refills === null) {
      alert("Refill information is not available for this medication.");
      return;
    }
    if (med.refills === 0) {
      alert("No refills remaining! Please submit a Refill Request first.");
      return;
    }
    const nextRefills = med.refills - 1;
    if (updateMedication) {
      updateMedication(med.id, { refills: nextRefills });
    }
    if (addNotification) {
      addNotification(`🎉 Course completed for ${med.name}! Remaining refills: ${nextRefills}.`);
    }
  };

  const handleRequestRefill = (med) => {
    const doctorName = med.doctor || "primary care physician";
    if (addNotification) {
      addNotification(`📩 Refill request submitted to ${doctorName} for ${med.name} ${med.dose}.`);
    }
    alert(`Refill request sent to ${doctorName} for ${med.name} ${med.dose}.`);
  };

  return (
    <div className="view-container">
      {/* Alert panel for low refills */}
      {lowRefillAlerts.length > 0 && (
        <div 
          className="chat-disclaimer" 
          style={{ 
            backgroundColor: 'var(--danger-light)', 
            borderColor: 'rgba(239, 68, 68, 0.25)', 
            color: '#7f1d1d',
            marginBottom: '24px'
          }}
        >
          <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
          <div>
            <strong>Low Refill Alert:</strong> You have {lowRefillAlerts.length} medication(s) with 1 or fewer refills remaining. 
            Please contact your prescribing doctor or pharmacy to request a renewal.
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Medications list */}
        <div className="card span-8">
          <div className="card-header-row">
            <h3 className="card-title">
              <Pill size={20} style={{ color: 'var(--primary)' }} />
              Active Medication Schedule
            </h3>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Medication
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px', border: '1px solid var(--primary-light)', backgroundColor: 'rgba(2, 132, 199, 0.02)' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary-hover)' }}>Add New Medication</h4>
              <div className="dashboard-grid">
                <div className="form-group span-4">
                  <label className="form-label">Medication Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    placeholder="e.g. Metformin" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group span-4">
                  <label className="form-label">Dosage / Strength *</label>
                  <input 
                    type="text" 
                    name="dose" 
                    placeholder="e.g. 500mg" 
                    value={formData.dose} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group span-4">
                  <label className="form-label">Duration *</label>
                  <input 
                    type="text" 
                    name="duration" 
                    placeholder="e.g. 30 days" 
                    value={formData.duration} 
                    onChange={handleInputChange} 
                    className="form-input" 
                    required 
                  />
                </div>
                <div className="form-group span-6">
                  <label className="form-label">Frequency</label>
                  <select name="frequency" value={formData.frequency} onChange={handleInputChange} className="form-select">
                    <option value="Daily">Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="As Needed (PRN)">As Needed (PRN)</option>
                  </select>
                </div>
                <div className="form-group span-6">
                  <label className="form-label">Category</label>
                  <select name="time" value={formData.time} onChange={handleInputChange} className="form-select">
                    <option value="Morning">Morning (9:00 AM)</option>
                    <option value="Afternoon">Afternoon (1:00 PM)</option>
                    <option value="Evening">Evening (7:00 PM)</option>
                    <option value="Night">Night (9:00 PM)</option>
                  </select>
                </div>
                <div className="form-group span-12">
                  <label className="form-label">Instructions / Notes</label>
                  <input 
                    type="text" 
                    name="instructions" 
                    placeholder="e.g. Take with dinner, avoid grapefruits" 
                    value={formData.instructions} 
                    onChange={handleInputChange} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group span-6">
                  <label className="form-label">Refills Remaining</label>
                  <input 
                    type="number" 
                    name="refills" 
                    min="0" 
                    max="20" 
                    placeholder="e.g. 3 (leave blank if unavailable)"
                    value={formData.refills === null ? '' : formData.refills} 
                    onChange={handleInputChange} 
                    className="form-input" 
                  />
                </div>
                <div className="form-group span-6">
                  <label className="form-label">Prescribing Doctor</label>
                  <input 
                    type="text" 
                    name="doctor" 
                    placeholder="e.g. Dr. Sarah Jenkins" 
                    value={formData.doctor} 
                    onChange={handleInputChange} 
                    className="form-input" 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Medication</button>
              </div>
            </form>
          )}

          {medications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <Pill size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <p>Your medication list is empty.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Add one manually above or scan a prescription label using the Rx Scanner.</p>
            </div>
          ) : (
            <div className="med-list-container">
              {medications.map(med => {
                const isLowRefill = med.refills <= 1;
                return (
                  <div key={med.id} className={`med-item-card ${med.status}`}>
                    <div className="med-info-group">
                      <div className="med-pill-icon">
                        💊
                      </div>
                      <div className="med-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="med-name" style={{ fontSize: '1.05rem' }}>{med.name}</span>
                          <span className="pill-badge blue">{med.dose}</span>
                          <span className="pill-badge teal">{med.time} ({med.reminderTime || '09:00 AM'})</span>
                          {med.duration && <span className="pill-badge orange" style={{ fontSize: '0.65rem', backgroundColor: 'var(--warning-light)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>{med.duration}</span>}
                          {med.status === 'taken' && <span className="pill-badge green" style={{ fontSize: '0.65rem' }}>Taken</span>}
                          {med.status === 'missed' && <span className="pill-badge red" style={{ fontSize: '0.65rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>Missed</span>}
                          {med.status === 'snoozed' && <span className="pill-badge warning" style={{ fontSize: '0.65rem', backgroundColor: 'var(--warning-light)', color: '#b45309' }}>Snoozed</span>}
                        </div>
                        <span className="med-meta" style={{ fontSize: '0.825rem', marginTop: '4px' }}>
                          <strong>Instructions:</strong> {med.instructions || 'Take as directed'}
                        </span>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', flexWrap: 'wrap', alignItems: 'center' }}>
                          <span><strong>Frequency:</strong> {med.frequency}</span>
                          {med.doctor && <span><strong>Rx Doctor:</strong> {med.doctor}</span>}
                          <span>
                            <strong>Refills:</strong>{' '}
                            {med.refills === undefined || med.refills === null ? (
                              <span style={{ color: 'var(--text-muted)' }}>Refill information not available</span>
                            ) : med.refills === 0 ? (
                              <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>⚠️ Refill Required</span>
                            ) : med.refills > 3 ? (
                              <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Refills: {med.refills} left</span>
                            ) : med.refills === 1 || med.refills === 2 ? (
                              <span style={{ color: '#d97706', fontWeight: '600' }}>Refills: {med.refills} left</span>
                            ) : (
                              <span>Refills: {med.refills} left</span>
                            )}
                          </span>
                        </div>

                        {/* Reminder Action Buttons */}
                        <div className="reminder-actions-row">
                          <button 
                            className={`action-btn btn-taken ${med.status === 'taken' ? 'active' : ''}`}
                            onClick={() => updateMedicationStatus(med.id, 'taken')}
                          >
                            ✓ Taken
                          </button>
                          <button 
                            className={`action-btn btn-missed ${med.status === 'missed' ? 'active' : ''}`}
                            onClick={() => updateMedicationStatus(med.id, 'missed')}
                          >
                            ✗ Missed
                          </button>
                          <button 
                            className={`action-btn btn-snooze ${med.status === 'snoozed' ? 'active' : ''}`}
                            onClick={() => updateMedicationStatus(med.id, 'snoozed')}
                          >
                            ⏰ Remind Later
                          </button>
                        </div>

                        {/* Refill Management Action Buttons */}
                        <div className="reminder-actions-row" style={{ marginTop: '8px', gap: '8px' }}>
                          <button
                            className="action-btn"
                            style={{ 
                              backgroundColor: 'rgba(2, 132, 199, 0.05)', 
                              color: 'var(--primary)', 
                              borderColor: 'rgba(2, 132, 199, 0.2)',
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => handleCompleteCourse(med)}
                            title="Complete this medication course to decrement refills left"
                          >
                            🎓 Complete Course
                          </button>
                          
                          {med.refills !== undefined && med.refills !== null && (
                            <button
                              className="action-btn"
                              style={{ 
                                backgroundColor: med.refills === 0 ? 'var(--danger-light)' : 'rgba(245, 158, 11, 0.05)', 
                                color: med.refills === 0 ? 'var(--danger)' : '#d97706', 
                                borderColor: med.refills === 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                fontSize: '0.75rem',
                                padding: '4px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: med.refills === 0 ? 'bold' : 'normal'
                              }}
                              onClick={() => handleRequestRefill(med)}
                            >
                              📩 Request Refill
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <button 
                        onClick={() => triggerTestAlarm && triggerTestAlarm(med)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', fontSize: '1rem', display: 'flex', alignItems: 'center' }}
                        title="Trigger test alarm"
                      >
                        🔔
                      </button>
                      <button 
                        onClick={() => deleteMedication(med.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                        title="Delete medication"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Prescription details & Adherence chart summary */}
        <div className="card span-4">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>
            <RefreshCw size={20} style={{ color: 'var(--secondary)' }} />
            Adherence Summary
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
            Logging medications regularly helps generate clean reports for your next doctor consult. Make sure to tick off pills as soon as you take them.
          </p>

          <div style={{ padding: '20px', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '600' }}>Overall Adherence Score</span>
            <span style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary-hover)', display: 'block', margin: '10px 0' }}>
              {adherenceScore}%
            </span>
            <div style={{ width: '100%', backgroundColor: 'var(--border)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${adherenceScore}%`,
                  height: '100%', 
                  backgroundColor: 'var(--success)',
                  transition: 'width 0.4s ease-out'
                }}
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
              {takenCount} of {totalCount} pills logged today
            </span>
          </div>

          <div className="ai-insight-box">
            <span className="insight-icon">💡</span>
            <p className="insight-text" style={{ fontSize: '0.825rem' }}>
              <strong>AI Recommendation:</strong> Set up SMS reminders in <strong>Settings</strong> to receive push updates 15 minutes before your dosage times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
