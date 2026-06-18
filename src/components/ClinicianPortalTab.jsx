import React from 'react';
import { FileText, TrendingUp, CheckCircle, AlertOctagon, Clock, UserCheck } from 'lucide-react';

export default function ClinicianPortalTab({ patientInfo, medications, history = [], adherenceRate, verificationHistory = [] }) {
  // Filter history logs
  const takenCount = history.filter(h => h.status === 'taken').length;
  const missedCount = history.filter(h => h.status === 'missed').length;
  const skippedCount = history.filter(h => h.status === 'skipped').length;
  const totalLogs = history.length;

  // Calculate stats
  const complianceScore = totalLogs > 0 ? Math.round((takenCount / (takenCount + missedCount)) * 100) : adherenceRate;

  return (
    <div className="view-container">
      {/* Clinician Overview Summary */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        <div className="card span-12" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={20} style={{ color: 'var(--primary)' }} />
            Patient Compliance Dashboard (Dr. Jenkins View)
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
            This portal allows monitoring clinical adherence trends for patient <strong>{patientInfo.name}</strong>. 
            All medication intake events, snooze actions, and missed alerts are logged in real-time under HIPAA-compliant local records.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="stats-row" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Doses Taken</span>
            <span className="stat-value">{takenCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <AlertOctagon size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Doses Missed</span>
            <span className="stat-value" style={{ color: 'var(--danger)' }}>{missedCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Doses Skipped</span>
            <span className="stat-value">{skippedCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-label">Clinician Compliance</span>
            <span className="stat-value">{complianceScore}%</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Compliance History Logs Table */}
        <div className="card span-8">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            Adherence History Logs
          </h3>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
              No medication reminder logs recorded in the session yet. Alarms triggered by system intervals or manual test buttons will log results here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontWeight: '700' }}>
                    <th style={{ padding: '12px 8px' }}>Time</th>
                    <th style={{ padding: '12px 8px' }}>Medication</th>
                    <th style={{ padding: '12px 8px' }}>Scheduled</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px' }}>Snoozes</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}>
                      <td style={{ padding: '12px 8px', fontWeight: '500' }}>{log.actionTime}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <strong>{log.name}</strong> <span style={{ color: 'var(--text-muted)' }}>{log.dose}</span>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{log.scheduledTime}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span 
                          className={`pill-badge ${
                            log.status === 'taken' ? 'green' : 
                            log.status === 'missed' ? 'red' : 'warning'
                          }`}
                          style={{
                            fontSize: '0.7rem',
                            backgroundColor: 
                              log.status === 'taken' ? 'var(--success-light)' : 
                              log.status === 'missed' ? 'var(--danger-light)' : 'var(--warning-light)',
                            color: 
                              log.status === 'taken' ? 'var(--success)' : 
                              log.status === 'missed' ? 'var(--danger)' : '#b45309'
                          }}
                        >
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'center' }}>{log.snoozeCount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visual Adherence Analytics Chart */}
        <div className="card span-4">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={20} style={{ color: 'var(--secondary)' }} />
            Compliance Analytics
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '20px' }}>
            Visual curve representation of patient compliance ratios calculated against active prescriptions daily.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Taken vs Missed split */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
                <span>Taken Ratio</span>
                <span style={{ color: 'var(--success)' }}>{complianceScore}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${complianceScore}%`, height: '100%', backgroundColor: 'var(--success)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginBottom: '6px' }}>
                <span>Missed / Skipped Ratio</span>
                <span style={{ color: 'var(--danger)' }}>{100 - complianceScore}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${100 - complianceScore}%`, height: '100%', backgroundColor: 'var(--danger)' }}></div>
              </div>
            </div>

            {/* Clinician's Recommendation Note */}
            <div style={{ marginTop: '16px', padding: '14px', backgroundColor: 'rgba(2,132,199,0.02)', border: '1px solid var(--border)', borderRadius: '12px' }}>
              <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>Clinician Notes:</strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                {complianceScore >= 80 
                  ? "Patient displays excellent therapeutic compliance. Continue present dosage schedule." 
                  : "Compliance score is below threshold (80%). Suggesting review of dose schedules, pharmacy syncs, or enabling Caregiver SOS alerts."
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clinician Medicine Verification Audits & Safety Checklogs */}
      <div className="dashboard-grid" style={{ marginTop: '24px' }}>
        <div className="card span-12">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            🛡️ Prescribed Drug Verification Audits
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
            The table records patient scans of pharmaceutical strips, boxes, or bottles, verifying active chemistry match, dosage strength checks, and expiration dates.
          </p>

          {verificationHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No medicine packaging scans have been recorded for this patient.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                 <thead>
                   <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)', fontWeight: '700' }}>
                     <th style={{ padding: '12px 8px' }}>Scan Date/Time</th>
                     <th style={{ padding: '12px 8px' }}>Scanned Medicine</th>
                     <th style={{ padding: '12px 8px' }}>Brand Name</th>
                     <th style={{ padding: '12px 8px' }}>Batch Code</th>
                     <th style={{ padding: '12px 8px' }}>Expiry Date</th>
                     <th style={{ padding: '12px 8px' }}>Expiry Status</th>
                     <th style={{ padding: '12px 8px' }}>Match Status</th>
                     <th style={{ padding: '12px 8px' }}>Clinical Match Audit Report</th>
                   </tr>
                 </thead>
                 <tbody>
                   {verificationHistory.map((log) => {
                     const isDanger = log.matchStatus === 'incorrect' || log.expiryStatus === 'expired';
                     const isWarning = log.matchStatus === 'needs_review' || log.expiryStatus === 'soon';
                     
                     let rowBg = 'transparent';
                     if (isDanger) rowBg = 'rgba(239, 68, 68, 0.02)';
                     else if (isWarning) rowBg = 'rgba(245, 158, 11, 0.01)';

                     let matchBadgeColor = 'green';
                     if (log.matchStatus === 'incorrect') matchBadgeColor = 'red';
                     else if (log.matchStatus === 'needs_review') matchBadgeColor = 'warning';

                     let expiryBadgeColor = 'green';
                     if (log.expiryStatus === 'expired') expiryBadgeColor = 'red';
                     else if (log.expiryStatus === 'soon') expiryBadgeColor = 'warning';

                     return (
                       <tr 
                         key={log.id} 
                         style={{ 
                           borderBottom: '1px solid var(--border)', 
                           backgroundColor: rowBg,
                           transition: 'var(--transition)'
                         }}
                       >
                         <td style={{ padding: '12px 8px', fontWeight: '500' }}>
                           {log.date}<br/>
                           <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.time}</span>
                         </td>
                         <td style={{ padding: '12px 8px' }}>
                           <strong>{log.name}</strong> <span style={{ color: 'var(--text-muted)' }}>{log.strength}</span>
                         </td>
                         <td style={{ padding: '12px 8px' }}>{log.brand || 'N/A'}</td>
                         <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{log.batchNumber || 'N/A'}</td>
                         <td style={{ padding: '12px 8px' }}>{log.expiryDate}</td>
                         <td style={{ padding: '12px 8px' }}>
                           <span className={`pill-badge ${expiryBadgeColor}`} style={{ fontSize: '0.7rem' }}>
                             {log.expiryStatus.toUpperCase()}
                           </span>
                         </td>
                         <td style={{ padding: '12px 8px' }}>
                           <span className={`pill-badge ${matchBadgeColor}`} style={{ fontSize: '0.7rem' }}>
                             {log.matchStatus.toUpperCase()}
                           </span>
                         </td>
                         <td style={{ 
                           padding: '12px 8px', 
                           color: isDanger ? 'var(--danger)' : isWarning ? '#b45309' : 'var(--text-secondary)',
                           fontWeight: isDanger || isWarning ? '600' : 'normal',
                           fontSize: '0.8rem'
                         }}>
                           {log.matchReport}
                         </td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
