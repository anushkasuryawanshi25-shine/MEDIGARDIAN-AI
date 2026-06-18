// Local Database and Authentication Service
// segregates patient data by user email to ensure separate user records.
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const USERS_KEY = 'mediguardian_registered_users';
const SESSION_KEY = 'mediguardian_current_session';

// Helper to get raw users list
function getRawUsers() {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
}

// Helper to save raw users list
function saveRawUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Generate default medical template data for a newly registered user
export function generateDefaultData(name, email) {
  return {
    patientInfo: {
      name: name,
      email: email,
      provider: 'Email/Password',
      age: 45,
      doctor: 'Dr. Sarah Jenkins',
      emergencyContact: '+1 (555) 382-9102',
      bloodType: 'O+',
      height: 175,
      weight: 72.0
    },
    medications: [
      {
        id: 1,
        name: 'Metformin',
        dose: '500mg',
        duration: '30 days',
        frequency: 'Daily',
        time: 'Morning',
        reminderTime: '09:00 AM',
        instructions: 'Take with breakfast, avoid heavy alcohol',
        refills: 2,
        doctor: 'Dr. Sarah Jenkins',
        status: 'pending',
        snoozeCount: 0
      },
      {
        id: 2,
        name: 'Multivitamin',
        dose: '1 tablet',
        duration: '90 days',
        frequency: 'Daily',
        time: 'Morning',
        reminderTime: '09:00 AM',
        instructions: 'Take daily with water',
        refills: null,
        doctor: 'Self-prescribed',
        status: 'taken',
        snoozeCount: 0
      }
    ],
    vitalsLog: [
      { date: '06/12', bpSystolic: 120, bpDiastolic: 80, heartRate: 72, glucose: 95, weight: 72.0, sleep: 8 },
      { date: '06/13', bpSystolic: 122, bpDiacholic: 81, heartRate: 74, glucose: 98, weight: 72.2, sleep: 7.5 },
      { date: '06/14', bpSystolic: 118, bpDiastolic: 78, heartRate: 70, glucose: 92, weight: 71.9, sleep: 8 }
    ],
    caregiverAlerts: [],
    familyMembers: [
      { id: 1, name: 'Emily Caregiver', relationship: 'Spouse', phone: '+1 (555) 382-9011', email: 'caregiver@family.org', alertsEnabled: true, status: 'Connected' }
    ],
    healthReports: [
      {
        id: 1,
        name: 'Initial Wellness Assessment',
        date: new Date().toLocaleDateString(),
        doctor: 'System Onboarding AI',
        status: 'Normal',
        summary: 'Patient profile initialized. Regimen tracking configured. Log your vitals daily to compile clinical summaries.'
      }
    ],
    gamificationPoints: 120,
    gamificationStreaks: { current: 3, longest: 7, lastCheckDate: '2026-06-17' },
    gamificationBadges: ['FIRST_DOSE_CHAMPION'],
    gamificationLevel: 1,
    gamificationChallenges: [
      { id: 'daily_all_meds', text: 'Take all medicines on time today', completed: false, type: 'daily', points: 25 },
      { id: 'daily_bp', text: 'Log your blood pressure reading', completed: false, type: 'daily', points: 15 },
      { id: 'daily_profile', text: 'Complete your health profile setup', completed: false, type: 'daily', points: 50 },
      { id: 'daily_diet', text: "Follow doctor's diet recommendations", completed: false, type: 'daily', points: 10 },
      { id: 'weekly_streak', text: 'Maintain a 7-day adherence streak', completed: false, type: 'weekly', points: 100 },
      { id: 'monthly_adherence', text: 'Maintain monthly adherence above 90%', completed: false, type: 'monthly', points: 200 }
    ],
    gamificationEncouragements: [
      { id: 1, from: 'Emily Caregiver', message: 'You are doing great! Keep up the consistency!', date: 'Today' }
    ],
    verificationHistory: [
      { id: 1, date: '06/15/2026', time: '09:10 AM', name: 'Metformin', brand: 'Glucophage', strength: '500mg', batchNumber: 'MF2910B', expiryDate: 'March 2028', expiryStatus: 'valid', matchStatus: 'correct', matchReport: '✅ Matches prescription Metformin 500mg Morning dose.' }
    ],
    settings: {
      alarmVolume: 80,
      reminderTone: 'Hospital Chime',
      snoozeInterval: 15,
      vibrationEnabled: true,
      voiceEnabled: false,
      elderlyMode: false
    },
    medicationHistory: []
  };
}

// User registration
export function registerUser(name, email, password, avatar = null) {
  const users = getRawUsers();
  const normalizedEmail = email.toLowerCase().trim();

  if (users[normalizedEmail]) {
    return { success: false, message: 'User already exists.' };
  }

  // Save credentials
  users[normalizedEmail] = {
    name,
    username: name,
    email: normalizedEmail,
    password,
    avatar
  };
  saveRawUsers(users);

  // Initialize medical records data
  const defaultData = generateDefaultData(name, normalizedEmail);
  localStorage.setItem(`mediguardian_data_${normalizedEmail}`, JSON.stringify(defaultData));

  return { success: true };
}

// Validate login credentials
export function loginUser(email, password) {
  const users = getRawUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const user = users[normalizedEmail];

  if (!user || user.password !== password) {
    return { success: false, message: 'Invalid email or password.' };
  }

  // Save session
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: normalizedEmail, name: user.name || user.username, username: user.username || user.name }));
  return { success: true, user };
}

// Validate or register Google User dynamically
export function loginWithGoogle(name, email) {
  const users = getRawUsers();
  const normalizedEmail = email.toLowerCase().trim();
  let user = users[normalizedEmail];

  if (!user) {
    // Register Google user automatically on the fly
    user = {
      name,
      username: name,
      email: normalizedEmail,
      password: 'GOOGLE_OAUTH_SESSION', // Placeholder credential
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`
    };
    users[normalizedEmail] = user;
    saveRawUsers(users);

    // Initialize data
    const defaultData = generateDefaultData(name, normalizedEmail);
    localStorage.setItem(`mediguardian_data_${normalizedEmail}`, JSON.stringify(defaultData));
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: normalizedEmail, name: user.name || user.username, username: user.username || user.name }));
  return user;
}

// Firebase configuration instances
let dbInstance = null;

export function getFirebaseDb() {
  if (dbInstance) return dbInstance;
  const configStr = localStorage.getItem('mediguardian_firebase_config');
  if (!configStr) return null;
  try {
    const config = JSON.parse(configStr);
    if (!config.apiKey || !config.projectId) return null;
    
    if (getApps().length === 0) {
      initializeApp(config);
    }
    dbInstance = getFirestore();
    return dbInstance;
  } catch (err) {
    console.error("Firebase Firestore initialization failed:", err);
    return null;
  }
}

// Save patient data to Firebase Firestore
export async function savePatientDataFirebase(email, data) {
  const db = getFirebaseDb();
  if (!db) return;
  const normalizedEmail = email.toLowerCase().trim();
  try {
    await setDoc(doc(db, 'patient_schedules', normalizedEmail), {
      email: normalizedEmail,
      medications: data.medications || [],
      vitalsLog: data.vitalsLog || [],
      caregiverAlerts: data.caregiverAlerts || [],
      familyMembers: data.familyMembers || [],
      healthReports: data.healthReports || [],
      gamificationPoints: data.gamificationPoints ?? 120,
      gamificationStreaks: data.gamificationStreaks || { current: 0, longest: 0, lastCheckDate: '' },
      gamificationBadges: data.gamificationBadges || [],
      gamificationLevel: data.gamificationLevel || 1,
      gamificationChallenges: data.gamificationChallenges || [],
      gamificationEncouragements: data.gamificationEncouragements || [],
      verificationHistory: data.verificationHistory || [],
      settings: data.settings || {},
      medicationHistory: data.medicationHistory || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error("Error saving to Firestore:", err);
  }
}

// Fetch patient data from Firebase Firestore
export async function fetchFirebasePatientData(email) {
  const db = getFirebaseDb();
  if (!db) return null;
  const normalizedEmail = email.toLowerCase().trim();
  try {
    const docRef = doc(db, 'patient_schedules', normalizedEmail);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (err) {
    console.error("Error fetching from Firestore:", err);
  }
  return null;
}

// Load patient data for logged-in user
export function loadPatientData(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const data = localStorage.getItem(`mediguardian_data_${normalizedEmail}`);
  
  if (data) {
    return JSON.parse(data);
  }
  
  // Fallback if data is somehow deleted
  return generateDefaultData('Guest User', normalizedEmail);
}

// Save patient data for logged-in user
export function savePatientData(email, data) {
  const normalizedEmail = email.toLowerCase().trim();
  localStorage.setItem(`mediguardian_data_${normalizedEmail}`, JSON.stringify(data));
  savePatientDataFirebase(normalizedEmail, data);
}

// Get current session
export function getActiveSession() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  return JSON.parse(session);
}

// End current session
export function clearActiveSession() {
  localStorage.removeItem(SESSION_KEY);
}

// Pre-populate with Arthur Pendelton for immediate demo validation
(function initDemoUser() {
  const users = getRawUsers();
  const arthurEmail = 'arthur.pendelton@mg-health.org';
  if (!users[arthurEmail]) {
    users[arthurEmail] = {
      name: 'Arthur Pendelton',
      username: 'Arthur Pendelton',
      email: arthurEmail,
      password: 'Arthur2026',
      avatar: null
    };
    saveRawUsers(users);

    const arthurData = {
      patientInfo: {
        name: 'Arthur Pendelton',
        email: arthurEmail,
        provider: 'Email Login',
        age: 58,
        doctor: 'Dr. Sarah Jenkins',
        emergencyContact: '+1 (555) 382-9102',
        bloodType: 'B+',
        height: 178,
        weight: 82.5
      },
      medications: [
        { id: 1, name: 'Metformin', dose: '500mg', duration: '30 days', frequency: 'Daily', time: 'Morning', reminderTime: '09:00 AM', instructions: 'Take with breakfast, avoid heavy alcohol', refills: 2, doctor: 'Dr. Sarah Jenkins', status: 'taken', snoozeCount: 0 },
        { id: 2, name: 'Lisinopril', dose: '10mg', duration: '30 days', frequency: 'Daily', time: 'Morning', reminderTime: '09:00 AM', instructions: 'Take on empty stomach, monitor dizziness', refills: 1, doctor: 'Dr. Sarah Jenkins', status: 'taken', snoozeCount: 0 },
        { id: 3, name: 'Atorvastatin', dose: '20mg', duration: '90 days', frequency: 'Daily', time: 'Night', reminderTime: '09:00 PM', instructions: 'Take in the evening, avoid eating grapefruits', refills: 4, doctor: 'Dr. Sarah Jenkins', status: 'pending', snoozeCount: 0 },
        { id: 4, name: 'Amoxicillin', dose: '250mg', duration: '10 days', frequency: 'Daily', time: 'Afternoon', reminderTime: '01:00 PM', instructions: 'Finish full 10-day antibiotic course', refills: 0, doctor: 'Dr. Robert Chen', status: 'snoozed', snoozeCount: 1 },
        { id: 5, name: 'Vitamin D3', dose: '2000 IU', duration: '30 days', frequency: 'Daily', time: 'Morning', reminderTime: '09:00 AM', instructions: 'Take with fat-containing meal', refills: null, doctor: 'Dr. Sarah Jenkins', status: 'taken', snoozeCount: 0 }
      ],
      vitalsLog: [
        { date: '06/10', bpSystolic: 128, bpDiastolic: 84, heartRate: 74, glucose: 106, weight: 82.8, sleep: 6.5 },
        { date: '06/11', bpSystolic: 126, bpDiastolic: 82, heartRate: 72, glucose: 102, weight: 82.7, sleep: 7 },
        { date: '06/12', bpSystolic: 124, bpDiastolic: 81, heartRate: 70, glucose: 99, weight: 82.6, sleep: 7.5 },
        { date: '06/13', bpSystolic: 135, bpDiastolic: 89, heartRate: 82, glucose: 128, weight: 82.8, sleep: 5.5 },
        { date: '06/14', bpSystolic: 122, bpDiastolic: 80, heartRate: 68, glucose: 96, weight: 82.5, sleep: 8 },
        { date: '06/15', bpSystolic: 120, bpDiastolic: 79, heartRate: 69, glucose: 94, weight: 82.4, sleep: 7.5 },
        { date: '06/16', bpSystolic: 118, bpDiastolic: 78, heartRate: 71, glucose: 95, weight: 82.5, sleep: 8 }
      ],
      caregiverAlerts: [
        { id: 1, text: 'Arthur missed Metformin 500mg morning dose. SMS notification pushed to Emily Pendelton.', time: '09:15 AM', date: '06/15' },
        { id: 2, text: 'Arthur missed Atorvastatin 20mg bedtime dose. SMS notification pushed to Emily Pendelton.', time: '10:45 PM', date: '06/12' }
      ],
      familyMembers: [
        { id: 1, name: 'Emily Pendelton', relationship: 'Daughter (Caregiver)', phone: '+1 (555) 382-9011', email: 'emily.p@familycare.org', alertsEnabled: true, status: 'Connected' },
        { id: 2, name: 'Thomas Pendelton', relationship: 'Son', phone: '+1 (555) 382-4492', email: 'thomas.p@familycare.org', alertsEnabled: true, status: 'Connected' }
      ],
      healthReports: [
        { id: 1, name: 'Cardiovascular Lab Report', date: '06/05/2026', doctor: 'Dr. Sarah Jenkins (Cardiology)', status: 'Reviewed', summary: 'Mild cholesterol elevation detected (LDL: 132 mg/dL, Total: 212 mg/dL). Blood pressure is currently well-controlled at 118/78 mmHg via Lisinopril 10mg daily. Patient is advised to monitor weight and limit sodium intake.' },
        { id: 2, name: 'Comprehensive Metabolic Panel (CMP)', date: '05/12/2026', doctor: 'Dr. Robert Chen (Internal Medicine)', status: 'Normal', summary: 'Fasting glucose was 98 mg/dL (Normal). Renal function is excellent (Creatinine 0.9 mg/dL, eGFR > 90). Liver enzymes (AST: 22 U/L, ALT: 28 U/L) are normal. Serum electrolytes are well within stable limits.' },
        { id: 3, name: 'Glycated Hemoglobin (HbA1c) Screening', date: '04/18/2026', doctor: 'Dr. Sarah Jenkins (Cardiology)', status: 'Reviewed', summary: 'HbA1c is currently at 5.8%, placing the patient in the pre-diabetic range. Metformin 500mg twice daily is maintained. Encouraging a consistent glycemic diet and minimum 30 minutes of aerobic exercise daily.' }
      ],
      gamificationPoints: 120,
      gamificationStreaks: { current: 18, longest: 32, lastCheckDate: '2026-06-17' },
      gamificationBadges: ['FIRST_DOSE_CHAMPION', 'CONSISTENCY_STAR', 'MEDICATION_HERO', 'HEALTH_TRACKER'],
      gamificationLevel: 2,
      gamificationChallenges: [
        { id: 'daily_all_meds', text: 'Take all medicines on time today', completed: true, type: 'daily', points: 25 },
        { id: 'daily_bp', text: 'Log your blood pressure reading', completed: true, type: 'daily', points: 15 },
        { id: 'daily_profile', text: 'Complete your health profile setup', completed: true, type: 'daily', points: 50 },
        { id: 'daily_diet', text: "Follow doctor's diet recommendations", completed: false, type: 'daily', points: 10 },
        { id: 'weekly_streak', text: 'Maintain a 7-day adherence streak', completed: true, type: 'weekly', points: 100 },
        { id: 'monthly_adherence', text: 'Maintain monthly adherence above 90%', completed: false, type: 'monthly', points: 200 }
      ],
      gamificationEncouragements: [
        { id: 101, from: 'Emily Pendelton', message: 'Great job keeping your medication streak alive!', date: '06/16' },
        { id: 102, from: 'Thomas Pendelton', message: 'So proud of your progress, dad! Keep it up!', date: '06/15' }
      ],
      verificationHistory: [
        { id: 201, date: '06/16/2026', time: '09:05 AM', name: 'Metformin', brand: 'Glucophage', strength: '500mg', batchNumber: 'MF2910B', expiryDate: 'March 2028', expiryStatus: 'valid', matchStatus: 'correct', matchReport: '✅ Matches prescription Metformin 500mg Morning dose.' },
        { id: 202, date: '06/15/2026', time: '09:12 AM', name: 'Lisinopril', brand: 'Zestril', strength: '20mg', batchNumber: 'LS8820X', expiryDate: 'January 2025', expiryStatus: 'expired', matchStatus: 'incorrect', matchReport: '❌ Medicine Expired (January 2025). Warning: Dosage Mismatch (Scanned 20mg, Prescribed 10mg).' }
      ],
      settings: {
        alarmVolume: 80,
        reminderTone: 'Hospital Chime',
        snoozeInterval: 15,
        vibrationEnabled: true,
        voiceEnabled: false,
        elderlyMode: false
      },
      medicationHistory: [
        { id: 101, name: 'Metformin', dose: '500mg', scheduledTime: 'Morning', actionTime: '09:05 AM', status: 'taken', snoozeCount: 0 },
        { id: 102, name: 'Lisinopril', dose: '10mg', scheduledTime: 'Morning', actionTime: '09:20 AM', status: 'taken', snoozeCount: 1 }
      ]
    };
    localStorage.setItem(`mediguardian_data_${arthurEmail}`, JSON.stringify(arthurData));
  }
})();
