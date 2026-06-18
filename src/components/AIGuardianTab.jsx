import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ShieldCheck, Stethoscope, AlertCircle, Info, Mic, MicOff, Search, Trash2, HelpCircle, Type, User } from 'lucide-react';
import { askGeminiChat, hasGeminiApiKey } from '../services/gemini';
import { useAuth } from '../context/AuthContext';

export default function AIGuardianTab({ medications, patientInfo, vitalsLog, verificationHistory = [] }) {
  const { currentUser } = useAuth();
  const userEmail = currentUser?.email || 'guest';
  const storageKey = `mediguardian_chat_${userEmail}`;

  // Initial greeting message
  const getInitialMessage = () => ({
    id: 'initial',
    sender: 'bot',
    text: "Hello! I am MediGuardian AI, your virtual medication assistant. You can ask me questions about your current prescription drugs, possible side effects, usage guidelines, or general wellness advice.",
    timestamp: new Date().toISOString()
  });

  // States
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState('general');
  const [largeText, setLargeText] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Load chat history from localStorage on mount/user change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([getInitialMessage()]);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
      setMessages([getInitialMessage()]);
    }
  }, [userEmail]);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error("Failed to save chat history:", e);
      }
    }
  }, [messages, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 15 FAQ Questions
  const faqQuestions = [
    "What is this medicine used for?",
    "When should I take this medicine?",
    "Should I take it before or after food?",
    "What should I do if I miss a dose?",
    "Can I take this medicine with other prescribed medicines?",
    "What are the common side effects?",
    "How long should I continue this medicine?",
    "What precautions should I follow?",
    "Can I take this medicine if I have high blood pressure or diabetes?",
    "What happens if I accidentally skip a dose?",
    "Can I take this medicine with milk, tea, coffee, or food?",
    "What lifestyle changes should I follow while taking this medicine?",
    "How important is it to take this medicine on time?",
    "Why did my doctor prescribe this medicine?",
    "Is this medicine available in another form?"
  ];

  // Helper to get active medicine selected
  const getSelectedMedicine = () => {
    if (selectedMedId === 'general') return null;
    return medications.find(m => m.id.toString() === selectedMedId.toString());
  };

  const activeMed = getSelectedMedicine();

  // Clear chat history
  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your conversation history?")) {
      const initial = [getInitialMessage()];
      setMessages(initial);
      localStorage.setItem(storageKey, JSON.stringify(initial));
    }
  };

  // Trigger voice recognition
  const toggleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.lang = 'en-US';
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecording(true);
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInputText(transcript);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Handle send prompt
  const handleSend = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString()
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    try {
      if (!hasGeminiApiKey()) {
        throw new Error("Gemini API key is not configured. Please add your key in Settings.");
      }

      // Build context
      const context = {
        medications,
        patientInfo,
        vitalsLog,
        verificationHistory
      };

      const responseText = await askGeminiChat(updated, context);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date().toISOString(),
        isMedical: true
      }]);
    } catch (err) {
      console.error(err);
      let errorMsg = err.message || 'Failed to connect to Gemini API.';
      if (errorMsg.toLowerCase().includes('failed to fetch')) {
        errorMsg = 'Failed to fetch (Network Error). This commonly occurs due to DNS blocking, lack of internet connection, or if Google AI Studio is geo-blocked in your region.';
      }
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `⚠️ Error: ${errorMsg}`,
        timestamp: new Date().toISOString(),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // FAQ Card click triggers contextual query
  const handleFaqClick = (questionText) => {
    let finalQuery = questionText;
    if (activeMed) {
      // Personalize the question for active medicine
      if (questionText.toLowerCase().includes("this medicine")) {
        finalQuery = questionText.replace(/this medicine/gi, activeMed.name);
      } else {
        finalQuery = `${questionText} (Regarding my prescribed medication ${activeMed.name} ${activeMed.dose})`;
      }
    } else {
      // General question
      if (questionText.toLowerCase().includes("this medicine")) {
        finalQuery = questionText.replace(/this medicine/gi, "my medications");
      }
    }
    handleSend(finalQuery);
  };

  // Quick Action Chips
  const quickChips = [
    { label: "What is this medicine for?", action: (med) => med ? `What is ${med.name} used for?` : "What are my prescribed medicines used for?" },
    { label: "Side effects", action: (med) => med ? `What are the common side effects of ${med.name}?` : "What are the common side effects of my prescribed medicines?" },
    { label: "Missed dose guidance", action: (med) => med ? `What should I do if I miss a dose of ${med.name}?` : "What should I do if I miss a dose of my prescribed medicines?" },
    { label: "When should I take it?", action: (med) => med ? `When should I take ${med.name} according to my prescription?` : "What is the recommended schedule for taking my prescribed medicines?" },
    { label: "Food instructions", action: (med) => med ? `Should I take ${med.name} before or after food? Can I take it with milk or tea?` : "Are there any food or drink guidelines for my prescribed medications?" },
    { label: "Precautions", action: (med) => med ? `What precautions should I follow while taking ${med.name}?` : "What precautions should I follow while taking my prescribed medicines?" },
    { label: "Doctor recommendations", action: (med) => med ? `Why did my doctor prescribe ${med.name} and what lifestyle changes should I follow?` : "Why did my doctor prescribe these medications and what lifestyle changes should I follow?" }
  ];

  // Filter messages based on search query
  const filteredMessages = messages.filter(msg => 
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="view-container">
      {/* Elderly mode large text class applied to sub-containers */}
      <div className={`dashboard-grid ${largeText ? 'elderly-font' : ''}`} style={{ transition: 'font-size 0.2s ease-in-out' }}>
        
        {/* Top Controls: Dropdown, Search, Resizer */}
        <div className="card span-12" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: largeText ? '1.1rem' : '0.875rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Medication Context:</span>
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-dark)',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-primary)',
                fontSize: largeText ? '1.1rem' : '0.875rem',
                fontWeight: '600',
                outline: 'none',
                minWidth: '220px'
              }}
            >
              <option value="general">🌐 General Guidance (All Meds)</option>
              {medications.map(med => (
                <option key={med.id} value={med.id}>💊 {med.name} {med.dose} ({med.time})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '200px', maxWidth: '300px', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-dark)',
                  fontSize: largeText ? '1.1rem' : '0.85rem',
                  outline: 'none',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            {/* Large Text Switcher */}
            <button
              onClick={() => setLargeText(!largeText)}
              className={`btn ${largeText ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', gap: '8px', fontSize: largeText ? '1.1rem' : '0.85rem' }}
              title="Toggle Large Text for Elderly Patients"
            >
              <Type size={16} />
              {largeText ? "Normal Text" : "Elderly Large Text"}
            </button>
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="card span-12" style={{ backgroundColor: 'var(--danger-light)', borderLeft: '5px solid var(--danger-hover)', padding: '14px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--danger-hover)', flexShrink: 0 }} />
          <span style={{ fontSize: largeText ? '1.1rem' : '0.85rem', color: 'var(--text-primary)', fontWeight: '600', lineHeight: '1.4' }}>
            <strong>Patient Safety Rule:</strong> This information is for educational purposes and does not replace professional medical advice. Always consult your attending doctor (e.g. {patientInfo?.doctor || 'your physician'}) for serious symptoms or changes in doses.
          </span>
        </div>

        {/* Dedicated FAQ Section */}
        <div className="card span-12" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <HelpCircle size={18} style={{ color: 'var(--primary)' }} />
            <h4 style={{ margin: 0, fontSize: largeText ? '1.25rem' : '0.95rem', fontWeight: '800' }}>Frequently Asked Medication Questions</h4>
          </div>
          
          <div 
            className="faq-container-grid" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: '10px', 
              maxHeight: '180px', 
              overflowY: 'auto', 
              paddingRight: '6px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px'
            }}
          >
            {faqQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleFaqClick(q)}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--background)',
                  color: 'var(--text-primary)',
                  fontSize: largeText ? '1.05rem' : '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  lineHeight: '1.3'
                }}
                className="faq-item-button"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
              >
                ❓ {q}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat Assistant Interface */}
        <div className="card span-12" style={{ display: 'flex', flexDirection: 'column', height: '520px', padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
          
          {/* Chat Panel Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              <div>
                <strong style={{ display: 'block', fontSize: largeText ? '1.2rem' : '0.95rem' }}>MediGuardian AI Assistant</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Connected to Patient Dashboard, Rx Scanner & Health Passport</span>
              </div>
            </div>
            <button
              onClick={handleClearHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--danger-hover)',
                cursor: 'pointer',
                fontSize: largeText ? '1.1rem' : '0.8rem',
                fontWeight: '700'
              }}
              title="Reset Chat History"
            >
              <Trash2 size={16} /> Reset Chat
            </button>
          </div>

          {/* Chat Messages Log */}
          <div 
            style={{ 
              flex: 1, 
              padding: '20px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            {filteredMessages.length === 0 && searchQuery && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: largeText ? '1.1rem' : '0.9rem' }}>
                No messages matches "{searchQuery}" in this conversation history.
              </div>
            )}
            
            {filteredMessages.map((msg) => (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: largeText ? '16px 22px' : '12px 18px',
                    borderRadius: '16px',
                    borderTopRightRadius: msg.sender === 'user' ? '4px' : '16px',
                    borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                    backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--background)',
                    color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    border: msg.sender === 'bot' ? '1px solid var(--border)' : 'none',
                    fontSize: largeText ? '1.2rem' : '0.95rem',
                    lineHeight: largeText ? '1.6' : '1.5'
                  }}
                >
                  {/* Sender Name */}
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', fontSize: '0.75rem', opacity: 0.8, fontWeight: '700' }}>
                    {msg.sender === 'user' ? (
                      <>
                        <User size={12} />
                        <span>You (Patient)</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                        <span>MediGuardian AI</span>
                      </>
                    )}
                  </div>

                  {/* Message Text */}
                  {msg.text.split('\n').map((para, idx) => (
                    <p key={idx} style={{ margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>
                      {para}
                    </p>
                  ))}

                  {/* Safety Warning attached to medical answers */}
                  {msg.isMedical && (
                    <div style={{ 
                      marginTop: '12px', 
                      paddingTop: '8px', 
                      borderTop: '1px solid var(--border)', 
                      fontSize: largeText ? '0.95rem' : '0.75rem', 
                      color: 'var(--text-muted)',
                      fontStyle: 'italic'
                    }}>
                      * Educational guidance. Always confirm dosage instructions with Dr. {patientInfo?.doctor || 'Sarah Jenkins'}.
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '16px',
                    borderTopLeftRadius: '4px',
                    backgroundColor: 'var(--background)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    fontSize: largeText ? '1.1rem' : '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>MediGuardian AI is thinking</span>
                  <span className="dot" style={{ animation: 'pulseGlow 1.5s infinite', display: 'inline-block' }}>●</span>
                  <span className="dot" style={{ animation: 'pulseGlow 1.5s infinite 0.3s', display: 'inline-block' }}>●</span>
                  <span className="dot" style={{ animation: 'pulseGlow 1.5s infinite 0.6s', display: 'inline-block' }}>●</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips Bar */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '8px', 
              padding: '10px 16px', 
              overflowX: 'auto', 
              whiteSpace: 'nowrap', 
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              scrollbarWidth: 'none'
            }}
          >
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.action(activeMed))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid var(--primary)',
                  backgroundColor: 'transparent',
                  color: 'var(--primary)',
                  fontSize: largeText ? '1.05rem' : '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                ✨ {chip.label}
              </button>
            ))}
          </div>

          {/* Input Panel with Speech-to-Text */}
          <div style={{ display: 'flex', gap: '10px', padding: '14px 16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--background)', alignItems: 'center' }}>
            
            {/* Voice Input Button */}
            <button
              onClick={toggleVoiceInput}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: isRecording ? 'var(--danger-hover)' : 'var(--border)',
                color: isRecording ? 'white' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: isRecording ? '0 0 10px var(--danger-hover)' : 'none',
                flexShrink: 0
              }}
              title={isRecording ? "Listening... Click to Stop" : "Voice Input (Speech-to-Text)"}
            >
              {isRecording ? <MicOff size={20} style={{ animation: 'pulse 1s infinite alternate' }} /> : <Mic size={20} />}
            </button>

            <input
              type="text"
              placeholder={hasGeminiApiKey() ? "Ask about side effects, schedules, drug interactions..." : "Configure Gemini API Key in Settings to chat..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={isTyping || !hasGeminiApiKey()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '24px',
                border: '1px solid var(--border-dark)',
                outline: 'none',
                fontSize: largeText ? '1.2rem' : '0.95rem',
                backgroundColor: 'var(--card-bg)',
                color: 'var(--text-primary)'
              }}
            />

            <button 
              onClick={() => handleSend()}
              disabled={isTyping || !hasGeminiApiKey() || !inputText.trim()}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: (isTyping || !hasGeminiApiKey() || !inputText.trim()) ? 0.5 : 1,
                transition: 'opacity 0.2s',
                flexShrink: 0
              }}
              title="Send Message"
            >
              <Send size={18} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
