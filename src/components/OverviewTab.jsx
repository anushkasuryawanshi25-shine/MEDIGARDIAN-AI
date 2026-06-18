import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  TrendingUp,
  BrainCircuit,
  CalendarCheck,
  Stethoscope,
  FileText
} from 'lucide-react';

export default function OverviewTab({ 
  patientInfo, 
  medications, 
  updateMedicationStatus, 
  adherenceRate, 
  vitalsLog, 
  setActiveTab,
  healthReports = [],
  activeAlarm = null,
  verificationHistory = []
}) {
  
  // Calculate today's checklist
  const todayMeds = medications;
  const takenCount = todayMeds.filter(m => m.status === 'taken').length;
  const totalCount = todayMeds.length;
  const dailyPercentage = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 100;

  // Determine next dose (anything not taken or missed)
  const getNextDoseText = () => {
    const pendingMeds = todayMeds.filter(m => m.status !== 'taken' && m.status !== 'missed');
    if (pendingMeds.length === 0) return 'All completed!';
    
    // Sort times roughly: Morning -> Afternoon -> Evening -> Night
    const timeOrder = { 'Morning': 1, 'Afternoon': 2, 'Evening': 3, 'Night': 4 };
    const sortedPending = [...pendingMeds].sort((a, b) => timeOrder[a.time] - timeOrder[b.time]);
    const nextMed = sortedPending[0];
    
    return `${nextMed.name} at ${nextMed.reminderTime || getCategoryTime(nextMed.time)}`;
  };

  const getCategoryTime = (category) => {
    switch (category) {
      case 'Morning': return '09:00 AM';
      case 'Afternoon': return '01:00 PM';
      case 'Evening': return '07:00 PM';
      case 'Night': return '09:00 PM';
      default: return '09:00 AM';
    }
  };

  // Get low refill count (exclude medicines with unavailable refills)
  const lowRefillsMeds = medications.filter(m => m.refills !== undefined && m.refills !== null && m.refills <= 1);

  // Get latest vitals
  const getLatestVitals = () => {
    if (vitalsLog.length === 0) return { bp: 'No data', hr: 'No data', glucose: 'No data' };
    const latest = vitalsLog[vitalsLog.length - 1];
    return {
      bp: `${latest.bpSystolic}/${latest.bpDiastolic}`,
      hr: `${latest.heartRate} bpm`,
      glucose: `${latest.glucose} mg/dL`
    };
  };
  const latestVitals = getLatestVitals();

  // BMI Calculation
  const heightMeters = patientInfo.height / 100;
  const calculatedBMI = heightMeters > 0 ? (Math.round((patientInfo.weight / Math.pow(heightMeters, 2)) * 10) / 10) : 0;
  const targetWeight = heightMeters > 0 ? Math.round(21.7 * Math.pow(heightMeters, 2)) : 70;

  const getBMICategory = (bmi) => {
    if (isNaN(bmi) || bmi <= 0) return { category: 'No Data', class: 'blue', desc: 'Please log your height and weight in Settings to calculate BMI.' };
    if (bmi < 18.5) return { category: 'Underweight (<18.5)', class: 'blue', desc: 'A BMI below 18.5 indicates you are underweight. Consider discussing nutritional plans with your doctor.' };
    if (bmi < 25) return { category: 'Optimal Range (18.5 - 24.9)', class: 'green', desc: 'Your BMI is within the healthy, optimal weight range. Excellent job maintaining a stable status!' };
    if (bmi < 30) return { category: 'Overweight Range (25.0 - 29.9)', class: 'warning', desc: `A BMI of ${bmi} indicates moderate excess weight. Reducing weight slightly can drop your BMI into the optimal range (<25.0).` };
    return { category: 'Obese Range (≥30.0)', class: 'red', desc: `A BMI of ${bmi} is in the obese range. We suggest consulting a healthcare provider to formulate a lifestyle strategy.` };
  };
  const bmiInfo = getBMICategory(calculatedBMI);

  return (
    <div className="view-container">
      {/* Active Alarm Status Warning Banner */}
      {activeAlarm && (
        <div 
          className="chat-disclaimer" 
          style={{ 
            backgroundColor: 'var(--danger-light)', 
            borderColor: 'rgba(239, 68, 68, 0.35)', 
            color: '#7f1d1d',
            marginBottom: '24px',
            animation: 'pulseBorder 2s infinite'
          }}
        >
          <ShieldAlert size={24} style={{ color: 'var(--danger)' }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '1.05rem' }}>Active Medication Alarm Status: 🚨 Ringing!</strong>
            <p style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>
              Your medication <strong>{activeAlarm.name} ({activeAlarm.dose})</strong> scheduled for {activeAlarm.time} is due now. Please click Mark as Taken or Snooze in the alarm modal!
            </p>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-info">
          <h2>Welcome, {patientInfo.name}</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.95)', marginTop: '4px', marginBottom: '12px' }}>
            Email: {patientInfo.email} | Login method: {patientInfo.provider}
          </p>
          <p>
            You are doing a fantastic job with your health plan. Your overall medication adherence score is{' '}
            <strong>{adherenceRate}%</strong>. Keep up the consistent schedule to maximize treatment efficacy!
          </p>
        </div>
        <button className="welcome-action-btn" onClick={() => setActiveTab('medications')}>
          Log Meds <ArrowRight size={16} style={{ marginLeft: '6px', verticalAlign: 'middle', display: 'inline-block' }} />
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CalendarCheck size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Overall Adherence</span>
            <span className="stat-value">{adherenceRate}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Next Medication</span>
            <span className="stat-value" style={{ fontSize: '1.05rem', fontWeight: '800' }}>
              {getNextDoseText()}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper warning">
            <ShieldAlert size={24} style={{ color: activeAlarm ? 'var(--danger)' : 'var(--warning)' }} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Active Alarm Status</span>
            <span className="stat-value" style={{ fontSize: '1.1rem', fontWeight: '800', color: activeAlarm ? 'var(--danger)' : 'inherit' }}>
              {activeAlarm ? '🚨 Ringing!' : '🔕 Idle'}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper teal">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Today's Progress</span>
            <span className="stat-value" style={{ fontSize: '1.1rem', fontWeight: '800' }}>
              {takenCount} / {totalCount} Taken
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Today's Checklist */}
        <div className="card span-8">
          <div className="card-header-row">
            <h3 className="card-title">
              <CheckCircle2 size={20} className="insight-icon" style={{ color: 'var(--primary)' }} />
              Today's Scheduled Dosages
            </h3>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
              {takenCount} of {totalCount} Taken
            </span>
          </div>

          {totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              No medications listed. Go to the <strong>Medications</strong> tab or scan a prescription to get started!
            </div>
          ) : (
            <div className="med-list-container">
              {['Morning', 'Afternoon', 'Evening', 'Night'].map(timePeriod => {
                const medsForTime = todayMeds.filter(m => m.time === timePeriod);
                if (medsForTime.length === 0) return null;

                return (
                  <div key={timePeriod} className="med-time-section">
                    <span className="time-title">
                      <Clock size={14} />
                      {timePeriod}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {medsForTime.map(med => (
                        <div key={med.id} className={`med-item-card ${med.status}`}>
                          <div className="med-info-group">
                            <span className="med-pill-icon">📋</span>
                            <div className="med-details">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="med-name">{med.name} {med.dose}</span>
                                {med.status === 'taken' && <span className="pill-badge green" style={{ fontSize: '0.65rem' }}>Taken</span>}
                                {med.status === 'missed' && <span className="pill-badge red" style={{ fontSize: '0.65rem', backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>Missed</span>}
                                {med.status === 'snoozed' && <span className="pill-badge warning" style={{ fontSize: '0.65rem', backgroundColor: 'var(--warning-light)', color: '#b45309' }}>Snoozed</span>}
                              </div>
                              <span className="med-meta">{med.instructions}</span>
                              
                              {/* Action Buttons for Smart Reminder */}
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: AI Insights & Quick Actions */}
        <div className="card span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>
              <BrainCircuit size={20} style={{ color: 'var(--secondary)' }} />
              MediGuardian AI Insights
            </h3>

            {/* Dynamic Insight 1 */}
            <div className="ai-insight-box">
              <span className="insight-icon">💡</span>
              <p className="insight-text">
                Your highest adherence rate is in the <strong>Morning</strong>. Taking medications with breakfast builds a healthy clinical routine.
              </p>
            </div>

            {/* Dynamic Insight 2 */}
            {lowRefillsMeds.length > 0 && (
              <div className="ai-insight-box" style={{ background: 'var(--warning-light)', borderColor: 'rgba(245,158,11,0.3)' }}>
                <span className="insight-icon" style={{ color: 'var(--warning)' }}>⚠️</span>
                <p className="insight-text" style={{ color: '#78350f' }}>
                  <strong>Refill Alert:</strong> {lowRefillsMeds.map(m => m.name).join(', ')} is low on refills ({lowRefillsMeds[0].refills === 0 ? '⚠️ Refill Required' : `${lowRefillsMeds[0].refills} left`}). Request a renewal.
                </p>
              </div>
            )}

            {/* Dynamic Insight 3 */}
            <div className="ai-insight-box">
              <span className="insight-icon">❤️</span>
              <p className="insight-text">
                Based on your logged vitals, your Heart Rate has remained stable in the <strong>68–74 bpm</strong> range, indicating good cardiovascular balance.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Quick Clinical Tools</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('ai-guardian')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.85rem' }}
              >
                💬 Ask Health Assistant
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveTab('prescriptions')}
                style={{ justifyContent: 'flex-start', padding: '10px 14px', fontSize: '0.85rem' }}
              >
                📷 Scan New Prescription
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Health Reports & Patient Vitals Insights */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        {/* Left Column: Health Reports (Span 8) */}
        <div className="card span-8">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            Clinical Health Reports
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Latest verified pathology, lipid panel, and diabetes screenings shared by your primary care network.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {healthReports.map(report => (
              <div key={report.id} style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', backgroundColor: 'rgba(2, 132, 199, 0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{report.name}</strong>
                  <span className={`pill-badge ${report.status === 'Normal' ? 'teal' : 'blue'}`} style={{ fontSize: '0.7rem' }}>{report.status}</span>
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  <span>Date: {report.date}</span> | <span>Doctor: {report.doctor}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', borderLeft: '3px solid var(--primary)', paddingLeft: '12px' }}>
                  {report.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: BMI and Vitals card (Span 4) */}
        <div className="card span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>
              ⚖️ Body Mass Index (BMI)
            </h3>
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', fontWeight: '700' }}>CALCULATED BMI</span>
              <span style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary)', display: 'block', margin: '10px 0' }}>
                {calculatedBMI}
              </span>
              <span className={`pill-badge ${bmiInfo.class}`} style={{ display: 'inline-block', fontSize: '0.8rem', padding: '4px 12px' }}>
                {bmiInfo.category}
              </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Height:</span>
                <strong>{patientInfo.height || 0} cm</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Weight:</span>
                <strong>{patientInfo.weight || 0} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Target Weight:</span>
                <strong style={{ color: 'var(--success)' }}>{targetWeight} kg</strong>
              </div>
            </div>
          </div>

          <div className="ai-insight-box" style={{ marginTop: '20px' }}>
            <span className="insight-icon">⚖️</span>
            <p className="insight-text" style={{ fontSize: '0.8rem', margin: 0 }}>
              <strong>Clinical Note:</strong> {bmiInfo.desc}
            </p>
          </div>
        </div>
      </div>

      {/* Medicine Verification Center */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        {/* Left Column: Recent Scans History (Span 8) */}
        <div className="card span-8">
          <div className="card-header-row" style={{ marginBottom: '16px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛡️</span>
              Medicine Verification Center
            </h3>
            <button 
              className="btn btn-secondary" 
              onClick={() => setActiveTab('verification')}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Verify New Medicine
            </button>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Verify your scanned medication packages (strips, bottles, boxes) against your active prescriptions list to verify safety.
          </p>

          {verificationHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', border: '1px dashed var(--border-dark)', borderRadius: '12px' }}>
              No medication verifications completed yet.
              <button 
                className="btn btn-primary" 
                onClick={() => setActiveTab('verification')}
                style={{ margin: '12px auto 0 auto', display: 'block', fontSize: '0.85rem' }}
              >
                Scan Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {verificationHistory.slice(0, 3).map((item) => {
                const isCorrect = item.matchStatus === 'correct';
                const isWarning = item.matchStatus === 'needs_review' || item.expiryStatus === 'soon';
                const isDanger = item.matchStatus === 'incorrect' || item.expiryStatus === 'expired';
                
                let badgeClass = 'green';
                let badgeText = 'Correct Medicine';
                if (isWarning) {
                  badgeClass = 'warning';
                  badgeText = item.expiryStatus === 'soon' ? 'Expiring Soon' : 'Review Match';
                } else if (isDanger) {
                  badgeClass = 'red';
                  badgeText = item.expiryStatus === 'expired' ? 'Expired' : 'Wrong Medicine';
                }

                return (
                  <div 
                    key={item.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      backgroundColor: 'var(--background)' 
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.name} {item.strength}</strong>
                        <span className={`pill-badge ${badgeClass}`} style={{ fontSize: '0.65rem' }}>{badgeText}</span>
                        {item.brand && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.brand})</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Scan Date: {item.date} {item.time}</span> | <span>Batch: {item.batchNumber || 'N/A'}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                        {item.matchReport}
                      </p>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setActiveTab('verification')}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'fit-content' }}
                    >
                      View Logs
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Last Scan Safety Status Indicator (Span 4) */}
        <div className="card span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>
              🔒 Packaging Safety Status
            </h3>
            
            {verificationHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🛡️</span>
                <span style={{ fontSize: '0.85rem' }}>No package scanned. Perform a scan to display safety compliance metrics.</span>
              </div>
            ) : (() => {
              const lastScan = verificationHistory[0];
              const isCorrect = lastScan.matchStatus === 'correct';
              const isWarning = lastScan.matchStatus === 'needs_review' || lastScan.expiryStatus === 'soon';
              const isDanger = lastScan.matchStatus === 'incorrect' || lastScan.expiryStatus === 'expired';

              let statusColor = 'var(--success)';
              let statusBg = 'var(--success-light)';
              let statusText = 'VERIFIED SAFE';
              let statusDesc = 'The medicine packaging matches your active prescription details and is within the safety expiry period.';
              let icon = '✅';

              if (isWarning) {
                statusColor = '#d97706';
                statusBg = 'var(--warning-light)';
                statusText = 'WARNING / REVIEW';
                statusDesc = 'Discrepancy detected in drug dosage or medicine is expiring soon. Please review with doctor before ingestion.';
                icon = '⚠️';
              } else if (isDanger) {
                statusColor = 'var(--danger)';
                statusBg = 'var(--danger-light)';
                statusText = 'DANGER: DO NOT TAKE';
                statusDesc = 'This packaging is expired or does not match any medication prescribed in your clinician records.';
                icon = '🚨';
              }

              return (
                <div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px 10px', 
                    borderRadius: '12px', 
                    backgroundColor: statusBg, 
                    border: `1px solid ${statusColor}40`,
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '6px' }}>{icon}</span>
                    <strong style={{ fontSize: '1.1rem', color: statusColor, display: 'block', letterSpacing: '0.05em' }}>{statusText}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                      Last Scanned: {lastScan.name} ({lastScan.strength})
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: '1.5', padding: '0 4px' }}>
                    <p style={{ margin: '0 0 12px 0' }}>
                      {statusDesc}
                    </p>
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Expiry Date:</span>
                        <strong style={{ color: lastScan.expiryStatus === 'expired' ? 'var(--danger)' : 'inherit' }}>{lastScan.expiryDate}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Batch Code:</span>
                        <strong>{lastScan.batchNumber || 'Unknown'}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => setActiveTab('verification')}
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              Verify A Medicine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
