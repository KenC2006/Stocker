export const isUserVerified = (user) => {
  if (!user) return false;

  if (user.isGuest) return false;

  if (user.emailVerified === true) return true;

  return false;
};

export const checkFirestoreVerification = async (userId) => {
  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("../config/firebase");

    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().emailVerified === true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const updateVerificationStatus = async (userId, email) => {
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("../config/firebase");

    const userDocRef = doc(db, "users", userId);
    await setDoc(
      userDocRef,
      {
        emailVerified: true,
        email: email,
        createdAt: new Date().toISOString(),
        balance: 30000,
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    return false;
  }
};

export const isGuestMode = (auth) => auth.guestMode;

export const canTrade = (user, guestMode, marketOpen) => {
  if (guestMode) return false;
  if (!user || !isUserVerified(user)) return false;
  return marketOpen;
};

export const isMarketOpen = () => {
  const now = new Date();
  const nyNow = new Date(
    now.toLocaleString("en-US", { timeZone: "America/New_York" })
  );
  const day = nyNow.getDay();
  const hours = nyNow.getHours();
  const minutes = nyNow.getMinutes();

  if (day === 0 || day === 6) return false;
  if (hours < 9 || (hours === 9 && minutes < 30)) return false;
  if (hours > 16 || (hours === 16 && minutes > 0)) return false;
  return true;
};
