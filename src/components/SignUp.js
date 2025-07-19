import React, { useState } from "react";
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
  Select,
  SimpleGrid,
  HStack,
  Flex,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { TOAST_DURATIONS } from "../constants/toast";
import {
  FaEye,
  FaEyeSlash,
  FaUserGraduate,
  FaShieldAlt,
  FaTrophy,
} from "react-icons/fa";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { MAJORS, STUDY_YEARS } from "../constants/majors";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [major, setMajor] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const accentColor = useColorModeValue("blue.500", "blue.300");

  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.600", "gray.300");
  const labelColor = useColorModeValue("gray.700", "gray.200");
  const inputBg = useColorModeValue("gray.50", "gray.700");
  const inputColor = useColorModeValue("gray.800", "white");
  const inputFocusBg = useColorModeValue("white", "gray.600");
  const placeholderColor = useColorModeValue("gray.500", "gray.400");
  const iconColor = useColorModeValue("gray.500", "gray.300");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        duration: TOAST_DURATIONS.LONG,
        isClosable: true,
      });
    }

    try {
      setLoading(true);
      const userCredential = await signup(email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        firstName,
        lastName,
        major,
        studyYear,
        createdAt: new Date().toISOString(),
        balance: 30000,
        emailVerified: false,
      });

      toast({
        title: "Account Created Successfully!",
        description:
          "Please check your email and verify your account to start trading.",
        status: "success",
        duration: TOAST_DURATIONS.LONG,
        isClosable: true,
      });

      navigate("/email-verification");
    } catch (error) {
      let errorMessage = error.message;

      if (error.code === "auth/weak-password") {
        errorMessage =
          "Password should be at least 6 characters long. Please choose a stronger password.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage =
          "An account with this email already exists. Please try logging in instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: TOAST_DURATIONS.LONG,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue("gray.50", "gray.900")}>
      <Container maxW="7xl" py={8}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          minH="90vh"
          bg={useColorModeValue("white", "gray.800")}
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="2xl"
        >
          <Box
            flex="1"
            bg={useColorModeValue("blue.50", "blue.900")}
            p={12}
            display="flex"
            flexDirection="column"
            justifyContent="center"
            position="relative"
            overflow="hidden"
          >
            <VStack spacing={8} align="start" maxW="md">
              <Box>
                <Badge
                  colorScheme="blue"
                  mb={4}
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  Join the Community
                </Badge>
                <Heading
                  size="2xl"
                  fontWeight="extrabold"
                  color={useColorModeValue("blue.600", "blue.300")}
                  lineHeight="1.2"
                >
                  Start Your Trading Journey
                </Heading>
                <Text fontSize="lg" color={subtitleColor} mt={4}>
                  Showcase your market dominance against others
                </Text>
              </Box>

              <VStack spacing={6} align="start" w="full">
                <HStack spacing={4}>
                  <Box
                    p={3}
                    bg={useColorModeValue("green.100", "green.900")}
                    borderRadius="lg"
                    color={useColorModeValue("green.700", "green.300")}
                  >
                    <Icon as={FaUserGraduate} boxSize={5} />
                  </Box>
                  <Box>
                    <Text
                      fontWeight="semibold"
                      color={useColorModeValue("green.700", "green.300")}
                    >
                      Student Community
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Connect with fellow students on the leaderboard
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={4}>
                  <Box
                    p={3}
                    bg={useColorModeValue("purple.100", "purple.900")}
                    borderRadius="lg"
                    color={useColorModeValue("purple.700", "purple.300")}
                  >
                    <Icon as={FaShieldAlt} boxSize={5} />
                  </Box>
                  <Box>
                    <Text
                      fontWeight="semibold"
                      color={useColorModeValue("purple.700", "purple.300")}
                    >
                      Risk-Free Learning
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Practice trading with virtual money and no risk
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={4}>
                  <Box
                    p={3}
                    bg={useColorModeValue("orange.100", "orange.900")}
                    borderRadius="lg"
                    color={useColorModeValue("orange.700", "orange.300")}
                  >
                    <Icon as={FaTrophy} boxSize={5} />
                  </Box>
                  <Box>
                    <Text
                      fontWeight="semibold"
                      color={useColorModeValue("orange.700", "orange.300")}
                    >
                      Win Prizes
                    </Text>
                    <Text fontSize="sm" color={subtitleColor}>
                      Participate in monthly competitions and win prizes
                    </Text>
                  </Box>
                </HStack>
              </VStack>
            </VStack>
          </Box>

          <Box flex="1" p={12} display="flex" alignItems="center">
            <VStack spacing={8} w="full" maxW="md" mx="auto">
              <Box textAlign="center" w="full">
                <Heading size="xl" fontWeight="bold" color={textColor} mb={2}>
                  Create Account
                </Heading>
                <Text color={subtitleColor} mb={4}>
                  Join and compete against hundreds of students
                </Text>
              </Box>

              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack spacing={6}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color={labelColor}>
                        First Name
                      </FormLabel>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
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
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color={labelColor}>
                        Last Name
                      </FormLabel>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
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
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color={labelColor}>
                      Email Address
                    </FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="lg"
                      borderRadius="lg"
                      borderWidth="2px"
                      placeholder="your.email@example.com"
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

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color={labelColor}>
                        Major
                      </FormLabel>
                      <Select
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
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
                      >
                        <option value="">Select Major</option>
                        {MAJORS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel fontWeight="semibold" color={labelColor}>
                        Study Year
                      </FormLabel>
                      <Select
                        value={studyYear}
                        onChange={(e) => setStudyYear(e.target.value)}
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
                      >
                        <option value="">Select Year</option>
                        {STUDY_YEARS.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color={labelColor}>
                      Password
                    </FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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

                  <FormControl isRequired>
                    <FormLabel fontWeight="semibold" color={labelColor}>
                      Confirm Password
                    </FormLabel>
                    <InputGroup size="lg">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          variant="ghost"
                          color={iconColor}
                        >
                          <Icon as={showConfirmPassword ? FaEyeSlash : FaEye} />
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

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
                    Create Account
                  </Button>
                </VStack>
              </form>

              <Divider />

              <HStack spacing={1} justify="center">
                <Text color={subtitleColor}>Already have an account?</Text>
                <ChakraLink
                  as={Link}
                  to="/login"
                  color={accentColor}
                  fontWeight="semibold"
                  _hover={{ textDecoration: "none", color: "blue.600" }}
                >
                  Sign in
                </ChakraLink>
              </HStack>
            </VStack>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

export default SignUp;
