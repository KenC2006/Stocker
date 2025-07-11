import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../config/firebase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password).catch((error) => {
      if (error.code === "auth/invalid-credential") {
        throw new Error("Invalid email or password");
      }
      throw error;
    });
  }

  function logout() {
    setGuestMode(false);
    return signOut(auth);
  }

  function enterGuestMode() {
    setGuestMode(true);
    setCurrentUser({ isGuest: true, uid: "guest", email: "guest@example.com" });
  }

  function exitGuestMode() {
    setGuestMode(false);
    setCurrentUser(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setGuestMode(false);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    guestMode,
    signup,
    login,
    logout,
    enterGuestMode,
    exitGuestMode,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
