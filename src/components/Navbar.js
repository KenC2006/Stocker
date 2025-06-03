import React from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  Spacer,
  Container,
  useColorModeValue,
} from "@chakra-ui/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const bgGradient = useColorModeValue(
    "linear(to-r, blue.400, purple.500)",
    "linear(to-r, blue.600, purple.700)"
  );
  const buttonVariant = useColorModeValue("solid", "outline");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      bgGradient={bgGradient}
      py={4}
      boxShadow="lg"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Container maxW="container.lg">
        <Flex alignItems="center">
          <Heading size="md" color="white">
            UofT Stock Trading
          </Heading>
          <Spacer />
          {currentUser && (
            <Flex gap={4}>
              <Button
                as={Link}
                to="/dashboard"
                variant={buttonVariant}
                colorScheme={isActive("/dashboard") ? "purple" : "whiteAlpha"}
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                Dashboard
              </Button>
              <Button
                as={Link}
                to="/trading"
                variant={buttonVariant}
                colorScheme={isActive("/trading") ? "purple" : "whiteAlpha"}
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                Trading
              </Button>
              <Button
                as={Link}
                to="/leaderboard"
                variant={buttonVariant}
                colorScheme={isActive("/leaderboard") ? "purple" : "whiteAlpha"}
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                Leaderboard
              </Button>
              <Button
                onClick={handleLogout}
                variant={buttonVariant}
                colorScheme="whiteAlpha"
                _hover={{ transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                Logout
              </Button>
            </Flex>
          )}
        </Flex>
      </Container>
    </Box>
  );
}

export default Navbar;
