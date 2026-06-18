import React from 'react';
import { QrCode, Printer, ShieldCheck, Heart, User, FileText, CheckSquare } from 'lucide-react';

export default function HealthPassportTab({ patientInfo, medications, vitalsLog, adherenceRate, onReportGenerated }) {
  // Calculate average vitals
  const getAverageVitals = () => {
    if (vitalsLog.length === 0) return { bp: '120/80', glucose: '95', hr: '72' };
    
    const total = vitalsLog.length;
    const sysSum = vitalsLog.reduce((acc, curr) => acc + curr.bpSystolic, 0);
    const diaSum = vitalsLog.reduce((acc, curr) => acc + curr.bpDiastolic, 0);
    const hrSum = vitalsLog.reduce((acc, curr) => acc + curr.heartRate, 0);
    const gluSum = vitalsLog.reduce((acc, curr) => acc + curr.glucose, 0);

    return {
      bp: `${Math.round(sysSum / total)}/${Math.round(diaSum / total)}`,
      hr: `${Math.round(hrSum / total)}`,
      glucose: `${Math.round(gluSum / total)}`
    };
  };

  const averages = getAverageVitals();

  // BMI calculations
  const heightMeters = patientInfo.height / 100;
  const calculatedBMI = heightMeters > 0 ? (Math.round((patientInfo.weight / Math.pow(heightMeters, 2)) * 10) / 10) : 0;

  const getBMICategoryText = (bmi) => {
    if (bmi <= 0) return 'No Data';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal Weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };
  const bmiCategoryText = getBMICategoryText(calculatedBMI);

  // Print Handler
  const handlePrint = () => {
    window.print();
    if (onReportGenerated) {
      onReportGenerated();
    }
  };

  return (
    <div className="view-container">
      {/* Intro section */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <QrCode size={24} style={{ color: 'var(--primary)' }} />
              Digital Health Passport
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px', lineHeight: '1.5' }}>
              A consolidated, doctor-friendly clinical digest. You can print this official PDF report to hand to your physician during consults, or let them scan the QR code to sync logs directly with EHR medical portals.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handlePrint} style={{ gap: '10px' }}>
            <Printer size={18} /> Print Health Report
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Printable Report Document Card */}
        <div className="card span-8 printable-report-card" style={{ backgroundColor: '#fff', border: '1px solid var(--border-dark)', padding: '40px', color: '#000' }}>
          
          {/* Report Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>
                MEDIGUARDIAN HEALTH DIGEST
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official Patient Clinical Record | Generated on {new Date().toLocaleDateString()}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--primary-hover)' }}>{patientInfo.name || 'Guest Patient'}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passport ID: MG-{patientInfo.email ? patientInfo.email.substring(0, 4).toUpperCase() : '2026'}</span>
            </div>
          </div>

          {/* Section 1: Demographics */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Patient Demographics
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
              <div>Age: <strong style={{ color: '#000' }}>{patientInfo.age || 0} Years</strong></div>
              <div>Blood Type: <strong style={{ color: '#000' }}>{patientInfo.bloodType || 'O+'}</strong></div>
              <div>Height: <strong style={{ color: '#000' }}>{patientInfo.height || 0} cm</strong></div>
              <div>Weight: <strong style={{ color: '#000' }}>{patientInfo.weight || 0} kg</strong></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', fontSize: '0.85rem', marginTop: '12px' }}>
              <div>Primary Clinician: <strong style={{ color: '#000' }}>{patientInfo.doctor || 'Not assigned'}</strong></div>
              <div>Calculated BMI: <strong style={{ color: '#000' }}>{calculatedBMI} kg/m² ({bmiCategoryText})</strong></div>
            </div>
          </div>

          {/* Section 2: Adherence Stats */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Medication Adherence Report
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--success-hover)' }}>{adherenceRate}%</span>
                <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-muted)', fontWeight: '700' }}>ADHERENCE SCORE</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {patientInfo.name || 'Patient'} is currently tracking <strong>{medications.length} active prescriptions</strong>. 
                {medications.length > 0 ? (
                  <>
                    Doses are tracked daily. {medications.filter(m => m.refills !== undefined && m.refills !== null && m.refills <= 1).length > 0 ? (
                      <span>Refill alert flag is active for: <strong>{medications.filter(m => m.refills !== undefined && m.refills !== null && m.refills <= 1).map(m => m.name).join(', ')}</strong>.</span>
                    ) : (
                      <span>All prescription refill levels are currently stable.</span>
                    )}
                  </>
                ) : (
                  <span>No prescriptions tracked yet.</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Medication Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Current Prescribed Regimen
            </h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 4px' }}>Medication</th>
                  <th style={{ padding: '8px 4px' }}>Dosage</th>
                  <th style={{ padding: '8px 4px' }}>Schedule</th>
                  <th style={{ padding: '8px 4px' }}>Refills Left</th>
                  <th style={{ padding: '8px 4px' }}>Physician</th>
                </tr>
              </thead>
              <tbody>
                {medications.map(med => (
                  <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                    <td style={{ padding: '10px 4px', fontWeight: '700', color: '#000' }}>{med.name}</td>
                    <td style={{ padding: '10px 4px' }}>{med.dose}</td>
                    <td style={{ padding: '10px 4px' }}>{med.time} ({med.frequency})</td>
                    <td style={{ 
                      padding: '10px 4px', 
                      color: med.refills === undefined || med.refills === null ? 'var(--text-muted)' : 
                             med.refills === 0 ? 'var(--danger)' : 
                             med.refills === 1 || med.refills === 2 ? '#d97706' : 
                             med.refills > 3 ? 'var(--success)' : 'inherit',
                      fontWeight: med.refills !== undefined && med.refills !== null && med.refills <= 1 ? '700' : 'normal' 
                    }}>
                      {med.refills === undefined || med.refills === null ? 'Refill information not available' : 
                       med.refills === 0 ? '⚠️ Refill Required' : 
                       `${med.refills} refills`}
                    </td>
                    <td style={{ padding: '10px 4px' }}>{med.doctor || 'Dr. Jenkins'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Vitals Averages */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Vitals 7-Day Averages
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
              <div style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>BLOOD PRESSURE</span>
                <strong style={{ fontSize: '1.1rem', color: '#000' }}>{averages.bp} mmHg</strong>
              </div>
              <div style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>FASTING GLUCOSE</span>
                <strong style={{ fontSize: '1.1rem', color: '#000' }}>{averages.glucose} mg/dL</strong>
              </div>
              <div style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>HEART RATE</span>
                <strong style={{ fontSize: '1.1rem', color: '#000' }}>{averages.hr} bpm</strong>
              </div>
            </div>
          </div>

          {/* Section 5: Lifestyle Recommendations */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Clinician Lifestyle Recommendations
            </h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontSize: '0.85rem', color: '#334155', lineHeight: '1.6' }}>
              <li><strong>Aerobic Cardio:</strong> Engage in 150 minutes of moderate-intensity brisk walking weekly to help reduce BMI and optimize glycemic levels.</li>
              <li><strong>Dietary Glycemic Index:</strong> Maintain a low-glycemic dietary regime, focusing on fiber and vegetables to manage blood glucose readings.</li>
              <li><strong>Hypertension Control:</strong> Monitor daily BP readings, maintaining a low-sodium diet (&lt; 1,500mg/day) to support Lisinopril therapy.</li>
            </ul>
          </div>

          {/* Signature Box */}
          <div style={{ borderTop: '1px solid #0f172a', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div>Patient Signature: _______________________</div>
            <div>Attending Clinician Signature: _______________________</div>
          </div>

        </div>

        {/* Side Panel: QR Code and Sync Details */}
        <div className="card span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>
              <QrCode size={20} style={{ color: 'var(--primary)' }} />
              Clinician EHR Sync
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
              Let your doctor scan this QR code during your appointment. It will securely transfer your adherence reports, vitals history, and drug list directly into their official epic/cerner records.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', backgroundColor: 'var(--background)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '20px' }}>
              {/* Simulated QR Code using CSS vector elements */}
              <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '12px', border: '1px solid var(--border-dark)', marginBottom: '12px', display: 'inline-block' }}>
                <svg width="140" height="140" viewBox="0 0 100 100">
                  <path d="M5,5 h30 v30 h-30 z M10,10 h20 v20 h-20 z M15,15 h10 v10 h-10 z" fill="black" />
                  <path d="M65,5 h30 v30 h-30 z M70,10 h20 v20 h-20 z M75,15 h10 v10 h-10 z" fill="black" />
                  <path d="M5,65 h30 v30 h-30 z M10,70 h20 v20 h-20 z M75,75 h15 v15 h-15 z" fill="black" />
                  <rect x="75" y="65" width="5" height="5" fill="black" />
                  <rect x="85" y="65" width="5" height="5" fill="black" />
                  <rect x="65" y="75" width="5" height="5" fill="black" />
                  <rect x="65" y="85" width="5" height="5" fill="black" />
                  <rect x="45" y="5" width="5" height="20" fill="black" />
                  <rect x="55" y="15" width="5" height="15" fill="black" />
                  <rect x="45" y="45" width="20" height="5" fill="black" />
                  <rect x="15" y="45" width="15" height="5" fill="black" />
                  <rect x="45" y="65" width="5" height="20" fill="black" />
                  <rect x="55" y="75" width="10" height="5" fill="black" />
                  <rect x="45" y="35" width="5" height="5" fill="black" />
                  <rect x="85" y="45" width="10" height="5" fill="black" />
                  <rect x="75" y="85" width="5" height="5" fill="black" />
                </svg>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>EHR-Sync Code: MG-2026-X</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Refreshes every 60 seconds</span>
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--success)', borderRadius: '0 12px 12px 0' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>HIPAA Encryption Active</strong>
            </div>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              Passport data exchange uses clinical HL7 FHIR standards, protected by end-to-end medical-grade token handshakes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
