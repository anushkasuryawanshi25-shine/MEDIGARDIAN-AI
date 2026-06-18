import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import OverviewTab from './OverviewTab';
import MedicationsTab from './MedicationsTab';
import AIGuardianTab from './AIGuardianTab';
import VitalsTab from './VitalsTab';
import PrescriptionsTab from './PrescriptionsTab';
import SettingsTab from './SettingsTab';
import HealthPassportTab from './HealthPassportTab';
import FamilyCareTab from './FamilyCareTab';
import ClinicianPortalTab from './ClinicianPortalTab';
import GamificationTab from './GamificationTab';
import VerificationTab from './VerificationTab';
import { useAuth } from '../context/AuthContext';
import { loadPatientData, savePatientData, fetchFirebasePatientData } from '../services/db';
import { playTone, speakReminderText, playSuccessSound } from '../services/audio';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Realistic Default Patient Profile
  const [patientInfo, setPatientInfo] = useState({
    name: currentUser?.name || currentUser?.username || 'Arthur Pendelton',
    email: currentUser?.email || 'arthur.pendelton@mg-health.org',
    provider: currentUser?.provider || 'Email Login',
    age: 58,
    doctor: 'Dr. Sarah Jenkins',
    emergencyContact: '+1 (555) 382-9102',
    bloodType: 'B+',
    height: 178, // in cm
    weight: 82.5, // in kg
  });

  const [notifications, setNotifications] = useState([]);
  const [healthReports, setHealthReports] = useState([]);
  const [medications, setMedications] = useState([]);
  const [vitalsLog, setVitalsLog] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [caregiverAlerts, setCaregiverAlerts] = useState([]);

  // Smart Reminder Engine & Gamification states
  const [gamificationPoints, setGamificationPoints] = useState(120);
  const [gamificationStreaks, setGamificationStreaks] = useState({ current: 3, longest: 7, lastCheckDate: '2026-06-17' });
  const [gamificationBadges, setGamificationBadges] = useState(['FIRST_DOSE_CHAMPION']);
  const [gamificationLevel, setGamificationLevel] = useState(1);
  const [gamificationChallenges, setGamificationChallenges] = useState([
    { id: 'daily_all_meds', text: 'Take all medicines on time today', completed: false, type: 'daily', points: 25 },
    { id: 'daily_bp', text: 'Log your blood pressure reading', completed: false, type: 'daily', points: 15 },
    { id: 'daily_profile', text: 'Complete your health profile setup', completed: false, type: 'daily', points: 50 },
    { id: 'daily_diet', text: "Follow doctor's diet recommendations", completed: false, type: 'daily', points: 10 },
    { id: 'weekly_streak', text: 'Maintain a 7-day adherence streak', completed: false, type: 'weekly', points: 100 },
    { id: 'monthly_adherence', text: 'Maintain monthly adherence above 90%', completed: false, type: 'monthly', points: 200 }
  ]);
  const [gamificationEncouragements, setGamificationEncouragements] = useState([
    { id: 1, from: 'Emily Caregiver', message: 'You are doing great! Keep up the consistency!', date: 'Today' }
  ]);
  const [unlockedBadgeModal, setUnlockedBadgeModal] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [settings, setSettings] = useState({
    alarmVolume: 80,
    reminderTone: 'Hospital Chime',
    snoozeInterval: 15,
    vibrationEnabled: true,
    voiceEnabled: false,
    elderlyMode: false
  });
  const [medicationHistory, setMedicationHistory] = useState([]);
  const [verificationHistory, setVerificationHistory] = useState([]);
  
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [snoozeQueue, setSnoozeQueue] = useState({});
  const [virtualTimeOffset, setVirtualTimeOffset] = useState(0);
  const [triggeredAlarmsToday, setTriggeredAlarmsToday] = useState([]);

  // Request Notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Load patient data from LocalStorage on mount/user change
  useEffect(() => {
    if (currentUser) {
      const data = loadPatientData(currentUser.email);
      if (data) {
        const localPatient = data.patientInfo || {};
        setPatientInfo({
          name: localPatient.name || currentUser.name || currentUser.username || currentUser.email,
          email: localPatient.email || currentUser.email,
          provider: localPatient.provider || currentUser.provider || 'Email Login',
          age: localPatient.age || 45,
          doctor: localPatient.doctor || 'Dr. Sarah Jenkins',
          emergencyContact: localPatient.emergencyContact || '',
          bloodType: localPatient.bloodType || 'O+',
          height: localPatient.height || 170,
          weight: localPatient.weight || 70
        });
        setMedications(data.medications || []);
        setVitalsLog(data.vitalsLog || []);
        setFamilyMembers(data.familyMembers || []);
        setCaregiverAlerts(data.caregiverAlerts || []);
        setHealthReports(data.healthReports || []);
        setNotifications(data.notifications || []);
        
        setGamificationPoints(data.gamificationPoints ?? 120);
        setGamificationStreaks(data.gamificationStreaks || { current: 3, longest: 7, lastCheckDate: '2026-06-17' });
        setGamificationBadges(data.gamificationBadges || ['FIRST_DOSE_CHAMPION']);
        setGamificationLevel(data.gamificationLevel || 1);
        setGamificationChallenges(data.gamificationChallenges || [
          { id: 'daily_all_meds', text: 'Take all medicines on time today', completed: false, type: 'daily', points: 25 },
          { id: 'daily_bp', text: 'Log your blood pressure reading', completed: false, type: 'daily', points: 15 },
          { id: 'daily_profile', text: 'Complete your health profile setup', completed: false, type: 'daily', points: 50 },
          { id: 'daily_diet', text: "Follow doctor's diet recommendations", completed: false, type: 'daily', points: 10 },
          { id: 'weekly_streak', text: 'Maintain a 7-day adherence streak', completed: false, type: 'weekly', points: 100 },
          { id: 'monthly_adherence', text: 'Maintain monthly adherence above 90%', completed: false, type: 'monthly', points: 200 }
        ]);
        setGamificationEncouragements(data.gamificationEncouragements || [
          { id: 1, from: 'Emily Caregiver', message: 'You are doing great! Keep up the consistency!', date: 'Today' }
        ]);
        
        const loadedSettings = data.settings || localPatient.settings || {
          alarmVolume: 80,
          reminderTone: 'Hospital Chime',
          snoozeInterval: 15,
          vibrationEnabled: true,
          voiceEnabled: false,
          elderlyMode: false
        };
        setSettings(loadedSettings);
        setMedicationHistory(data.medicationHistory || []);
        setVerificationHistory(data.verificationHistory || []);
      }

      // Async sync from Firebase if config exists
      async function syncFromFirebase() {
        try {
          const configStr = localStorage.getItem('mediguardian_firebase_config');
          if (configStr) {
            const fbData = await fetchFirebasePatientData(currentUser.email);
            if (fbData) {
              setMedications(fbData.medications || []);
              setVitalsLog(fbData.vitalsLog || []);
              setFamilyMembers(fbData.familyMembers || []);
              setCaregiverAlerts(fbData.caregiverAlerts || []);
              setHealthReports(fbData.healthReports || []);
              setNotifications(prev => ['🔄 Synchronized schedules from Firebase Cloud Storage!', ...prev]);
              setGamificationPoints(fbData.gamificationPoints ?? 120);
              setGamificationStreaks(fbData.gamificationStreaks || { current: 3, longest: 7, lastCheckDate: '2026-06-17' });
              setGamificationBadges(fbData.gamificationBadges || ['FIRST_DOSE_CHAMPION']);
              setGamificationLevel(fbData.gamificationLevel || 1);
              setGamificationChallenges(fbData.gamificationChallenges || []);
              setGamificationEncouragements(fbData.gamificationEncouragements || []);
              if (fbData.settings) {
                setSettings(fbData.settings);
              }
              setMedicationHistory(fbData.medicationHistory || []);
              setVerificationHistory(fbData.verificationHistory || []);
            }
          }
        } catch (e) {
          console.error("Firebase fetch sync failed:", e);
        }
      }
      syncFromFirebase();
    }
  }, [currentUser]);

  // Auto-save changes back to LocalStorage whenever state changes
  useEffect(() => {
    if (currentUser) {
      const data = {
        patientInfo: {
          ...patientInfo,
          settings: settings // Sync inside patientInfo for SettingsTab
        },
        medications,
        vitalsLog,
        familyMembers,
        caregiverAlerts,
        healthReports,
        notifications,
        gamificationPoints,
        gamificationStreaks,
        gamificationBadges,
        gamificationLevel,
        gamificationChallenges,
        gamificationEncouragements,
        settings,
        medicationHistory,
        verificationHistory
      };
      savePatientData(currentUser.email, data);
    }
  }, [patientInfo, medications, vitalsLog, familyMembers, caregiverAlerts, healthReports, notifications, gamificationPoints, gamificationStreaks, gamificationBadges, gamificationLevel, gamificationChallenges, gamificationEncouragements, settings, medicationHistory, verificationHistory]);
  const calculateLevelFromPoints = (pts) => {
    if (pts >= 4001) return 6;
    if (pts >= 2001) return 5;
    if (pts >= 1001) return 4;
    if (pts >= 501) return 3;
    if (pts >= 201) return 2;
    return 1;
  };

  const triggerPointsAward = (pointsToAdd, reason) => {
    setGamificationPoints(prevPoints => {
      const newPoints = prevPoints + pointsToAdd;
      addNotification(`🏆 Earned +${pointsToAdd} Health Points: ${reason}`);
      
      const newLvl = calculateLevelFromPoints(newPoints);
      setGamificationLevel(prevLvl => {
        if (newLvl > prevLvl) {
          playSuccessSound();
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
          
          const lvlNames = {
            2: 'Health Explorer',
            3: 'Health Achiever',
            4: 'Health Guardian',
            5: 'Health Champion',
            6: 'Health Master'
          };
          
          setUnlockedBadgeModal({
            id: `LEVEL_${newLvl}`,
            name: `Level Up: ${lvlNames[newLvl]}`,
            emoji: '🎉',
            desc: `Congratulations! You reached Level ${newLvl} by earning ${newPoints} total health points.`
          });
        }
        return newLvl;
      });
      
      return newPoints;
    });
  };

  const checkBadgeMilestones = (newPoints, currentStreaks, activeMedications, currentVitalsLog, currentBadges) => {
    const newlyUnlocked = [];

    const unlockBadge = (badgeId, badgeName, emoji, desc) => {
      if (!currentBadges.includes(badgeId)) {
        newlyUnlocked.push(badgeId);
        playSuccessSound();
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        setUnlockedBadgeModal({ id: badgeId, name: badgeName, emoji, desc });
      }
    };

    // 1. First Dose Champion: 3 days of adherence (medicationHistory has 3+ taken logs)
    const takenLogsCount = medicationHistory.filter(h => h.status === 'taken').length;
    if (takenLogsCount >= 3) {
      unlockBadge('FIRST_DOSE_CHAMPION', 'First Dose Champion', '🥉', 'You successfully tracked and took your medications on time for 3 days.');
    }

    // 2. Consistency Star: 7-day streak
    if (currentStreaks?.current >= 7) {
      unlockBadge('CONSISTENCY_STAR', 'Consistency Star', '🥈', 'Amazing! You maintained a 7-day medication adherence streak.');
    }

    // 3. Medication Hero: 15-day streak
    if (currentStreaks?.current >= 15) {
      unlockBadge('MEDICATION_HERO', 'Medication Hero', '🥇', 'Excellent! You maintained a 15-day medication adherence streak.');
    }

    // 4. Medication Champion: 30-day streak
    if (currentStreaks?.current >= 30) {
      unlockBadge('MEDICATION_CHAMPION', 'Medication Champion', '🏆', 'Outstanding! You reached a 30-day medication adherence streak.');
    }

    // 5. Health Guardian: 60-day streak
    if (currentStreaks?.current >= 60) {
      unlockBadge('HEALTH_GUARDIAN', 'Health Guardian', '💎', 'Legendary! You reached a 60-day medication adherence streak.');
    }

    // 6. Health Master: 100-day streak
    if (currentStreaks?.current >= 100) {
      unlockBadge('HEALTH_MASTER', 'Health Master', '👑', 'Incredible! You reached a 100-day medication adherence streak.');
    }

    // 7. Health Tracker: 3+ vitals logs
    if (currentVitalsLog?.length >= 3) {
      unlockBadge('HEALTH_TRACKER', 'Health Tracker', '📋', 'You regularly updated your health logs in the Vitals Tracker.');
    }

    // 8. Report Expert: generated reports count >= 2
    if (healthReports?.length >= 2) {
      unlockBadge('REPORT_EXPERT', 'Report Expert', '📖', 'You successfully generated and reviewed multiple health digest reports.');
    }

    // 9. Wellness Warrior: Adherence Score >= 90%
    const rate = getAdherenceRate();
    if (rate >= 90 && activeMedications?.length >= 3) {
      unlockBadge('WELLNESS_WARRIOR', 'Wellness Warrior', '❤️', 'You maintained a high medication adherence score of 90% or above.');
    }

    if (newlyUnlocked.length > 0) {
      setGamificationBadges(prev => [...prev, ...newlyUnlocked]);
    }
  };

  // Run badge validation reactively
  useEffect(() => {
    if (currentUser) {
      checkBadgeMilestones(gamificationPoints, gamificationStreaks, medications, vitalsLog, gamificationBadges);
    }
  }, [gamificationPoints, gamificationStreaks, medications, vitalsLog, healthReports, currentUser]);

  // Daily login points on mount/user change
  useEffect(() => {
    if (currentUser) {
      const todayStr = new Date().toDateString();
      const lastLogin = localStorage.getItem(`mediguardian_last_login_${currentUser.email}`);
      if (lastLogin !== todayStr) {
        localStorage.setItem(`mediguardian_last_login_${currentUser.email}`, todayStr);
        setTimeout(() => {
          triggerPointsAward(5, "Daily login bonus");
        }, 2000);
      }
    }
  }, [currentUser]);
  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Add custom notification
  const addNotification = (text) => {
    setNotifications(prev => [text, ...prev]);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Add family member
  const addFamilyMember = (newMember) => {
    setFamilyMembers(prev => [
      ...prev,
      { ...newMember, id: Date.now() }
    ]);
  };

  // Trigger Emergency SOS Broadcast
  const triggerEmergencySOS = () => {
    const alertText = 'SOS: Emergency Caregiver Alert broadcasted. Missed readings check-in dispatched to family circle.';
    addNotification(alertText);
    
    const newAlert = { 
      id: Date.now(), 
      text: `SOS: Emergency Alert Broadcast Triggered by ${patientInfo.name}.`, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
      date: 'Today' 
    };
    setCaregiverAlerts(prev => [newAlert, ...prev]);
    alert(`🚨 Emergency broadcast alert dispatched to caregivers!`);
  };

  // Update medication status
  const updateMedicationStatus = (id, status) => {
    setMedications(prev => 
      prev.map(med => 
        med.id === id ? { ...med, status: status } : med
      )
    );

    const med = medications.find(m => m.id === id);
    if (med) {
      const virtualNow = new Date(Date.now() + virtualTimeOffset);
      const actionTimeStr = virtualNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Add to history
      const logEntry = {
        id: Date.now() + Math.random(),
        name: med.name,
        dose: med.dose,
        scheduledTime: med.time,
        actionTime: actionTimeStr,
        status: status,
        snoozeCount: med.snoozeCount || 0
      };
      setMedicationHistory(prev => [logEntry, ...prev]);

      if (status === 'taken') {
        addNotification(`Well done! Marked ${med.name} as TAKEN.`);
        triggerPointsAward(10, `Medication taken on time: ${med.name}`);
        
        // Evaluate daily completed schedule
        const otherPendingMeds = medications.filter(m => m.id !== id && (m.status === 'pending' || m.status === 'snoozed'));
        if (otherPendingMeds.length === 0) {
          triggerPointsAward(25, "Completed daily medication schedule!");
          
          setGamificationChallenges(prev => 
            prev.map(c => c.id === 'daily_all_meds' ? { ...c, completed: true } : c)
          );

          // Increment streak
          const todayStr = virtualNow.toDateString();
          if (gamificationStreaks.lastCheckDate !== todayStr) {
            setGamificationStreaks(prev => {
              const nextStreak = prev.current + 1;
              const longestStreak = Math.max(prev.longest, nextStreak);
              
              if (nextStreak === 7) {
                triggerPointsAward(100, "7-day weekly medication streak milestone!");
              }

              return {
                current: nextStreak,
                longest: longestStreak,
                lastCheckDate: todayStr
              };
            });
          }
        }
      } else if (status === 'missed') {
        addNotification(`Alert: Marked ${med.name} as MISSED.`);
        
        setGamificationPoints(prev => {
          const newPoints = Math.max(0, prev - 10);
          addNotification(`Missed medication penalty (-10 pts): ${med.name}`);
          return newPoints;
        });

        const missedTodayCount = medications.filter(m => m.status === 'missed').length + 1;
        if (missedTodayCount >= 2) {
          setGamificationPoints(prev => {
            const newPoints = Math.max(0, prev - 15);
            addNotification(`Repeated missed medication penalty (-25 pts total)`);
            return newPoints;
          });
        }
        
        setGamificationStreaks(prev => ({
          ...prev,
          current: 0
        }));

        const newAlert = {
          id: Date.now(),
          text: `${patientInfo.name} missed dose of ${med.name} ${med.dose}. SMS alert pushed to caregivers.`,
          time: actionTimeStr,
          date: 'Today'
        };
        setCaregiverAlerts(prev => [newAlert, ...prev]);
      } else if (status === 'snoozed') {
        addNotification(`Reminder: ${med.name} snoozed. Will remind you in ${settings.snoozeInterval || 15} minutes.`);
        
        // Add to snooze queue
        const snoozeIntervalMs = (settings.snoozeInterval || 15) * 60 * 1000;
        setSnoozeQueue(prev => ({
          ...prev,
          [id]: virtualNow.getTime() + snoozeIntervalMs
        }));
      } else {
        addNotification(`Reset ${med.name} reminder status.`);
      }
    }
  };

  // Add medication manually
  const addMedication = (newMed) => {
    setMedications(prev => [
      ...prev,
      {
        ...newMed,
        id: Date.now(),
        status: 'pending',
        snoozeCount: 0
      }
    ]);
    addNotification(`Added medication: ${newMed.name}`);
  };

  // Delete medication
  const deleteMedication = (id) => {
    const medToDelete = medications.find(m => m.id === id);
    setMedications(prev => prev.filter(med => med.id !== id));
    if (medToDelete) {
      addNotification(`Deleted medication: ${medToDelete.name}`);
    }
  };

  // Update specific medication fields (e.g. refills)
  const updateMedication = (id, updatedFields) => {
    setMedications(prev => 
      prev.map(med => 
        med.id === id ? { ...med, ...updatedFields } : med
      )
    );
  };

  // Add vital log
  const addVitalsLog = (newLog) => {
    setVitalsLog(prev => [...prev, newLog]);
    addNotification('Logged new vitals readings.');
    triggerPointsAward(15, "Logged vitals parameters");
    
    setGamificationChallenges(prev => 
      prev.map(c => c.id === 'daily_bp' ? { ...c, completed: true } : c)
    );
  };

  // Add parsed medications from Rx Scanner
  const addParsedMedications = (newMeds) => {
    setMedications(prev => {
      const existingNames = prev.map(m => m.name.toLowerCase());
      const filteredNewMeds = newMeds.filter(m => !existingNames.includes(m.name.toLowerCase()));
      
      const formattedNew = filteredNewMeds.map((m, index) => ({
        ...m,
        id: Date.now() + index,
        status: 'pending',
        snoozeCount: 0
      }));

      return [...prev, ...formattedNew];
    });
  };

  const handleSaveVerificationLog = (logEntry) => {
    setVerificationHistory(prev => [logEntry, ...prev]);
    triggerPointsAward(15, `Medicine Verified: ${logEntry.name} (${logEntry.brand || 'Scanned Label'})`);
  };

  // Update profile patient info
  const updatePatientInfo = (newInfo) => {
    setPatientInfo(newInfo);
    if (newInfo.settings) {
      setSettings(newInfo.settings);
    }
    
    // Complete profile setup challenge
    const isProfileChallengeCompleted = gamificationChallenges.find(c => c.id === 'daily_profile')?.completed;
    if (!isProfileChallengeCompleted) {
      triggerPointsAward(50, "Completed full health profile setup!");
      setGamificationChallenges(prev => 
        prev.map(c => c.id === 'daily_profile' ? { ...c, completed: true } : c)
      );
    }
  };

  // Calculate adherence rate
  const getAdherenceRate = () => {
    const total = medications.length;
    if (total === 0) return 100;
    const taken = medications.filter(m => m.status === 'taken').length;
    return Math.round((taken / total) * 100);
  };

  const adherenceRate = getAdherenceRate();

  // Trigger alarm alert and notification
  const triggerAlarm = (med) => {
    setActiveAlarm(med);
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification("Medication Due: " + med.name, {
          body: `Dose: ${med.dose}. Instructions: ${med.instructions || 'Take as directed'}`,
          icon: '/favicon.svg',
          tag: `med-${med.id}`,
          requireInteraction: true
        });
      } catch (e) {
        console.error("Failed to show browser notification:", e);
      }
    }
  };

  // Trigger test alarm immediately
  const triggerTestAlarm = (med = null) => {
    if (med) {
      triggerAlarm(med);
    } else {
      // Find a pending medication or fallback
      const fallbackMed = medications[0] || {
        id: 999,
        name: 'Metformin',
        dose: '500mg',
        time: 'Morning',
        instructions: 'Take with breakfast, avoid heavy alcohol (Test alarm triggered)',
        status: 'pending',
        snoozeCount: 0
      };
      triggerAlarm(fallbackMed);
    }
  };

  // Alarm sound / vibration / TTS looping logic
  useEffect(() => {
    if (!activeAlarm) return;

    const vol = (settings.alarmVolume ?? 80) / 100;
    const tone = settings.reminderTone ?? 'Hospital Chime';
    
    // Play immediately
    playTone(tone, vol);
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    if (settings.voiceEnabled || settings.elderlyMode) {
      speakReminderText(`Attention ${patientInfo.name}. It is time to take your medication: ${activeAlarm.name}, dose: ${activeAlarm.dose}. Instructions: ${activeAlarm.instructions || 'Take as directed'}.`);
    }

    const alarmInterval = setInterval(() => {
      playTone(tone, vol);
      if (settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }, 4000); // loop sound every 4 seconds

    return () => clearInterval(alarmInterval);
  }, [activeAlarm, settings, patientInfo.name]);

  // Clock engine for scheduler check
  const checkSchedule = (virtualNow) => {
    const currentHour = virtualNow.getHours();
    const currentMinute = virtualNow.getMinutes();
    const currentDayStr = virtualNow.toDateString();

    const nowMs = virtualNow.getTime();
    const updatedSnoozes = { ...snoozeQueue };
    let snoozeTriggered = null;

    // 1. Check snooze queue
    Object.entries(snoozeQueue).forEach(([medId, targetTimeMs]) => {
      if (nowMs >= targetTimeMs) {
        const med = medications.find(m => m.id === parseInt(medId));
        if (med && med.status === 'snoozed') {
          snoozeTriggered = med;
        }
        delete updatedSnoozes[medId];
      }
    });

    if (JSON.stringify(snoozeQueue) !== JSON.stringify(updatedSnoozes)) {
      setSnoozeQueue(updatedSnoozes);
    }

    if (snoozeTriggered) {
      triggerAlarm(snoozeTriggered);
      return;
    }

    // 2. Check scheduled times: Morning (9am), Afternoon (1pm), Evening (7pm), Night (9pm)
    const scheduleTimes = {
      'Morning': 9,
      'Afternoon': 13,
      'Evening': 19,
      'Night': 21
    };

    let newlyTriggered = null;
    Object.entries(scheduleTimes).forEach(([period, targetHour]) => {
      if (currentHour === targetHour && currentMinute === 0) {
        const triggerKey = `${currentDayStr}_${period}`;
        if (!triggeredAlarmsToday.includes(triggerKey)) {
          const pendingMeds = medications.filter(m => m.time === period && m.status === 'pending');
          if (pendingMeds.length > 0) {
            setTriggeredAlarmsToday(prev => [...prev, triggerKey]);
            newlyTriggered = pendingMeds[0];
          }
        }
      }
    });

    if (newlyTriggered) {
      triggerAlarm(newlyTriggered);
      return;
    }

    // 3. Missed detection (2 hours past scheduled hour)
    let stateChanged = false;
    const updatedMeds = medications.map(med => {
      if (med.status !== 'pending' && med.status !== 'snoozed') return med;

      const targetHour = scheduleTimes[med.time];
      if (targetHour !== undefined) {
        if (currentHour >= targetHour + 2) {
          stateChanged = true;
          const virtualTimeStr = virtualNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const alertText = `${patientInfo.name} missed dose of ${med.name} ${med.dose}. Caregiver notified.`;
          
          addNotification(`Missed Dose Alert: ${med.name} (${med.time})`);

          const newAlert = {
            id: Date.now() + Math.random(),
            text: alertText,
            time: virtualTimeStr,
            date: 'Today'
          };
          setCaregiverAlerts(prev => [newAlert, ...prev]);

          // Add to history
          const historyId = Date.now() + Math.random();
          setMedicationHistory(prev => [
            {
              id: historyId,
              name: med.name,
              dose: med.dose,
              scheduledTime: med.time,
              actionTime: virtualTimeStr,
              status: 'missed',
              snoozeCount: med.snoozeCount || 0
            },
            ...prev
          ]);

          return { ...med, status: 'missed' };
        }
      }
      return med;
    });

    if (stateChanged) {
      setMedications(updatedMeds);
    }
  };

  useEffect(() => {
    const clockInterval = setInterval(() => {
      const virtualNow = new Date(Date.now() + virtualTimeOffset);
      checkSchedule(virtualNow);
    }, 10000); // Check schedule every 10 seconds

    return () => clearInterval(clockInterval);
  }, [medications, virtualTimeOffset, snoozeQueue, triggeredAlarmsToday, settings, patientInfo.name]);

  // Populate Demo data for Hackathon presentation
  const triggerDemoMode = () => {
    const demoMedications = [
      { id: 1, name: 'Metformin', dose: '500mg', duration: '30 days', frequency: 'Daily', time: 'Morning', instructions: 'Take with breakfast, avoid heavy alcohol', refills: 2, doctor: 'Dr. Sarah Jenkins', status: 'taken', snoozeCount: 0 },
      { id: 2, name: 'Lisinopril', dose: '10mg', duration: '30 days', frequency: 'Daily', time: 'Morning', instructions: 'Take on empty stomach, monitor dizziness', refills: 1, doctor: 'Dr. Sarah Jenkins', status: 'missed', snoozeCount: 0 },
      { id: 3, name: 'Atorvastatin', dose: '20mg', duration: '90 days', frequency: 'Daily', time: 'Bedtime', instructions: 'Take in the evening, avoid eating grapefruits', refills: 4, doctor: 'Dr. Sarah Jenkins', status: 'taken', snoozeCount: 0 },
      { id: 4, name: 'Amoxicillin', dose: '250mg', duration: '10 days', frequency: 'Daily', time: 'Afternoon', instructions: 'Finish full 10-day antibiotic course', refills: 0, doctor: 'Dr. Robert Chen', status: 'snoozed', snoozeCount: 1 },
      { id: 5, name: 'Vitamin D3', dose: '2000 IU', duration: '30 days', frequency: 'Daily', time: 'Morning', instructions: 'Take with fat-containing meal', refills: null, doctor: 'Dr. Sarah Jenkins', status: 'taken', snoozeCount: 0 }
    ];
    
    const demoVitals = [
      { date: '06/10', bpSystolic: 128, bpDiastolic: 84, heartRate: 74, glucose: 106, weight: 82.8, sleep: 6.5 },
      { date: '06/11', bpSystolic: 126, bpDiastolic: 82, heartRate: 72, glucose: 102, weight: 82.7, sleep: 7 },
      { date: '06/12', bpSystolic: 124, bpDiastolic: 81, heartRate: 70, glucose: 99, weight: 82.6, sleep: 7.5 },
      { date: '06/13', bpSystolic: 135, bpDiastolic: 89, heartRate: 82, glucose: 128, weight: 82.8, sleep: 5.5 }, 
      { date: '06/14', bpSystolic: 122, bpDiastolic: 80, heartRate: 68, glucose: 96, weight: 82.5, sleep: 8 },
      { date: '06/15', bpSystolic: 120, bpDiastolic: 79, heartRate: 69, glucose: 94, weight: 82.4, sleep: 7.5 },
      { date: '06/16', bpSystolic: 118, bpDiastolic: 78, heartRate: 71, glucose: 95, weight: 82.5, sleep: 8 }
    ];

    const demoPatient = {
      name: currentUser?.name || currentUser?.username || 'Arthur Pendelton',
      email: currentUser?.email || 'arthur.pendelton@mg-health.org',
      provider: currentUser?.provider || 'Email Login',
      age: 58,
      doctor: 'Dr. Sarah Jenkins',
      emergencyContact: '+1 (555) 382-9102',
      bloodType: 'B+',
      height: 178,
      weight: 82.5
    };

    const demoFamily = [
      { id: 1, name: 'Emily Pendelton', relationship: 'Daughter (Caregiver)', phone: '+1 (555) 382-9011', email: 'emily.p@familycare.org', alertsEnabled: true, status: 'Connected' },
      { id: 2, name: 'Thomas Pendelton', relationship: 'Son', phone: '+1 (555) 382-4492', email: 'thomas.p@familycare.org', alertsEnabled: true, status: 'Connected' }
    ];

    const demoAlerts = [
      { id: 1, text: `${demoPatient.name} missed Metformin 500mg morning dose. SMS notification pushed to Emily Pendelton.`, time: '09:15 AM', date: '06/15' },
      { id: 2, text: `${demoPatient.name} missed Atorvastatin 20mg bedtime dose. SMS notification pushed to Emily Pendelton.`, time: '10:45 PM', date: '06/12' }
    ];

    const demoReports = [
      { id: 1, name: 'Cardiovascular Lab Report', date: '06/05/2026', doctor: 'Dr. Sarah Jenkins (Cardiology)', status: 'Reviewed', summary: 'Mild cholesterol elevation detected (LDL: 132 mg/dL, Total: 212 mg/dL). Blood pressure is currently well-controlled at 118/78 mmHg via Lisinopril 10mg daily. Sinus rhythm is normal. Patient is advised to monitor weight and limit sodium intake.' },
      { id: 2, name: 'Comprehensive Metabolic Panel (CMP)', date: '05/12/2026', doctor: 'Dr. Robert Chen (Internal Medicine)', status: 'Normal', summary: 'Fasting glucose was 98 mg/dL (Normal). Renal function is excellent (Creatinine 0.9 mg/dL, eGFR > 90). Liver enzymes (AST: 22 U/L, ALT: 28 U/L) are normal. Serum electrolytes are well within stable limits.' },
      { id: 3, name: 'Glycated Hemoglobin (HbA1c) Screening', date: '04/18/2026', doctor: 'Dr. Sarah Jenkins (Cardiology)', status: 'Reviewed', summary: 'HbA1c is currently at 5.8%, placing the patient in the pre-diabetic range. Metformin 500mg twice daily is maintained. Encouraging a consistent glycemic diet and minimum 30 minutes of aerobic exercise daily.' }
    ];

    setMedications(demoMedications);
    setVitalsLog(demoVitals);
    setPatientInfo(demoPatient);
    setFamilyMembers(demoFamily);
    setCaregiverAlerts(demoAlerts);
    setHealthReports(demoReports);
    setGamificationPoints(120);
    setSettings({
      alarmVolume: 80,
      reminderTone: 'Hospital Chime',
      snoozeInterval: 15,
      vibrationEnabled: true,
      voiceEnabled: false,
      elderlyMode: false
    });
    setMedicationHistory([
      { id: 101, name: 'Metformin', dose: '500mg', scheduledTime: 'Morning', actionTime: '08:05 AM', status: 'taken', snoozeCount: 0 },
      { id: 102, name: 'Lisinopril', dose: '10mg', scheduledTime: 'Morning', actionTime: '08:20 AM', status: 'taken', snoozeCount: 1 }
    ]);
    setVerificationHistory([
      { id: 201, date: '06/16/2026', time: '09:05 AM', name: 'Metformin', brand: 'Glucophage', strength: '500mg', batchNumber: 'MF2910B', expiryDate: 'March 2028', expiryStatus: 'valid', matchStatus: 'correct', matchReport: '✅ Matches prescription Metformin 500mg Morning dose.' },
      { id: 202, date: '06/15/2026', time: '09:12 AM', name: 'Lisinopril', brand: 'Zestril', strength: '20mg', batchNumber: 'LS8820X', expiryDate: 'January 2025', expiryStatus: 'expired', matchStatus: 'incorrect', matchReport: '❌ Medicine Expired (January 2025). Warning: Dosage Mismatch (Scanned 20mg, Prescribed 10mg).' }
    ]);
    addNotification('⚡ Hackathon Demo Mode Activated! Full clinical dataset populated.');
  };

  // State to manage minimized floating reminder center
  const [reminderCenterMinimized, setReminderCenterMinimized] = useState(true);

  // Get active countdown list for Reminder Center
  const [currentVirtualNowMs, setCurrentVirtualNowMs] = useState(Date.now() + virtualTimeOffset);
  useEffect(() => {
    const secTimer = setInterval(() => {
      setCurrentVirtualNowMs(Date.now() + virtualTimeOffset);
    }, 1000);
    return () => clearInterval(secTimer);
  }, [virtualTimeOffset]);

  const activeSnoozes = Object.entries(snoozeQueue).map(([medId, targetTimeMs]) => {
    const med = medications.find(m => m.id === parseInt(medId));
    const secondsLeft = Math.max(0, Math.ceil((targetTimeMs - currentVirtualNowMs) / 1000));
    return {
      id: medId,
      name: med ? med.name : 'Unknown Medication',
      secondsLeft
    };
  }).filter(s => s.secondsLeft > 0);

  // Helper to trigger specific scheduled period alarm
  const triggerPeriodAlarm = (period) => {
    // Find medications scheduled for this period
    const meds = medications.filter(m => m.time === period);
    const targetMed = meds[0] || {
      id: Date.now(),
      name: 'Metformin',
      dose: '500mg',
      time: period,
      instructions: `Take with food. (Demo test alarm for ${period})`,
      status: 'pending',
      snoozeCount: 0
    };
    setActiveAlarm(targetMed);
  };

  const virtualDate = new Date(Date.now() + virtualTimeOffset);

  const handleTakeAlarm = (med) => {
    setActiveAlarm(null);
    updateMedicationStatus(med.id, 'taken');
  };

  const handleSnoozeAlarm = (med) => {
    setActiveAlarm(null);
    // Increment snooze count
    setMedications(prev => 
      prev.map(m => 
        m.id === med.id ? { ...m, snoozeCount: (m.snoozeCount || 0) + 1 } : m
      )
    );
    updateMedicationStatus(med.id, 'snoozed');
  };

  const handleSkipAlarm = (med) => {
    setActiveAlarm(null);
    updateMedicationStatus(med.id, 'skipped');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        patientInfo={patientInfo} 
      />

      {/* Main Content Pane */}
      <main className="main-content">
        <Header 
          activeTab={activeTab} 
          adherenceRate={adherenceRate} 
          notifications={notifications} 
          clearNotifications={clearNotifications}
          triggerDemoMode={triggerDemoMode}
        />

        {/* Dynamic Panel Switcher */}
        {activeTab === 'overview' && (
          <OverviewTab 
            patientInfo={patientInfo}
            medications={medications}
            updateMedicationStatus={updateMedicationStatus}
            adherenceRate={adherenceRate}
            vitalsLog={vitalsLog}
            setActiveTab={setActiveTab}
            healthReports={healthReports}
            activeAlarm={activeAlarm}
            verificationHistory={verificationHistory}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationsTab 
            medications={medications}
            addMedication={addMedication}
            updateMedicationStatus={updateMedicationStatus}
            deleteMedication={deleteMedication}
            triggerTestAlarm={triggerTestAlarm}
            updateMedication={updateMedication}
            addNotification={addNotification}
          />
        )}

        {activeTab === 'verification' && (
          <VerificationTab 
            medications={medications}
            verificationHistory={verificationHistory}
            onSaveVerificationLog={handleSaveVerificationLog}
          />
        )}

        {activeTab === 'ai-guardian' && (
          <AIGuardianTab 
            medications={medications}
            patientInfo={patientInfo}
            vitalsLog={vitalsLog}
            verificationHistory={verificationHistory}
          />
        )}

        {activeTab === 'gamification' && (
          <GamificationTab 
            points={gamificationPoints}
            streaks={gamificationStreaks}
            badges={gamificationBadges}
            level={gamificationLevel}
            challenges={gamificationChallenges}
            encouragements={gamificationEncouragements}
            adherenceRate={adherenceRate}
            vitalsLog={vitalsLog}
            onClearEncouragement={(id) => {
              setGamificationEncouragements(prev => prev.filter(n => n.id !== id));
            }}
            onClaimChallengePoints={(id) => {
              setGamificationChallenges(prev => 
                prev.map(c => {
                  if (c.id === id && !c.completed) {
                    triggerPointsAward(c.points, `Completed challenge: ${c.text}`);
                    return { ...c, completed: true };
                  }
                  return c;
                })
              );
            }}
          />
        )}

        {activeTab === 'vitals' && (
          <VitalsTab 
            vitalsLog={vitalsLog}
            addVitalsLog={addVitalsLog}
            patientInfo={patientInfo}
            updatePatientInfo={updatePatientInfo}
          />
        )}

        {activeTab === 'prescriptions' && (
          <PrescriptionsTab 
            addParsedMedications={addParsedMedications}
            addNotification={addNotification}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            patientInfo={patientInfo}
            updatePatientInfo={updatePatientInfo}
            addNotification={addNotification}
            onLogout={handleLogout}
            triggerTestAlarm={triggerTestAlarm}
          />
        )}

        {activeTab === 'passport' && (
          <HealthPassportTab 
            patientInfo={patientInfo}
            medications={medications}
            vitalsLog={vitalsLog}
            adherenceRate={adherenceRate}
            onReportGenerated={() => {
              triggerPointsAward(20, "Printed Digital Health Passport Report");
            }}
          />
        )}

        {activeTab === 'family' && (
          <FamilyCareTab 
            familyMembers={familyMembers}
            addFamilyMember={addFamilyMember}
            caregiverAlerts={caregiverAlerts}
            triggerEmergencySOS={triggerEmergencySOS}
            medications={medications}
            history={medicationHistory}
            onSendEncouragement={(message, sender) => {
              const newNote = {
                id: Date.now(),
                from: sender,
                message: message,
                date: new Date().toLocaleDateString()
              };
              setGamificationEncouragements(prev => [newNote, ...prev]);
              triggerPointsAward(20, `Caregiver encouragement boost from ${sender}`);
            }}
            verificationHistory={verificationHistory}
          />
        )}

        {activeTab === 'clinician' && (
          <ClinicianPortalTab 
            patientInfo={patientInfo}
            medications={medications}
            history={medicationHistory}
            adherenceRate={adherenceRate}
            verificationHistory={verificationHistory}
          />
        )}
      </main>

      {/* Floating Medication Reminder Center widget */}
      <div className={`floating-reminder-center ${reminderCenterMinimized ? 'minimized' : ''}`}>
        <div 
          className="floating-reminder-header"
          onClick={() => setReminderCenterMinimized(!reminderCenterMinimized)}
        >
          <div className="floating-reminder-header-title">
            <span>🔔 Medication Reminder Center</span>
            {activeSnoozes.length > 0 && (
              <span className="pill-badge warning" style={{ fontSize: '0.65rem', animation: 'pulseGlow 1.5s infinite' }}>
                {activeSnoozes.length} Active
              </span>
            )}
          </div>
          <span>{reminderCenterMinimized ? '▲' : '▼'}</span>
        </div>

        <div className="floating-reminder-content">
          {/* Compliance overview */}
          <div className="reminder-center-points">
            <div>
              <span className="reminder-center-points-title">Gamification Points</span>
              <div className="reminder-center-points-val">🏆 {gamificationPoints} pts</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="reminder-center-points-title">Compliance</span>
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary)' }}>{adherenceRate}%</div>
            </div>
          </div>

          {/* Snooze countdowns */}
          <div>
            <span className="reminder-center-section-title">Active Snooze Timers</span>
            {activeSnoozes.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0', border: '1px dashed var(--border-dark)', borderRadius: '8px' }}>
                No active countdown timers.
              </div>
            ) : (
              activeSnoozes.map(s => {
                const mins = Math.floor(s.secondsLeft / 60);
                const secs = s.secondsLeft % 60;
                return (
                  <div key={s.id} className="snooze-timer-card">
                    <span className="snooze-timer-name">{s.name}</span>
                    <span className="snooze-timer-val">⏰ {mins}:{secs < 10 ? '0' : ''}{secs}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Virtual clock */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--border)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Virtual Time:</span>
            <strong>{virtualDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
          </div>

          {/* Demo Tester Hub */}
          <div>
            <span className="reminder-center-section-title">Demo Tester Hub</span>
            <div className="tester-hub-grid">
              <button 
                className="tester-hub-btn" 
                onClick={() => setVirtualTimeOffset(prev => prev + 3600000)}
                title="Simulate passing 1 hour"
              >
                ⏩ +1 Hour
              </button>
              <button 
                className="tester-hub-btn" 
                onClick={() => setVirtualTimeOffset(0)}
                title="Reset simulation to real clock time"
              >
                🔄 Reset Clock
              </button>
              <button 
                className="tester-hub-btn tester-hub-btn-active"
                onClick={() => triggerPeriodAlarm('Morning')}
              >
                ☀️ Test Morning
              </button>
              <button 
                className="tester-hub-btn tester-hub-btn-active"
                onClick={() => triggerPeriodAlarm('Bedtime')}
              >
                🌙 Test Bedtime
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Repeating Audio Alarm Overlay Popup Modal */}
      {activeAlarm && (
        <div className="alarm-modal-overlay">
          <div className="alarm-modal">
            <div className="alarm-modal-header">
              <span className="alarm-modal-bell">⏰</span>
              <h3 style={{ margin: 0, fontWeight: '800', fontSize: '1.25rem' }}>MEDICATION DUE</h3>
              <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>MediGuardian Smart Reminder</span>
            </div>
            
            <div className="alarm-modal-body">
              <div className="alarm-modal-title">{activeAlarm.name}</div>
              <div className="alarm-modal-dose">{activeAlarm.dose}</div>
              
              <div className="alarm-modal-instructions">
                <strong>Instructions:</strong> {activeAlarm.instructions || 'Take as directed by your physician.'}
              </div>

              <div className="alarm-modal-meta">
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Scheduled</span>
                  <strong>{activeAlarm.time}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Doctor</span>
                  <strong>{activeAlarm.doctor || 'Primary Doctor'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Snoozes</span>
                  <strong>{activeAlarm.snoozeCount || 0}</strong>
                </div>
              </div>

              <div className="alarm-modal-actions">
                <button 
                  className="alarm-modal-btn-take"
                  onClick={() => handleTakeAlarm(activeAlarm)}
                >
                  ✓ Mark as Taken (+10 pts)
                </button>
                <button 
                  className="alarm-modal-btn-snooze"
                  onClick={() => handleSnoozeAlarm(activeAlarm)}
                >
                  ⏰ Snooze {settings.snoozeInterval || 15} Min
                </button>
                <button 
                  className="alarm-modal-btn-skip"
                  onClick={() => handleSkipAlarm(activeAlarm)}
                >
                  Skip Dose
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Celebration Particle Canvas */}
      <ConfettiCanvas active={showConfetti} />

      {/* Unlocked Badge Milestone Celebration Modal */}
      {unlockedBadgeModal && (
        <div className="alarm-modal-overlay">
          <div className="alarm-modal" style={{ border: '3px solid var(--primary)', animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="alarm-modal-header" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}>
              <span style={{ fontSize: '3rem', animation: 'pulseGlow 1.2s infinite' }}>{unlockedBadgeModal.emoji}</span>
              <h3 style={{ margin: 0, fontWeight: '900', fontSize: '1.4rem' }}>MILESTONE UNLOCKED!</h3>
              <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>MediGuardian Achievements</span>
            </div>
            
            <div className="alarm-modal-body" style={{ padding: '24px 30px' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {unlockedBadgeModal.name}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 24px 0' }}>
                {unlockedBadgeModal.desc}
              </p>

              {/* Achievement Certificate card representation */}
              <div style={{ 
                border: '1px solid var(--border-dark)', 
                borderRadius: '12px', 
                padding: '16px', 
                backgroundColor: 'var(--background)',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Recipient Patient</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>{patientInfo.name}</strong>
                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Verified Clinical Accomplishment</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Medication Adherence Excellence Awarded via MediGuardian AI Smart Engine.</span>
              </div>

              <button 
                onClick={() => setUnlockedBadgeModal(null)}
                style={{ 
                  backgroundColor: 'var(--primary)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '8px', 
                  fontWeight: '800', 
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                ✓ Awesome, Thank You!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Confetti Canvas Emitter Component
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#0284c7', '#0d9488', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const particles = Array.from({ length: 150 }).map(() => ({
      x: Math.random() * canvas.width,
      y: (Math.random() * canvas.height) - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, index) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - index / 3) * 15;

        // Reset particle if it falls off screen
        if (p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = -20;
          p.tilt = Math.random() * 10 - 5;
        }

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        zIndex: 10000 
      }} 
    />
  );
}
