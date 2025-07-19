import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { checkFirestoreVerification } from "../utils/auth";

export const useVerificationStatus = () => {
  const { currentUser } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      if (!currentUser) {
        setIsVerified(false);
        setLoading(false);
        return;
      }

      if (currentUser.emailVerified === true) {
        setIsVerified(true);
        setLoading(false);
        return;
      }

      try {
        const firestoreVerified = await checkFirestoreVerification(
          currentUser.uid
        );
        setIsVerified(firestoreVerified);
      } catch (error) {
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [currentUser]);

  return { isVerified, loading };
};
