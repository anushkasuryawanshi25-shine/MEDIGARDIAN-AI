import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, CheckCircle2, AlertTriangle, ShieldAlert, History, Sparkles, FileText, Calendar, Clock, AlertCircle } from 'lucide-react';
import { parseMedicinePackaging, hasGeminiApiKey } from '../services/gemini';

export default function VerificationTab({ medications, verificationHistory, onSaveVerificationLog }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [matchReport, setMatchReport] = useState(null);
  const [matchStatus, setMatchStatus] = useState(null); // 'correct' | 'needs_review' | 'incorrect'
  const [expiryStatus, setExpiryStatus] = useState(null); // 'valid' | 'soon' | 'expired'
  
  // Camera state
  const [useCamera, setUseCamera] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!hasGeminiApiKey()) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleScan(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (!hasGeminiApiKey()) return;
    if (e.target.files && e.target.files[0]) {
      handleScan(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    setUseCamera(true);
    setCapturedImage(null);
    setFile(null);
    setScannedData(null);
    setMatchReport(null);
    setMatchStatus(null);
    setExpiryStatus(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
      alert("Could not access camera. Please verify permissions or upload a packaging file instead.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      setCapturedImage(dataUrl);
      stopCamera();
      
      handleScan({ name: 'camera_capture_med.jpg', previewUrl: dataUrl });
    }
  };

  // Run prescription matching logic
  const matchPrescription = (extractedData) => {
    if (!extractedData || !extractedData.name) return { status: 'incorrect', report: '❌ Could not read medicine name.', expiry: 'valid' };
    
    const scannedName = extractedData.name.toLowerCase().trim();
    const scannedStrength = extractedData.strength ? extractedData.strength.toLowerCase().replace(/\s+/g, '') : '';
    
    // Find matching prescription
    const prescription = medications.find(m => m.name.toLowerCase().trim() === scannedName || scannedName.includes(m.name.toLowerCase().trim()));
    
    let status = 'incorrect';
    let report = '';
    
    // Check Expiry Status (Current Date is 2026-06-18)
    const virtualNow = new Date('2026-06-18');
    let expiry = 'valid';
    
    if (extractedData.expiryDate) {
      try {
        const expStr = extractedData.expiryDate.toLowerCase();
        let expDate = null;
        
        const monthYearMatch = expStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/);
        const slashMatch = expStr.match(/(\d{1,2})\/(\d{4})/);
        const isoMatch = expStr.match(/(\d{4})-(\d{2})-(\d{2})/);
        
        if (isoMatch) {
          expDate = new Date(isoMatch[1], isoMatch[2] - 1, isoMatch[3]);
        } else if (slashMatch) {
          expDate = new Date(slashMatch[2], slashMatch[1], 0); // last day of month
        } else if (monthYearMatch) {
          const months = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
          const monthNum = months[monthYearMatch[1].substring(0, 3)];
          expDate = new Date(monthYearMatch[2], monthNum + 1, 0); // last day of month
        } else {
          expDate = new Date(extractedData.expiryDate);
        }
        
        if (expDate && !isNaN(expDate.getTime())) {
          const diffTime = expDate.getTime() - virtualNow.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays < 0) {
            expiry = 'expired';
          } else if (diffDays <= 90) { // expiring within 3 months
            expiry = 'soon';
          }
        }
      } catch (e) {
        console.error("Failed to parse expiry date:", e);
      }
    }
    
    if (expiry === 'expired') {
      status = 'incorrect';
      report = `❌ Medicine Expired (scanned expiry: ${extractedData.expiryDate || 'Expired'}). DO NOT TAKE!`;
    } else if (!prescription) {
      status = 'incorrect';
      report = `⚠️ Warning: "${extractedData.name}" is not listed in your current active prescription.`;
    } else {
      // Check dosage strength match
      const prescribedStrength = prescription.dose ? prescription.dose.toLowerCase().replace(/\s+/g, '') : '';
      const strengthMatch = (scannedStrength === prescribedStrength) || prescribedStrength.includes(scannedStrength) || scannedStrength.includes(prescribedStrength);
      
      if (!strengthMatch) {
        status = 'needs_review';
        report = `⚠️ Dosage Mismatch. Scanned: ${extractedData.strength || 'Unknown'}, Prescribed: ${prescription.dose}.`;
      } else {
        status = 'correct';
        report = `✅ Correct Medicine. Matches prescribed regimen for ${prescription.name} ${prescription.dose}.`;
      }
      
      if (expiry === 'soon') {
        if (status === 'correct') status = 'needs_review';
        report += ` (⚠️ Warning: Expiring soon on ${extractedData.expiryDate}!)`;
      }
    }
    
    return { status, report, expiry };
  };

  const handleScan = async (selectedFile) => {
    setFile(selectedFile);
    setScanning(true);
    setScannedData(null);
    setMatchReport(null);
    setMatchStatus(null);
    setExpiryStatus(null);

    try {
      if (!hasGeminiApiKey()) {
        throw new Error("Gemini API key is not configured. Please add your key in Settings.");
      }

      // Convert image to base64
      let base64String = '';
      let mimeType = selectedFile.type || 'image/jpeg';

      if (selectedFile.previewUrl) {
        base64String = selectedFile.previewUrl.split(',')[1];
      } else {
        base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = (error) => reject(error);
        });
      }

      // Parse metadata
      const parsedData = await parseMedicinePackaging(base64String, mimeType);
      setScannedData(parsedData);
      
      // Run matcher
      const matchResult = matchPrescription(parsedData);
      setMatchStatus(matchResult.status);
      setMatchReport(matchResult.report);
      setExpiryStatus(matchResult.expiry);

      // Save to history log in Dashboard
      if (onSaveVerificationLog) {
        onSaveVerificationLog({
          name: parsedData.name || 'Unknown',
          brand: parsedData.brand || 'Unknown',
          strength: parsedData.strength || 'Unknown',
          batchNumber: parsedData.batchNumber || 'Unknown',
          expiryDate: parsedData.expiryDate || 'Unknown',
          expiryStatus: matchResult.expiry,
          matchStatus: matchResult.status,
          matchReport: matchResult.report
        });
      }

    } catch (err) {
      console.error(err);
      let errorMsg = err.message || 'Failed to scan medicine packaging.';
      if (errorMsg.toLowerCase().includes('failed to fetch')) {
        errorMsg = 'Failed to fetch (Network Error). Check your Gemini configuration and internet connection.';
      }
      alert(`Scanner Error: ${errorMsg}`);
      setFile(null);
      setCapturedImage(null);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="view-container">
      <div className="dashboard-grid">
        
        {/* Scanner Panel (Left Column) */}
        <div className="card span-7">
          <div className="card-header-row" style={{ marginBottom: '16px' }}>
            <h3 className="card-title">
              <Camera size={20} style={{ color: 'var(--primary)' }} />
              Medicine Package Scanner
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>Smart OCR Verification</span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
            Ensure your medication safety by scanning your medicine box, label, or strip. Our AI system will extract the brand details, batch numbers, dosage strengths, and expiration dates, checking them instantly against your doctor's prescriptions.
          </p>

          {/* Camera Streaming Viewfinder */}
          {useCamera && (
            <div className="card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', backgroundColor: '#000', borderRadius: '16px', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', borderRadius: '12px' }}
              />
              
              <div style={{ position: 'absolute', border: '2px dashed rgba(16, 185, 129, 0.6)', borderRadius: '12px', top: '15%', bottom: '25%', left: '15%', right: '15%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '4px' }}>
                  Position medicine label within frame
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', zIndex: 10, width: '100%', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={stopCamera} style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', borderColor: 'transparent' }}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={capturePhoto} style={{ backgroundColor: 'var(--primary)' }}>
                  Capture Label
                </button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {/* Upload Area */}
          {!file && !useCamera && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!hasGeminiApiKey() && (
                <div className="chat-disclaimer" style={{ backgroundColor: 'var(--danger-light)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-hover)', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Gemini API Key Missing:</strong> Configure your API Key in the <strong>Settings</strong> tab to activate medicine package scanning features.
                  </span>
                </div>
              )}

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                style={{
                  border: '2px dashed var(--border-dark)',
                  borderRadius: '16px',
                  padding: '40px 20px',
                  textAlign: 'center',
                  cursor: hasGeminiApiKey() ? 'pointer' : 'not-allowed',
                  backgroundColor: 'rgba(2, 132, 199, 0.02)',
                  transition: 'border 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
                className="upload-dropzone"
              >
                <Upload size={40} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    Drag & Drop medicine package photo
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Supports strips, bottles, boxes, and dosage labels
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <label className="btn btn-secondary" style={{ cursor: hasGeminiApiKey() ? 'pointer' : 'not-allowed', margin: 0, padding: '8px 16px', fontSize: '0.85rem' }}>
                    Upload File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      style={{ display: 'none' }} 
                      disabled={!hasGeminiApiKey()}
                    />
                  </label>
                  
                  <button 
                    className="btn btn-primary" 
                    onClick={startCamera} 
                    disabled={!hasGeminiApiKey()}
                    style={{ padding: '8px 16px', fontSize: '0.85rem', gap: '6px' }}
                  >
                    <Camera size={16} /> Scan with Camera
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Scanning animation state */}
          {scanning && (
            <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Analyzing Medicine Packaging...</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Using Gemini AI OCR to extract manufacturer metadata and verify prescriptions.</span>
              </div>
            </div>
          )}

          {/* Captured Preview details */}
          {file && !scanning && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', border: '1px solid var(--border)', borderRadius: '12px', backgroundColor: 'var(--background)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <FileText size={18} style={{ color: 'var(--primary)' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>{file.name || 'Captured Packaging Image'}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Image Upload Complete</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setFile(null);
                    setScannedData(null);
                    setMatchReport(null);
                    setMatchStatus(null);
                    setExpiryStatus(null);
                  }}
                  style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              {capturedImage && (
                <div style={{ display: 'flex', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '12px', padding: '8px', backgroundColor: 'black' }}>
                  <img src={capturedImage} alt="Captured scan preview" style={{ maxHeight: '180px', borderRadius: '8px' }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scan Outcomes Results (Right Column) */}
        <div className="card span-5" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '400px' }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>
              Verification Report
            </h3>

            {!scannedData ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-dark)', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                💡 Scan a medicine packaging label or upload a strip image to compile a verification safety check here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Visual Status Indicator Banner */}
                <div 
                  style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    backgroundColor: matchStatus === 'correct' ? 'var(--success-light)' : (matchStatus === 'needs_review' ? 'var(--warning-light)' : 'var(--danger-light)'),
                    border: '1px solid',
                    borderColor: matchStatus === 'correct' ? 'rgba(16, 185, 129, 0.2)' : (matchStatus === 'needs_review' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <strong style={{ 
                    fontSize: '1rem', 
                    color: matchStatus === 'correct' ? 'var(--success-hover)' : (matchStatus === 'needs_review' ? 'var(--warning-hover)' : 'var(--danger-hover)'),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {matchStatus === 'correct' ? '✅ Correct Medicine' : (matchStatus === 'needs_review' ? '⚠️ Needs Review' : '❌ Do Not Take')}
                  </strong>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.85rem', 
                    color: 'var(--text-primary)',
                    lineHeight: '1.4',
                    fontWeight: '600'
                  }}>
                    {matchReport}
                  </p>
                </div>

                {/* Scanned Package Details Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Medicine Name:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{scannedData.name || 'Unknown'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Brand Name:</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{scannedData.brand || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Extracted Strength:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{scannedData.strength || 'Unknown'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Batch Number:</span>
                    <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{scannedData.batchNumber || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Mfg Date:</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{scannedData.mfgDate || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Expiry Date:</span>
                    <strong style={{ 
                      color: expiryStatus === 'expired' ? 'var(--danger-hover)' : (expiryStatus === 'soon' ? 'var(--warning-hover)' : 'var(--success-hover)')
                    }}>
                      {scannedData.expiryDate || 'Unknown'} ({expiryStatus === 'expired' ? 'Expired' : (expiryStatus === 'soon' ? 'Expiring Soon' : 'Valid')})
                    </strong>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div style={{ marginTop: '20px', padding: '14px', backgroundColor: 'rgba(2, 132, 199, 0.04)', borderRadius: '12px', border: '1px solid var(--primary-light)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
              Note: This is an AI safety lookup helper. Always visually verify batch labels. If packaging is damaged, consult a pharmacist.
            </p>
          </div>
        </div>

        {/* Verification History Log Table (Span 12) */}
        <div className="card span-12" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <History size={18} style={{ color: 'var(--primary)' }} />
            Medicine Verification History Audit Logs
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px' }}>Date / Time</th>
                  <th style={{ padding: '8px' }}>Medicine Name</th>
                  <th style={{ padding: '8px' }}>Brand</th>
                  <th style={{ padding: '8px' }}>Strength</th>
                  <th style={{ padding: '8px' }}>Batch No.</th>
                  <th style={{ padding: '8px' }}>Expiry</th>
                  <th style={{ padding: '8px' }}>Match Status</th>
                </tr>
              </thead>
              <tbody>
                {verificationHistory?.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No scan verification records saved yet.
                    </td>
                  </tr>
                ) : (
                  [...verificationHistory].reverse().map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <td style={{ padding: '12px 8px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Calendar size={12} />
                          <span>{log.date}</span>
                          <Clock size={12} style={{ marginLeft: '4px' }} />
                          <span>{log.time}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontWeight: '700', color: 'var(--text-primary)' }}>{log.name}</td>
                      <td style={{ padding: '12px 8px' }}>{log.brand}</td>
                      <td style={{ padding: '12px 8px' }}>{log.strength}</td>
                      <td style={{ padding: '12px 8px', fontFamily: 'monospace' }}>{log.batchNumber}</td>
                      <td style={{ padding: '12px 8px', color: log.expiryStatus === 'expired' ? 'var(--danger-hover)' : (log.expiryStatus === 'soon' ? 'var(--warning-hover)' : 'inherit'), fontWeight: log.expiryStatus !== 'valid' ? '700' : 'normal' }}>
                        {log.expiryDate}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`pill-badge ${log.matchStatus === 'correct' ? 'green' : (log.matchStatus === 'needs_review' ? 'warning' : 'red')}`} style={{ fontSize: '0.7rem' }}>
                          {log.matchStatus === 'correct' ? 'MATCHED' : (log.matchStatus === 'needs_review' ? 'MISMATCH' : 'WARNING')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
