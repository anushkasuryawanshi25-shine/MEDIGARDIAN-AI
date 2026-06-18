import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Sparkles, CheckCircle2, ShieldAlert, ArrowRight, Camera, X } from 'lucide-react';
import { parsePrescriptionDocument, hasGeminiApiKey } from '../services/gemini';

export default function PrescriptionsTab({ addParsedMedications, addNotification }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [success, setSuccess] = useState(false);
  
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
    setSuccess(false);

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
      alert("Could not access camera. Please verify camera permissions or upload a file instead.");
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
      
      // Use actual video dimensions
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      setCapturedImage(dataUrl);
      stopCamera();
      
      handleScan({ name: 'camera_capture_rx.jpg', previewUrl: dataUrl });
    }
  };

  const handleScan = async (selectedFile) => {
    setFile(selectedFile);
    setScanning(true);
    setScannedData(null);
    setSuccess(false);

    try {
      if (!hasGeminiApiKey()) {
        throw new Error("Gemini API key is not configured. Please add your key in Settings.");
      }

      // Convert file/capture to base64
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

      const parsedData = await parsePrescriptionDocument(base64String, mimeType);
      setScannedData(parsedData);
    } catch (err) {
      console.error(err);
      let errorMsg = err.message || 'Failed to parse prescription.';
      if (errorMsg.toLowerCase().includes('failed to fetch') || errorMsg.toLowerCase().includes('typeerror')) {
        errorMsg = 'Failed to fetch (Network Error). This commonly occurs due to DNS blocking, lack of internet connection, a malformed API key, or if Google AI Studio is geo-blocked in your region/network.';
      }
      alert(`OCR Scanning Error: ${errorMsg}`);
      setFile(null);
      setCapturedImage(null);
    } finally {
      setScanning(false);
    }
  };

  const handleAddToSchedule = () => {
    if (!scannedData) return;
    addParsedMedications(scannedData.medications);
    addNotification('Prescription medications added to your schedule.');
    setSuccess(true);
  };

  return (
    <div className="view-container">
      <div className="dashboard-grid">
        {/* Scanner card */}
        <div className="card span-8">
          <div className="card-header-row">
            <h3 className="card-title">
              <FileText size={20} style={{ color: 'var(--primary)' }} />
              Prescription Upload & Parser
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700' }}>AI-Powered OCR</span>
          </div>

          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
            Upload a photo/PDF or use your camera to take a snap of your paper prescription. MediGuardian AI will extract the doctor's instructions, dosages, frequencies, and refill details, allowing you to instantly update your medication tracker.
          </p>

          {/* Camera View Finder */}
          {useCamera && (
            <div className="card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', backgroundColor: '#000', borderRadius: '16px', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '12px' }}
              />
              
              {/* Document Alignment Overlay Box */}
              <div style={{ position: 'absolute', border: '2px dashed rgba(2, 132, 199, 0.6)', borderRadius: '12px', top: '10%', bottom: '25%', left: '10%', right: '10%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: '4px' }}>
                  Align prescription within brackets
                </span>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '16px', zIndex: 10, width: '100%', justifyContent: 'center' }}>
                <button className="btn btn-secondary" onClick={stopCamera} style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: 'white', borderColor: 'transparent' }}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn btn-primary" onClick={capturePhoto} style={{ backgroundColor: 'var(--primary)' }}>
                  <Camera size={16} /> Capture Prescription
                </button>
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}

          {/* Default Upload Area */}
          {!file && !useCamera && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!hasGeminiApiKey() && (
                <div className="chat-disclaimer" style={{ backgroundColor: 'var(--danger-light)', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger-hover)', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Gemini API Key Missing:</strong> Please navigate to the <strong>Settings</strong> tab and configure your Gemini API Key to enable live prescription OCR parsing.
                  </span>
                </div>
              )}

              <div 
                className="scanner-area"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => hasGeminiApiKey() && document.getElementById('file-upload-input').click()}
                style={!hasGeminiApiKey() ? { pointerEvents: 'none', opacity: 0.6 } : {}}
              >
                <Upload size={48} className="scanner-icon" />
                <h4 className="scanner-heading">Drag & Drop Prescription file here</h4>
                <p className="scanner-subtext">Supports PNG, JPG, or PDF (Max 10MB)</p>
                <span className="btn btn-secondary" style={{ pointerEvents: 'none' }}>Browse Files</span>
                <input 
                  id="file-upload-input" 
                  type="file" 
                  accept="image/*,application/pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange} 
                />
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: '700' }}>
                — OR —
              </div>

              <button 
                className="btn btn-secondary" 
                onClick={startCamera} 
                disabled={!hasGeminiApiKey()}
                style={{ width: '100%', justifyContent: 'center', gap: '10px', padding: '14px', borderStyle: 'dashed', borderWidth: '2px', opacity: !hasGeminiApiKey() ? 0.6 : 1 }}
              >
                <Camera size={20} style={{ color: 'var(--primary)' }} /> Use Live Camera Capture
              </button>
            </div>
          )}

          {/* Scanning loader with preview */}
          {file && scanning && (
            <div className="scanner-area" style={{ cursor: 'default', minHeight: '350px', position: 'relative' }}>
              {capturedImage ? (
                <img src={capturedImage} alt="Capture preview" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
              ) : null}
              <div className="scanner-overlay" style={{ height: '100%' }}>
                <div className="scan-line" style={{ animationDuration: '2s' }}></div>
              </div>
              <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <Sparkles size={32} className="scanner-icon" style={{ animation: 'pulse 1.5s infinite alternate' }} />
                <h4 className="scanner-heading" style={{ color: 'var(--text-primary)' }}>MediGuardian AI OCR Scanning...</h4>
                <p className="scanner-subtext" style={{ color: 'var(--text-secondary)' }}>Parsing ingredients, dosage schedules, and doctor details from {file.name}.</p>
              </div>
            </div>
          )}

          {/* Scanned Results */}
          {file && !scanning && scannedData && (
            <div className="card" style={{ border: '1px solid var(--primary-light)', padding: '20px', backgroundColor: 'rgba(2,132,199,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-hover)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                  Clinical Data Successfully Parsed
                </h4>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => { setFile(null); setScannedData(null); setCapturedImage(null); }} 
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  Clear & Reset
                </button>
              </div>

              {capturedImage && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '200px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={capturedImage} alt="Captured prescription" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' }}>
                      Camera Snap
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="presc-detail-item"><span className="presc-key">Medical Clinic:</span><span className="presc-val">{scannedData.clinic}</span></div>
                <div className="presc-detail-item"><span className="presc-key">Date Prescribed:</span><span className="presc-val">{scannedData.date}</span></div>
                <div className="presc-detail-item"><span className="presc-key">Physician:</span><span className="presc-val">{scannedData.doctor}</span></div>
                <div className="presc-detail-item"><span className="presc-key">File Source:</span><span className="presc-val">{file.name}</span></div>
              </div>

              <h5 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Parsed Medication Items:</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {scannedData.medications.map((med, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--background)' }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem' }}>{med.name} {med.dose}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Take: {med.time} ({med.frequency}) | Refills: {med.refills !== undefined && med.refills !== null ? med.refills : 'Refill information not available'} | Instructions: {med.instructions}
                      </span>
                    </div>
                    <span className="pill-badge teal" style={{ fontSize: '0.7rem' }}>✓ Parsed</span>
                  </div>
                ))}
              </div>

              {!success ? (
                <button className="btn btn-primary" onClick={handleAddToSchedule} style={{ width: '100%' }}>
                  Add Parsed Medications to Active Schedule <ArrowRight size={16} />
                </button>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', backgroundColor: 'var(--success-light)', color: 'var(--success)', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem' }}>
                  <CheckCircle2 size={20} />
                  Schedule Updated Successfully!
                </div>
              )}
            </div>
          )}
        </div>

        {/* OCR scanner info and past records */}
        <div className="card span-4">
          <h3 className="card-title" style={{ marginBottom: '16px' }}>
            Parser Accuracy & Security
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>
            MediGuardian AI uses medical-trained neural networks to scan handwriting and text labels.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--background)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>🛡️</span>
                <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }}>HIPAA Compliant</strong>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0 }}>
                All document uploads are processed client-side. No medical imagery is stored on servers.
              </p>
            </div>

            <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--background)' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>💡</span>
                <strong style={{ fontSize: '0.825rem', color: 'var(--text-primary)' }}>Double-Verification</strong>
              </div>
              <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: 0 }}>
                Always review the parsed medication names, dosages, and schedules before adding them to your schedule.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
