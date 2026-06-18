// Web Audio API and Web Speech API Synthesizer for Clinical Reminders

export function playTone(toneType = 'Hospital Chime', volume = 0.5) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const gainNode = audioCtx.createGain();
    
    // Scale volume (0 to 1 range)
    gainNode.gain.setValueAtTime(0, now);
    
    if (toneType === 'Hospital Chime') {
      // Gentle double sine bell chime
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.15); // Slide up to C6
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now); // E5
      
      gainNode.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.8);
      osc2.stop(now + 0.8);
    } else if (toneType === 'Pager Buzz') {
      // Sawtooth triple pulse buzzer
      const osc = audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now); // Low buzz tone
      
      // Pulse sequence
      gainNode.gain.linearRampToValueAtTime(volume * 0.3, now + 0.02);
      gainNode.gain.setValueAtTime(0, now + 0.18);
      
      gainNode.gain.setValueAtTime(volume * 0.3, now + 0.22);
      gainNode.gain.setValueAtTime(0, now + 0.38);
      
      gainNode.gain.setValueAtTime(volume * 0.3, now + 0.42);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (toneType === 'Pulse Alert') {
      // Rhythmic soft triangle-wave pulse
      const osc = audioCtx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now); // E4 tone
      
      gainNode.gain.linearRampToValueAtTime(volume * 0.5, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.error("Web Audio API not supported on this browser:", e);
  }
}

export function speakReminderText(text) {
  try {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speeches first
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 1;
      utterance.rate = 0.9; // Slightly slower for clear elderly listening
      utterance.pitch = 1.05;
      
      // Speak
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.error("Speech Synthesis not supported:", e);
  }
}

export function playSuccessSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, now);
    
    // Play a happy major arpeggio chime (C4, E4, G4, C5)
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      const noteGain = audioCtx.createGain();
      noteGain.gain.setValueAtTime(0, now + idx * 0.1);
      noteGain.gain.linearRampToValueAtTime(0.15, now + idx * 0.1 + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
      
      osc.connect(noteGain);
      noteGain.connect(gainNode);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.45);
    });
    
    gainNode.gain.setValueAtTime(1, now);
    gainNode.connect(audioCtx.destination);
  } catch (e) {
    console.error("Failed to play success sound:", e);
  }
}
