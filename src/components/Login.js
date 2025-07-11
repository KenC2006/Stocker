import React, { useState, useEffect } from "react";
import { keyframes } from "@emotion/react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link as ChakraLink,
  useToast,
  Container,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  Icon,
  HStack,
  Divider,
  Grid,
  GridItem,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaKey,
  FaClock,
} from "react-icons/fa";

const chartAnimation = keyframes`
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(0%); opacity: 1; }
`;

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [contestTimer, setContestTimer] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  const { login, enterGuestMode } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const accentColor = useColorModeValue("blue.400", "blue.300");

  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.600", "gray.300");
  const labelColor = useColorModeValue("gray.700", "gray.200");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const inputColor = useColorModeValue("gray.800", "white");
  const inputFocusBg = useColorModeValue("white", "gray.600");
  const placeholderColor = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("gray.500", "gray.300");
  const tickerBg = useColorModeValue(
    "rgba(0,0,0,0.05)",
    "rgba(255,255,255,0.05)"
  );
  const tickerBorder = useColorModeValue(
    "1px solid rgba(0,0,0,0.1)",
    "1px solid rgba(255,255,255,0.1)"
  );
  const chartOpacity = useColorModeValue("0.1", "0.05");
  const chartBg = useColorModeValue(
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA1MCBMMjAgMzAgTDQwIDYwIEw2MCAyMCBMODAgNzAgTDEwMCA0MCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')",
    "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCA1MCBMMjAgMzAgTDQwIDYwIEw2MCAyMCBMODAgNzAgTDEwMCA0MCIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48L3N2Zz4=')"
  );

  const calculateContestTimer = () => {
    const now = new Date();
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    const timeLeft = endOfMonth - now;

    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      setContestTimer({ days, hours, minutes });
    } else {
      setContestTimer({ days: 0, hours: 0, minutes: 0 });
    }
  };

  useEffect(() => {
    calculateContestTimer();
    const timer = setInterval(calculateContestTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    enterGuestMode();
    navigate("/leaderboard");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address first",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await sendPasswordResetEmail(getAuth(), email);
      toast({
        title: "Password Reset Email Sent",
        description:
          "If an account exists with this email, you will receive password reset instructions. Please check your inbox and spam folder.",
        status: "success",
        duration: 6000,
        isClosable: true,
      });
    } catch (error) {
      let errorMessage =
        "Failed to send password reset email. Please try again.";

      if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          "Too many password reset attempts. Please try again later.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" bg={bgColor} position="relative" overflow="hidden">
      <Box
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        opacity={chartOpacity}
        backgroundImage={chartBg}
        backgroundSize="100px 100px"
        animation={`${chartAnimation} 3s ease-out`}
      />

      <Container maxW="7xl" py={8}>
        <Grid
          templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
          gap={8}
          minH="90vh"
          alignItems="center"
        >
          <GridItem>
            <VStack spacing={4} align="start">
              <Box>
                <Heading
                  size="2xl"
                  fontWeight="extrabold"
                  color={textColor}
                  lineHeight="1.2"
                  mb={4}
                >
                  UofT Stocker{" "}
                </Heading>
                <Text
                  fontSize="xl"
                  color={subtitleColor}
                  mb={4}
                  fontWeight="bold"
                  bgGradient="linear(to-r, #F59E0B, #F97316, #EF4444)"
                  bgClip="text"
                  textShadow="0 0 20px rgba(245, 158, 11, 0.3)"
                  animation="glow 2s ease-in-out infinite alternate"
                >
                  Reach for the top{" "}
                  <span
                    style={{
                      background: "none",
                      WebkitBackgroundClip: "initial",
                      WebkitTextFillColor: "initial",
                      color: "#FFD700",
                    }}
                  >
                    🚀
                  </span>
                </Text>
              </Box>

              <Box
                bg={tickerBg}
                p={6}
                borderRadius="xl"
                border={tickerBorder}
                w="full"
                backdropFilter="blur(10px)"
                position="relative"
                overflow="hidden"
              >
                <HStack justify="space-between" mb={6}>
                  <VStack align="start" spacing={1}>
                    <Text color={textColor} fontWeight="bold" fontSize="lg">
                      🏆 Monthly Contest
                    </Text>
                    <Text
                      color={subtitleColor}
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      Kickoff Contest
                    </Text>
                  </VStack>
                </HStack>

                <VStack spacing={4} align="start">
                  <HStack spacing={3} w="full">
                    <Box
                      w="3px"
                      h="40px"
                      bgGradient="linear(to-b, yellow.400, orange.500)"
                      borderRadius="full"
                    />
                    <VStack align="start" spacing={1}>
                      <Text
                        color={textColor}
                        fontWeight="semibold"
                        fontSize="sm"
                      >
                        $30,000 Starting Cash
                      </Text>
                      <Text color={subtitleColor} fontSize="xs">
                        Virtual money to trade with
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack spacing={3} w="full">
                    <Box
                      w="3px"
                      h="40px"
                      bgGradient="linear(to-b, blue.400, purple.500)"
                      borderRadius="full"
                    />
                    <VStack align="start" spacing={1}>
                      <Text
                        color={textColor}
                        fontWeight="semibold"
                        fontSize="sm"
                      >
                        Amazing Prizes
                      </Text>
                      <Text color={subtitleColor} fontSize="xs">
                        Win big at the end of the month
                      </Text>
                    </VStack>
                  </HStack>

                  <HStack spacing={3} w="full">
                    <Box
                      w="3px"
                      h="40px"
                      bgGradient="linear(to-b, green.400, teal.500)"
                      borderRadius="full"
                    />
                    <VStack align="start" spacing={1}>
                      <HStack spacing={2} align="center">
                        <Icon as={FaClock} color="green.400" boxSize={3} />
                        <Text
                          color={textColor}
                          fontWeight="semibold"
                          fontSize="sm"
                        >
                          Contest Ends In
                        </Text>
                      </HStack>
                      <Text color={subtitleColor} fontSize="xs">
                        {contestTimer.days}d{" "}
                        {contestTimer.hours.toString().padStart(2, "0")}h{" "}
                        {contestTimer.minutes.toString().padStart(2, "0")}m
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </GridItem>

          <GridItem>
            <Box
              bg={cardBg}
              p={8}
              borderRadius="2xl"
              boxShadow="2xl"
              border="1px solid rgba(255,255,255,0.1)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: useColorModeValue("blue.500", "blue.400"),
              }}
            >
              <Box mb={8}>
                <VStack spacing={4} align="center" textAlign="center" mb={6}>
                  <Heading size="lg" fontWeight="bold" color={textColor} mb={2}>
                    Welcome Back
                  </Heading>
                </VStack>

                <SimpleGrid columns={2} spacing={4}>
                  <Box
                    p={4}
                    bg={useColorModeValue("blue.50", "blue.800")}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={useColorModeValue("blue.200", "blue.500")}
                    textAlign="center"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top="-20px"
                      right="-20px"
                      w="60px"
                      h="60px"
                      bg={useColorModeValue("blue.400", "blue.400")}
                      borderRadius="full"
                      opacity={useColorModeValue("0.1", "0.2")}
                    />
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color={useColorModeValue("blue.600", "blue.300")}
                      mb={1}
                    >
                      50+
                    </Text>
                    <Text
                      fontSize="xs"
                      color={subtitleColor}
                      fontWeight="medium"
                    >
                      Active Students
                    </Text>
                  </Box>

                  <Box
                    p={4}
                    bg={useColorModeValue("green.50", "green.800")}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={useColorModeValue("green.200", "green.500")}
                    textAlign="center"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top="-20px"
                      right="-20px"
                      w="60px"
                      h="60px"
                      bg={useColorModeValue("green.400", "green.400")}
                      borderRadius="full"
                      opacity={useColorModeValue("0.1", "0.2")}
                    />
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color={useColorModeValue("green.600", "green.300")}
                      mb={1}
                    >
                      $1.2M
                    </Text>
                    <Text
                      fontSize="xs"
                      color={subtitleColor}
                      fontWeight="medium"
                    >
                      Total Trading Volume
                    </Text>
                  </Box>

                  <Box
                    p={4}
                    bg={useColorModeValue("purple.50", "purple.800")}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={useColorModeValue("purple.200", "purple.500")}
                    textAlign="center"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top="-20px"
                      right="-20px"
                      w="60px"
                      h="60px"
                      bg={useColorModeValue("purple.400", "purple.400")}
                      borderRadius="full"
                      opacity={useColorModeValue("0.1", "0.2")}
                    />
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color={useColorModeValue("purple.600", "purple.300")}
                      mb={1}
                    >
                      Lebron James
                    </Text>
                    <Text
                      fontSize="xs"
                      color={subtitleColor}
                      fontWeight="medium"
                    >
                      Daily Top Trader
                    </Text>
                  </Box>

                  <Box
                    p={4}
                    bg={useColorModeValue("orange.50", "orange.800")}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor={useColorModeValue("orange.200", "orange.500")}
                    textAlign="center"
                    position="relative"
                    overflow="hidden"
                  >
                    <Box
                      position="absolute"
                      top="-20px"
                      right="-20px"
                      w="60px"
                      h="60px"
                      bg={useColorModeValue("orange.400", "orange.400")}
                      borderRadius="full"
                      opacity={useColorModeValue("0.1", "0.2")}
                    />
                    <Text
                      fontSize="2xl"
                      fontWeight="bold"
                      color={useColorModeValue("orange.600", "orange.300")}
                      mb={1}
                    >
                      +12.4%
                    </Text>
                    <Text
                      fontSize="xs"
                      color={subtitleColor}
                      fontWeight="medium"
                    >
                      Average User Return
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>

              <Divider mb={8} />

              <VStack spacing={6}>
                <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                  <VStack spacing={6}>
                    <FormControl>
                      <FormLabel fontWeight="semibold" color={labelColor}>
                        <HStack spacing={2}>
                          <Icon as={FaUser} boxSize={4} />
                          <Text>Email Address</Text>
                        </HStack>
                      </FormLabel>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        size="lg"
                        borderRadius="lg"
                        borderWidth="2px"
                        bg={inputBg}
                        color={inputColor}
                        _focus={{
                          borderColor: accentColor,
                          boxShadow: "0 0 0 1px " + accentColor,
                          bg: inputFocusBg,
                        }}
                        _hover={{
                          bg: inputFocusBg,
                        }}
                        _placeholder={{
                          color: placeholderColor,
                        }}
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontWeight="semibold" color={labelColor}>
                        <HStack spacing={2}>
                          <Icon as={FaLock} boxSize={4} />
                          <Text>Password</Text>
                        </HStack>
                      </FormLabel>
                      <InputGroup size="lg">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          borderRadius="lg"
                          borderWidth="2px"
                          bg={inputBg}
                          color={inputColor}
                          _focus={{
                            borderColor: accentColor,
                            boxShadow: "0 0 0 1px " + accentColor,
                            bg: inputFocusBg,
                          }}
                          _hover={{
                            bg: inputFocusBg,
                          }}
                          _placeholder={{
                            color: placeholderColor,
                          }}
                        />
                        <InputRightElement width="3rem">
                          <Button
                            h="1.75rem"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            variant="ghost"
                            color={iconColor}
                          >
                            <Icon as={showPassword ? FaEyeSlash : FaEye} />
                          </Button>
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>

                    <HStack justify="space-between" w="full">
                      <ChakraLink
                        onClick={handleForgotPassword}
                        color={accentColor}
                        fontSize="sm"
                        fontWeight="medium"
                        _hover={{ textDecoration: "none", color: "blue.600" }}
                        cursor="pointer"
                      >
                        <HStack spacing={1}>
                          <Icon as={FaKey} boxSize={3} />
                          <Text>Forgot Password?</Text>
                        </HStack>
                      </ChakraLink>
                    </HStack>

                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="lg"
                      width="100%"
                      isLoading={loading}
                      borderRadius="lg"
                      fontWeight="bold"
                      fontSize="lg"
                      py={7}
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "lg",
                      }}
                      transition="all 0.2s"
                    >
                      {loading ? "Connecting..." : "Login"}
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      width="100%"
                      onClick={handleGuestMode}
                      borderRadius="lg"
                      fontWeight="bold"
                      fontSize="lg"
                      py={7}
                      borderWidth="2px"
                      borderColor={accentColor}
                      color={accentColor}
                      _hover={{
                        bg: accentColor,
                        color: "white",
                        transform: "translateY(-2px)",
                        boxShadow: "lg",
                      }}
                      transition="all 0.2s"
                    >
                      Continue as Guest
                    </Button>
                  </VStack>
                </form>

                <Divider />

                <HStack spacing={1} justify="center">
                  <Text color={subtitleColor}>New?</Text>
                  <ChakraLink
                    as={Link}
                    to="/signup"
                    color={accentColor}
                    fontWeight="semibold"
                    _hover={{ textDecoration: "none", color: "blue.600" }}
                  >
                    Sign Up
                  </ChakraLink>
                </HStack>
              </VStack>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}

export default Login;
