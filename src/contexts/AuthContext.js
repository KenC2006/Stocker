import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  applyActionCode,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { isUserVerified, checkFirestoreVerification } from "../utils/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationCache, setVerificationCache] = useState(new Map());

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password).then(
      async (userCredential) => {
        try {
          await sendEmailVerification(userCredential.user, {
            url: "https://stockerstorage.web.app/email-verification",
            handleCodeInApp: true,
          });
          setEmailVerificationSent(true);
        } catch (error) {}

        return userCredential;
      }
    );
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
    setEmailVerificationSent(false);
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

  function resendVerificationEmail() {
    const authUser = auth.currentUser;
    if (authUser && !isUserVerified(authUser)) {
      return sendEmailVerification(authUser, {
        url: "https://stockerstorage.web.app/email-verification",
        handleCodeInApp: true,
      });
    }
    throw new Error("No unverified user found");
  }

  function verifyEmail(actionCode) {
    return applyActionCode(auth, actionCode);
  }

  function checkEmailVerification() {
    return new Promise(async (resolve, reject) => {
      if (!currentUser) {
        reject(new Error("No user found"));
        return;
      }

      try {
        const authUser = auth.currentUser;
        if (!authUser) {
          reject(new Error("No authenticated user found"));
          return;
        }

        await authUser.reload();

        setCurrentUser(authUser);

        if (isUserVerified(authUser)) {
          setEmailVerificationSent(false);
          setVerificationCache((prev) => new Map(prev.set(authUser.uid, true)));
          resolve(true);
        } else {
          const cachedStatus = verificationCache.get(authUser.uid);
          if (cachedStatus === true) {
            setEmailVerificationSent(false);
            resolve(true);
            return;
          }

          try {
            const firestoreVerified = await checkFirestoreVerification(
              authUser.uid
            );
            if (firestoreVerified) {
              setEmailVerificationSent(false);
              setVerificationCache(
                (prev) => new Map(prev.set(authUser.uid, true))
              );
              resolve(true);
            } else {
              setVerificationCache(
                (prev) => new Map(prev.set(authUser.uid, false))
              );
              resolve(false);
            }
          } catch (firestoreError) {
            resolve(false);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setGuestMode(false);
        if (isUserVerified(user)) {
          setEmailVerificationSent(false);
          setVerificationCache((prev) => new Map(prev.set(user.uid, true)));
        }
      } else {
        setVerificationCache(new Map());
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    guestMode,
    emailVerificationSent,
    signup,
    login,
    logout,
    enterGuestMode,
    exitGuestMode,
    resendVerificationEmail,
    verifyEmail,
    checkEmailVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
