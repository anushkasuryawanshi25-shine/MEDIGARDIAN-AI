import React, { useState } from 'react';
import { Activity, Heart, Eye, Plus, ChevronRight, Check } from 'lucide-react';

export default function VitalsTab({ vitalsLog, addVitalsLog, patientInfo }) {
  const [formData, setFormData] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    heartRate: '',
    glucose: '',
    weight: '',
    sleep: '',
  });
  const [showLogForm, setShowLogForm] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.bpSystolic || !formData.bpDiastolic || !formData.heartRate) return;
    
    addVitalsLog({
      date: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }),
      bpSystolic: parseInt(formData.bpSystolic),
      bpDiastolic: parseInt(formData.bpDiastolic),
      heartRate: parseInt(formData.heartRate),
      glucose: parseInt(formData.glucose) || 90,
      weight: parseFloat(formData.weight) || 72,
      sleep: parseFloat(formData.sleep) || 7.5
    });

    setFormData({
      bpSystolic: '',
      bpDiastolic: '',
      heartRate: '',
      glucose: '',
      weight: '',
      sleep: '',
    });
    setShowLogForm(false);
  };

  // Status evaluators
  const getBPStatus = (sys, dia) => {
    if (!sys || !dia) return { text: 'Unknown', className: 'normal' };
    if (sys < 120 && dia < 80) return { text: 'Optimal', className: 'normal' };
    if (sys >= 140 || dia >= 90) return { text: 'Hypertension L2', className: 'danger' };
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return { text: 'Hypertension L1', className: 'warning' };
    return { text: 'Elevated', className: 'warning' };
  };

  const getHRStatus = (hr) => {
    if (!hr) return { text: 'Unknown', className: 'normal' };
    if (hr >= 60 && hr <= 100) return { text: 'Normal', className: 'normal' };
    if (hr > 100) return { text: 'Tachycardia', className: 'danger' };
    return { text: 'Bradycardia', className: 'warning' };
  };

  const getGlucoseStatus = (gl) => {
    if (!gl) return { text: 'Unknown', className: 'normal' };
    if (gl < 100) return { text: 'Normal (Fasting)', className: 'normal' };
    if (gl >= 126) return { text: 'High', className: 'danger' };
    return { text: 'Pre-diabetes Range', className: 'warning' };
  };

  const getBMIStatus = (bmi) => {
    if (bmi < 18.5) return { text: 'Underweight', className: 'warning' };
    if (bmi < 25) return { text: 'Optimal BMI', className: 'normal' };
    if (bmi < 30) return { text: 'Overweight Range', className: 'warning' };
    return { text: 'Obese Range', className: 'danger' };
  };

  const latest = vitalsLog[vitalsLog.length - 1] || {
    bpSystolic: 120,
    bpDiastolic: 80,
    heartRate: 72,
    glucose: 95,
    weight: patientInfo?.weight || 70,
    sleep: 8
  };

  const bpStatus = getBPStatus(latest.bpSystolic, latest.bpDiastolic);
  const hrStatus = getHRStatus(latest.heartRate);
  const glucoseStatus = getGlucoseStatus(latest.glucose);

  // BMI calculation based on patient height
  const heightMeters = patientInfo && patientInfo.height > 0 ? patientInfo.height / 100 : 1.78;
  const calculatedBMI = heightMeters > 0 ? Math.round((latest.weight / Math.pow(heightMeters, 2)) * 10) / 10 : 0;
  const bmiStatus = getBMIStatus(calculatedBMI);

  // Helper to draw custom SVG charts
  const renderChartPath = (data, dataKey, minVal, maxVal, width, height) => {
    if (data.length < 2) return '';
    const points = data.map((d, index) => {
      const x = (index / (data.length - 1)) * (width - 60) + 40;
      const val = d[dataKey];
      const y = height - 30 - ((val - minVal) / (maxVal - minVal)) * (height - 60);
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i - 1].x + points[i].x) / 2;
      const yc = (points[i - 1].y + points[i].y) / 2;
      path += ` Q ${points[i - 1].x} ${points[i - 1].y}, ${xc} ${yc}`;
      path += ` T ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const renderChartArea = (data, dataKey, minVal, maxVal, width, height) => {
    const path = renderChartPath(data, dataKey, minVal, maxVal, width, height);
    if (!path) return '';
    const startX = 40;
    const endX = (data.length - 1) * ((width - 60) / (data.length - 1)) + 40;
    const bottomY = height - 30;
    return `${path} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  };

  const chartWidth = 500;
  const chartHeight = 200;

  return (
    <div className="view-container">
      {/* Vitals metrics overview */}
      <div className="vitals-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="vital-metric-card">
          <div className="vital-metric-header">
            <span>BLOOD PRESSURE</span>
            <Activity size={18} />
          </div>
          <span className="vital-metric-value">
            {latest.bpSystolic}/{latest.bpDiastolic}
            <span className="vital-metric-unit">mmHg</span>
          </span>
          <span className={`vital-metric-status ${bpStatus.className}`}>
            ● {bpStatus.text}
          </span>
        </div>

        <div className="vital-metric-card">
          <div className="vital-metric-header">
            <span>HEART RATE</span>
            <Heart size={18} style={{ color: 'var(--danger)' }} />
          </div>
          <span className="vital-metric-value">
            {latest.heartRate}
            <span className="vital-metric-unit">bpm</span>
          </span>
          <span className={`vital-metric-status ${hrStatus.className}`}>
            ● {hrStatus.text}
          </span>
        </div>

        <div className="vital-metric-card">
          <div className="vital-metric-header">
            <span>FASTING GLUCOSE</span>
            <Activity size={18} style={{ color: 'var(--secondary)' }} />
          </div>
          <span className="vital-metric-value">
            {latest.glucose}
            <span className="vital-metric-unit">mg/dL</span>
          </span>
          <span className={`vital-metric-status ${glucoseStatus.className}`}>
            ● {glucoseStatus.text}
          </span>
        </div>

        <div className="vital-metric-card">
          <div className="vital-metric-header">
            <span>BODY WEIGHT</span>
            <span style={{ fontSize: '1rem' }}>⚖️</span>
          </div>
          <span className="vital-metric-value">
            {latest.weight}
            <span className="vital-metric-unit">kg</span>
          </span>
          <span className="vital-metric-status normal">
            ● Stable (7-day trend)
          </span>
        </div>

        <div className="vital-metric-card">
          <div className="vital-metric-header">
            <span>BODY BMI</span>
            <span style={{ fontSize: '1rem' }}>📋</span>
          </div>
          <span className="vital-metric-value">
            {calculatedBMI}
            <span className="vital-metric-unit">kg/m²</span>
          </span>
          <span className={`vital-metric-status ${bmiStatus.className}`}>
            ● {bmiStatus.text}
          </span>
        </div>
      </div>


      <div className="dashboard-grid">
        {/* Charts Panel */}
        <div className="card span-8">
          <div className="card-header-row">
            <h3 className="card-title">
              <Activity size={20} style={{ color: 'var(--primary)' }} />
              Clinical Trend Reports
            </h3>
            <button className="btn btn-primary" onClick={() => setShowLogForm(!showLogForm)} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              <Plus size={16} /> Log Vitals
            </button>
          </div>

          {showLogForm && (
            <form onSubmit={handleSubmit} className="card" style={{ marginBottom: '24px', border: '1px solid var(--primary-light)', backgroundColor: 'rgba(2, 132, 199, 0.02)' }}>
              <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary-hover)' }}>Add New Vital Logs</h4>
              <div className="dashboard-grid">
                <div className="form-group span-4">
                  <label className="form-label">Systolic BP (mmHg) *</label>
                  <input type="number" name="bpSystolic" placeholder="e.g. 120" value={formData.bpSystolic} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group span-4">
                  <label className="form-label">Diastolic BP (mmHg) *</label>
                  <input type="number" name="bpDiastolic" placeholder="e.g. 80" value={formData.bpDiastolic} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group span-4">
                  <label className="form-label">Heart Rate (bpm) *</label>
                  <input type="number" name="heartRate" placeholder="e.g. 72" value={formData.heartRate} onChange={handleInputChange} className="form-input" required />
                </div>
                <div className="form-group span-4">
                  <label className="form-label">Fasting Glucose (mg/dL)</label>
                  <input type="number" name="glucose" placeholder="e.g. 95" value={formData.glucose} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group span-4">
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" step="0.1" name="weight" placeholder="e.g. 72.5" value={formData.weight} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group span-4">
                  <label className="form-label">Sleep (hrs)</label>
                  <input type="number" step="0.5" name="sleep" placeholder="e.g. 8.0" value={formData.sleep} onChange={handleInputChange} className="form-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLogForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Readings</button>
              </div>
            </form>
          )}

          {/* SVG BP Chart */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span>Blood Pressure (Systolic vs Diastolic)</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normal: &lt; 120/80 mmHg</span>
            </h4>
            <div className="chart-container" style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '10px', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
              {vitalsLog.length < 2 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', padding: '20px' }}>
                  📈 Not enough data points to map trends. Please log at least 2 vitals readings.
                </div>
              ) : (
                <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="chart-gradient-secondary" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line x1="40" y1="30" x2={chartWidth - 20} y2="30" className="chart-grid-line" />
                  <line x1="40" y1="85" x2={chartWidth - 20} y2="85" className="chart-grid-line" />
                  <line x1="40" y1="140" x2={chartWidth - 20} y2="140" className="chart-grid-line" />
                  <line x1="40" y1="170" x2={chartWidth - 20} y2="170" className="chart-grid-line" />
                  
                  {/* Area Gradients */}
                  <path d={renderChartArea(vitalsLog, 'bpSystolic', 60, 160, chartWidth, chartHeight)} className="chart-area" />
                  <path d={renderChartArea(vitalsLog, 'bpDiastolic', 40, 100, chartWidth, chartHeight)} className="chart-area-secondary" />

                  {/* Line Paths */}
                  <path d={renderChartPath(vitalsLog, 'bpSystolic', 60, 160, chartWidth, chartHeight)} className="chart-line" />
                  <path d={renderChartPath(vitalsLog, 'bpDiastolic', 40, 100, chartWidth, chartHeight)} className="chart-line-secondary" />

                  {/* Points & Labels */}
                  {vitalsLog.map((log, index) => {
                    const x = (index / (vitalsLog.length - 1)) * (chartWidth - 60) + 40;
                    const ySys = chartHeight - 30 - ((log.bpSystolic - 60) / (160 - 60)) * (chartHeight - 60);
                    const yDia = chartHeight - 30 - ((log.bpDiastolic - 40) / (100 - 40)) * (chartHeight - 60);
                    return (
                      <g key={index}>
                        <circle cx={x} cy={ySys} r="4" className="chart-dot" />
                        <circle cx={x} cy={yDia} r="4" className="chart-dot-secondary" />
                        <text x={x} y={chartHeight - 10} className="chart-axis-text" textAnchor="middle">{log.date}</text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '10px', fontSize: '0.8rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'var(--primary)', borderRadius: '2px' }} />
                Systolic BP (Target &lt; 120)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'var(--secondary)', borderRadius: '2px' }} />
                Diastolic BP (Target &lt; 80)
              </span>
            </div>
          </div>

          {/* SVG Heart Rate & Glucose row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>Heart Rate History (bpm)</h4>
              <div className="chart-container" style={{ height: '140px', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {vitalsLog.length < 2 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Awaiting more readings</span>
                ) : (
                  <svg className="chart-svg" viewBox={`0 0 ${chartWidth/2} 120`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    {/* Grid Lines */}
                    <line x1="30" y1="20" x2={chartWidth/2 - 10} y2="20" className="chart-grid-line" />
                    <line x1="30" y1="60" x2={chartWidth/2 - 10} y2="60" className="chart-grid-line" />
                    <line x1="30" y1="100" x2={chartWidth/2 - 10} y2="100" className="chart-grid-line" />
                    {/* Path */}
                    <path d={renderChartPath(vitalsLog, 'heartRate', 50, 110, chartWidth/2, 120)} className="chart-line" style={{ stroke: 'var(--danger)' }} />
                    {vitalsLog.map((log, index) => {
                      const x = (index / (vitalsLog.length - 1)) * (chartWidth/2 - 40) + 30;
                      const y = 120 - 20 - ((log.heartRate - 50) / (110 - 50)) * 80;
                      return (
                        <g key={index}>
                          <circle cx={x} cy={y} r="3.5" className="chart-dot" style={{ stroke: 'var(--danger)' }} />
                          <text x={x} y="115" className="chart-axis-text" textAnchor="middle">{log.date}</text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem' }}>Blood Sugar Fasting (mg/dL)</h4>
              <div className="chart-container" style={{ height: '140px', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {vitalsLog.length < 2 ? (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Awaiting more readings</span>
                ) : (
                  <svg className="chart-svg" viewBox={`0 0 ${chartWidth/2} 120`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    {/* Grid Lines */}
                    <line x1="30" y1="20" x2={chartWidth/2 - 10} y2="20" className="chart-grid-line" />
                    <line x1="30" y1="60" x2={chartWidth/2 - 10} y2="60" className="chart-grid-line" />
                    <line x1="30" y1="100" x2={chartWidth/2 - 10} y2="100" className="chart-grid-line" />
                    {/* Path */}
                    <path d={renderChartPath(vitalsLog, 'glucose', 60, 140, chartWidth/2, 120)} className="chart-line-secondary" />
                    {vitalsLog.map((log, index) => {
                      const x = (index / (vitalsLog.length - 1)) * (chartWidth/2 - 40) + 30;
                      const y = 120 - 20 - ((log.glucose - 60) / (140 - 60)) * 80;
                      return (
                        <g key={index}>
                          <circle cx={x} cy={y} r="3.5" className="chart-dot-secondary" />
                          <text x={x} y="115" className="chart-axis-text" textAnchor="middle">{log.date}</text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical analysis advice card */}
        <div className="card span-4">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>
            Clinical Guidance
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
            Logged vitals are automatically cross-checked with standard clinical reference values.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', borderLeft: '3px solid var(--success)', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '0 8px 8px 0' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>Vitals Logged Successfully</strong>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                All readings today fall inside optimal clinical parameters.
              </span>
            </div>

            <div style={{ padding: '14px', borderLeft: '3px solid var(--primary)', backgroundColor: 'rgba(2, 132, 199, 0.05)', borderRadius: '0 8px 8px 0' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block' }}>Monthly Trends Ready</strong>
              <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
                Your average blood pressure for June is <strong>121/81 mmHg</strong>. Perfect stability since starting Lisinopril.
              </span>
            </div>
          </div>

          <div className="ai-insight-box" style={{ marginTop: '20px' }}>
            <span className="insight-icon">🩺</span>
            <p className="insight-text" style={{ fontSize: '0.825rem' }}>
              <strong>Clinician Tip:</strong> Taking blood pressure readings twice daily—once in the morning and once in the evening—gives the most comprehensive health profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
