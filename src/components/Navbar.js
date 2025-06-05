import React from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  Spacer,
  Container,
  useColorModeValue,
  Image,
} from "@chakra-ui/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaChartLine,
  FaExchangeAlt,
  FaTrophy,
  FaSignOutAlt,
} from "react-icons/fa";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      bg="uoft.navy"
      py={4}
      boxShadow="lg"
      position="sticky"
      top="0"
      zIndex="sticky"
    >
      <Container maxW="container.lg">
        <Flex alignItems="center">
          <Image src="/uoft_logo.png" alt="UofT Logo" height="40px" mr={4} />
          <Heading size="md" color="white">
            UofT Stocker
          </Heading>
          <Spacer />
          {currentUser && (
            <Flex gap={1} ml="auto">
              <Button
                as={Link}
                to="/dashboard"
                leftIcon={<FaChartLine />}
                borderRadius="full"
                px={7}
                py={2}
                fontSize="lg"
                fontWeight={isActive("/dashboard") ? "bold" : "normal"}
                bg={isActive("/dashboard") ? "blue.600" : "transparent"}
                color="white"
                borderWidth={0}
                _hover={{
                  bg: "blue.700",
                  color: "white",
                }}
                transition="all 0.2s"
                variant="ghost"
              >
                Dashboard
              </Button>
              <Button
                as={Link}
                to="/trading"
                leftIcon={<FaExchangeAlt />}
                borderRadius="full"
                px={7}
                py={2}
                fontSize="lg"
                fontWeight={isActive("/trading") ? "bold" : "normal"}
                bg={isActive("/trading") ? "blue.600" : "transparent"}
                color="white"
                borderWidth={0}
                _hover={{
                  bg: "blue.700",
                  color: "white",
                }}
                transition="all 0.2s"
                variant="ghost"
              >
                Trading
              </Button>
              <Button
                as={Link}
                to="/leaderboard"
                leftIcon={<FaTrophy />}
                borderRadius="full"
                px={7}
                py={2}
                fontSize="lg"
                fontWeight={isActive("/leaderboard") ? "bold" : "normal"}
                bg={isActive("/leaderboard") ? "blue.600" : "transparent"}
                color="white"
                borderWidth={0}
                _hover={{
                  bg: "blue.700",
                  color: "white",
                }}
                transition="all 0.2s"
                variant="ghost"
              >
                Leaderboard
              </Button>
              <Button
                onClick={handleLogout}
                leftIcon={<FaSignOutAlt />}
                borderRadius="full"
                px={7}
                py={2}
                fontSize="lg"
                fontWeight="bold"
                color="red.500"
                bg="transparent"
                borderWidth={2}
                borderColor="red.500"
                variant="outline"
                _hover={{
                  bg: "red.500",
                  color: "white",
                  borderColor: "red.500",
                }}
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
