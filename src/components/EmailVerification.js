import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  useColorModeValue,
  Icon,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  Link as ChakraLink,
} from "@chakra-ui/react";
import {
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth } from "../config/firebase";
import { updateVerificationStatus } from "../utils/auth";

function EmailVerification() {
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("pending");

  const {
    currentUser,
    resendVerificationEmail,
    checkEmailVerification,
    verifyEmail,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.800", "white");
  const subtitleColor = useColorModeValue("gray.600", "gray.300");
  const accentColor = useColorModeValue("blue.500", "blue.300");
  const emailBg = useColorModeValue("gray.100", "gray.700");

  const handleEmailVerification = useCallback(
    async (actionCode) => {
      setIsChecking(true);
      try {
        await verifyEmail(actionCode);

        const user = auth.currentUser;
        if (user) {
          await user.reload();

          try {
            const success = await updateVerificationStatus(
              user.uid,
              user.email
            );
            if (!success) {
              toast({
                title: "Warning",
                description:
                  "Email verified but profile update failed. Please try logging in again.",
                status: "warning",
                duration: 5000,
                isClosable: true,
              });
            }
          } catch (firestoreError) {
            toast({
              title: "Warning",
              description:
                "Email verified but profile update failed. Please try logging in again.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        }

        setVerificationStatus("success");
        toast({
          title: "Email Verified!",
          description:
            "Your email has been successfully verified. You can now access all features.",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } catch (error) {
        setVerificationStatus("error");
        toast({
          title: "Verification Failed",
          description:
            error.message || "Failed to verify email. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsChecking(false);
      }
    },
    [verifyEmail, navigate, toast]
  );

  useEffect(() => {
    const actionCode = searchParams.get("oobCode");
    if (actionCode) {
      handleEmailVerification(actionCode);
    }
  }, [searchParams, handleEmailVerification]);

  useEffect(() => {
    if (currentUser?.emailVerified) {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  const handleResendEmail = async () => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No user found. Please log in again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (currentUser.emailVerified) {
      toast({
        title: "Already Verified",
        description: "Your email is already verified.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationEmail();
      toast({
        title: "Verification Email Sent",
        description:
          "A new verification email has been sent to your inbox. Please check your email and spam folder.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to Send Email",
        description:
          error.message ||
          "Failed to send verification email. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      if (!currentUser) {
        toast({
          title: "No User Found",
          description: "Please log in again to check verification status.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const isVerified = await checkEmailVerification();
      if (isVerified) {
        try {
          const success = await updateVerificationStatus(
            currentUser.uid,
            currentUser.email
          );
          if (!success) {
            toast({
              title: "Warning",
              description:
                "Email verified but profile update failed. Please try logging in again.",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        } catch (firestoreError) {
          toast({
            title: "Warning",
            description:
              "Email verified but profile update failed. Please try logging in again.",
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }

        setVerificationStatus("success");
        toast({
          title: "Email Verified!",
          description:
            "Your email has been verified. Redirecting to dashboard...",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        toast({
          title: "Email Not Verified",
          description:
            "Please check your email and click the verification link.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to check verification status.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsChecking(false);
    }
  };

  if (!currentUser) {
    return (
      <Box
        minH="100vh"
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxW="md">
          <VStack spacing={6} textAlign="center">
            <Spinner size="lg" color={accentColor} />
            <Text color={subtitleColor}>Loading verification status...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (verificationStatus === "success") {
    return (
      <Box
        minH="100vh"
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxW="md">
          <VStack spacing={6} textAlign="center">
            <Icon as={FaCheckCircle} boxSize={16} color="green.500" />
            <Heading size="lg" color={textColor}>
              Email Verified Successfully!
            </Heading>
            <Text color={subtitleColor}>
              Your account has been activated. Redirecting to dashboard...
            </Text>
            <Spinner size="lg" color={accentColor} />
          </VStack>
        </Container>
      </Box>
    );
  }

  if (verificationStatus === "error") {
    return (
      <Box
        minH="100vh"
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Container maxW="md">
          <VStack spacing={6} textAlign="center">
            <Icon as={FaExclamationTriangle} boxSize={16} color="red.500" />
            <Heading size="lg" color={textColor}>
              Verification Failed
            </Heading>
            <Text color={subtitleColor}>
              The verification link may have expired or is invalid.
            </Text>
            <Button
              colorScheme="blue"
              onClick={() => {
                setVerificationStatus("pending");
                navigate("/email-verification");
              }}
            >
              Try Again
            </Button>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="md">
        <Box
          bg={cardBg}
          p={8}
          borderRadius="2xl"
          boxShadow="2xl"
          textAlign="center"
        >
          <VStack spacing={6}>
            <Icon as={FaEnvelope} boxSize={16} color={accentColor} />

            <VStack spacing={3}>
              <Heading size="lg" color={textColor}>
                Verify Your Email
              </Heading>
              <Text color={subtitleColor} fontSize="lg">
                We've sent a verification email to:
              </Text>
              <Text
                fontWeight="bold"
                color={textColor}
                fontSize="lg"
                bg={emailBg}
                px={4}
                py={2}
                borderRadius="md"
              >
                {currentUser?.email}
              </Text>
            </VStack>

            <Alert status="info" borderRadius="lg">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" fontSize="sm">
                  Check Your Email
                </Text>
                <Text fontSize="sm">
                  Click the verification link in your email to activate your
                  account and start trading!
                </Text>
                <Text fontSize="xs" color="orange.600" fontWeight="medium">
                  💡 Check your spam folder if you don't see the email!
                </Text>
              </VStack>
            </Alert>

            <VStack spacing={4} w="full">
              <Button
                colorScheme="blue"
                size="lg"
                w="full"
                onClick={handleCheckVerification}
                isLoading={isChecking}
                loadingText="Checking..."
              >
                I've Verified My Email
              </Button>

              <HStack spacing={4} w="full">
                <Button
                  variant="outline"
                  flex={1}
                  onClick={handleResendEmail}
                  isLoading={isResending}
                  loadingText="Sending..."
                >
                  Resend Email
                </Button>

                <Button
                  variant="ghost"
                  flex={1}
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Back to Login
                </Button>
              </HStack>
            </VStack>

            <Text fontSize="sm" color={subtitleColor} textAlign="center">
              Didn't receive the email? Check your spam folder or{" "}
              <ChakraLink color={accentColor} onClick={handleResendEmail}>
                request a new one
              </ChakraLink>
              .
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}

export default EmailVerification;
