import React, { createContext, useContext, useState, useEffect } from 'react';
import { generateDefaultData } from '../services/db';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

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

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up with Email and Password
  async function signUpWithEmail(name, email, password) {
    const users = getRawUsers();
    const normalizedEmail = email.toLowerCase().trim();

    if (users[normalizedEmail]) {
      throw new Error('An account with this email address already exists.');
    }

    // Save user credentials using "name" key
    users[normalizedEmail] = {
      name,
      username: name,
      email: normalizedEmail,
      password
    };
    saveRawUsers(users);

    // Initialize default medical records template data in localStorage
    const defaultData = generateDefaultData(name, normalizedEmail);
    localStorage.setItem(`mediguardian_data_${normalizedEmail}`, JSON.stringify(defaultData));

    return { email: normalizedEmail, name, username: name };
  }

  // Sign in with Email and Password
  async function loginWithEmail(email, password) {
    const users = getRawUsers();
    const normalizedEmail = email.toLowerCase().trim();
    const user = users[normalizedEmail];

    if (!user || user.password !== password) {
      throw new Error('Invalid email address or password. Please try again.');
    }

    const sessionUser = { 
      email: normalizedEmail, 
      name: user.name || user.username,
      username: user.username || user.name,
      provider: 'Email Login'
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);

    return sessionUser;
  }

  // Sign in with Google (Simulated frontend demo with selected account)
  async function loginWithGoogle(name, email) {
    const googleUser = {
      name,
      username: name,
      email: email.toLowerCase().trim(),
      provider: 'Demo Google Login'
    };

    const users = getRawUsers();
    const normalizedEmail = googleUser.email;

    // Check if google user is registered locally
    if (!users[normalizedEmail]) {
      users[normalizedEmail] = {
        name: googleUser.name,
        username: googleUser.name,
        email: normalizedEmail,
        password: 'GOOGLE_DEMO_SESSION'
      };
      saveRawUsers(users);

      // Initialize default patient data in localStorage
      const defaultData = generateDefaultData(googleUser.name, normalizedEmail);
      // Explicitly set the provider in template data
      defaultData.patientInfo.provider = 'Demo Google Login';
      localStorage.setItem(`mediguardian_data_${normalizedEmail}`, JSON.stringify(defaultData));
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(googleUser));
    setCurrentUser(googleUser);

    return googleUser;
  }

  // Logout current session
  async function logout() {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  }

  // Load session from localStorage on mount
  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      setCurrentUser(JSON.parse(session));
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    signUpWithEmail,
    loginWithEmail,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
