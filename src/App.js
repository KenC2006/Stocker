import React from "react";
import { ChakraProvider, CSSReset, Box } from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { isUserVerified, checkFirestoreVerification } from "./utils/auth";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import Trading from "./components/Trading";
import EmailVerification from "./components/EmailVerification";
import Navbar from "./components/Navbar";
import { useVerificationStatus } from "./components/VerificationCheck";
import theme from "./theme";

const PrivateRoute = ({ children }) => {
  const { currentUser, guestMode } = useAuth();
  const { isVerified, loading } = useVerificationStatus();

  if (guestMode) return <Navigate to="/leaderboard" />;
  if (!currentUser) return <Navigate to="/login" />;
  if (loading) return <div>Loading...</div>;
  if (!isVerified) return <Navigate to="/email-verification" />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { currentUser, guestMode } = useAuth();
  return currentUser || guestMode ? children : <Navigate to="/login" />;
};

const VerifiedRoute = ({ children }) => {
  const { currentUser, guestMode } = useAuth();
  const { isVerified, loading } = useVerificationStatus();

  if (guestMode) return children;
  if (!currentUser) return <Navigate to="/login" />;
  if (loading) return <div>Loading...</div>;
  if (!isVerified) return <Navigate to="/email-verification" />;
  return children;
};

const RootRoute = () => {
  const { currentUser, guestMode } = useAuth();
  const { isVerified, loading } = useVerificationStatus();

  if (guestMode) return <Navigate to="/leaderboard" />;
  if (loading) return <div>Loading...</div>;
  if (currentUser && isVerified) return <Navigate to="/dashboard" />;
  if (currentUser && !isVerified) return <Navigate to="/email-verification" />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      <Router>
        <AuthProvider>
          <Navbar />
          <Box pt="72px">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/email-verification"
                element={<EmailVerification />}
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <GuestRoute>
                    <Leaderboard />
                  </GuestRoute>
                }
              />
              <Route
                path="/trading"
                element={
                  <VerifiedRoute>
                    <Trading />
                  </VerifiedRoute>
                }
              />
              <Route path="/" element={<RootRoute />} />
            </Routes>
          </Box>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
