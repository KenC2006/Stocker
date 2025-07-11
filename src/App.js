import React from "react";
import { ChakraProvider, CSSReset, Box } from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import Leaderboard from "./components/Leaderboard";
import Trading from "./components/Trading";
import Navbar from "./components/Navbar";
import theme from "./theme";

const PrivateRoute = ({ children }) => {
  const { currentUser, guestMode } = useAuth();
  if (guestMode) return <Navigate to="/leaderboard" />;
  return currentUser ? children : <Navigate to="/login" />;
};

const GuestRoute = ({ children }) => {
  const { currentUser, guestMode } = useAuth();
  return currentUser || guestMode ? children : <Navigate to="/login" />;
};

const RootRoute = () => {
  const { currentUser, guestMode } = useAuth();
  if (guestMode) return <Navigate to="/leaderboard" />;
  if (currentUser) return <Navigate to="/dashboard" />;
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
                  <GuestRoute>
                    <Trading />
                  </GuestRoute>
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
