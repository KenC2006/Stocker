import React, { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Button,
  Heading,
  Container,
  useColorModeValue,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  useColorMode,
  Text,
  MenuDivider,
  Switch,
  MenuGroup,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Link as ChakraLink,
  FormControl,
  FormLabel,
  Input,
  ModalFooter,
  useToast,
  Divider,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Select,
  Textarea,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaChartLine,
  FaExchangeAlt,
  FaTrophy,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaUser,
  FaQuestionCircle,
  FaEnvelope,
  FaGithub,
  FaLinkedin,
  FaTrash,
  FaKey,
  FaUniversity,
} from "react-icons/fa";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  getAuth,
  sendPasswordResetEmail,
  deleteUser,
  GoogleAuthProvider,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { MAJORS, STUDY_YEARS } from "../constants/majors";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    major: "",
    studyYear: "",
    bio: "",
    linkedinUrl: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [isReauthModalOpen, setIsReauthModalOpen] = useState(false);
  const [isReauthenticating, setIsReauthenticating] = useState(false);

  const {
    isOpen: isHelpOpen,
    onOpen: onHelpOpen,
    onClose: onHelpClose,
  } = useDisclosure();
  const {
    isOpen: isAccountOpen,
    onOpen: onAccountOpen,
    onClose: onAccountClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();

  const navBg = useColorModeValue(
    "rgba(255,255,255,0.85)",
    "rgba(26,32,44,0.85)"
  );
  const navShadow = useColorModeValue("lg", "dark-lg");
  const navBorder = useColorModeValue("gray.200", "gray.700");
  const navButtonBg = useColorModeValue(
    "linear(to-r, blue.400, blue.600)",
    "linear(to-r, blue.700, blue.900)"
  );
  const navButtonHover = useColorModeValue("blue.600", "blue.400");
  const navTextColor = useColorModeValue("uoft.navy", "white");
  const menuItemTextColor = useColorModeValue("gray.700", "gray.200");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.600");
  const mainTextColor = useColorModeValue("uoft.navy", "white");
  const subTextColor = useColorModeValue("gray.700", "gray.200");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const formInputBg = useColorModeValue("white", "gray.600");
  const formInputBorder = useColorModeValue("gray.200", "gray.700");
  const formInputHoverBorder = useColorModeValue("blue.400", "blue.400");
  const formInputFocusBorder = useColorModeValue("blue.400", "blue.400");
  const formInputFocusShadow = "0 0 0 1px var(--chakra-colors-blue-400)";
  const bioTextBg = useColorModeValue("white", "gray.600");

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserInfo({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            major: data.major || "",
            studyYear: data.studyYear || "",
            bio: data.bio || "",
            linkedinUrl: data.linkedinUrl || "",
          });
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
        toast({
          title: "Error",
          description: "Failed to load profile information.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchUserInfo();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleDeleteAccount = () => {
    if (!currentUser) return;
    setIsReauthModalOpen(true);
  };

  const confirmReauthAndDelete = async () => {
    if (!currentUser) return;
    setIsReauthenticating(true);
    try {
      const providerData = currentUser.providerData[0];
      if (providerData && providerData.providerId === "google.com") {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(currentUser, provider);
      } else if (providerData && providerData.providerId === "password") {
        if (!reauthPassword) {
          toast({
            title: "Password required",
            description: "Please enter your password to confirm.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setIsReauthenticating(false);
          return;
        }
        const credential = EmailAuthProvider.credential(
          currentUser.email,
          reauthPassword
        );
        await reauthenticateWithCredential(currentUser, credential);
      }
      const batch = writeBatch(db);
      const userRef = doc(db, "users", currentUser.uid);
      batch.delete(userRef);
      const stocksQuery = query(
        collection(db, "stocks"),
        where("userId", "==", currentUser.uid)
      );
      const stocksSnapshot = await getDocs(stocksQuery);
      stocksSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("userId", "==", currentUser.uid)
      );
      const transactionsSnapshot = await getDocs(transactionsQuery);
      transactionsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      await deleteUser(currentUser);

      // Close all modals
      setIsReauthModalOpen(false);
      onAccountClose();
      onDeleteClose();

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Navigate to login page
      navigate("/login");
    } catch (error) {
      if (error.code === "auth/wrong-password") {
        toast({
          title: "Wrong password",
          description: "The password you entered is incorrect.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else if (error.code === "auth/popup-closed-by-user") {
        toast({
          title: "Cancelled",
          description: "Google re-authentication was cancelled.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
      console.error("Error during re-auth/delete:", error);
    } finally {
      setIsReauthenticating(false);
      setReauthPassword("");
    }
  };

  const handlePasswordChange = async () => {
    if (!currentUser) return;

    try {
      await sendPasswordResetEmail(getAuth(), currentUser.email);
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for password reset instructions",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error sending password reset email:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateInfo = async () => {
    if (!currentUser) return;

    setIsUpdating(true);
    try {
      const batch = writeBatch(db);
      const userRef = doc(db, "users", currentUser.uid);

      batch.update(userRef, {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        major: userInfo.major,
        studyYear: userInfo.studyYear,
        bio: userInfo.bio,
        linkedinUrl: userInfo.linkedinUrl,
        lastUpdated: serverTimestamp(),
      });

      await batch.commit();

      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        bg={navBg}
        boxShadow={navShadow}
        borderBottom="1px"
        borderColor={navBorder}
        backdropFilter="blur(10px)"
      >
        <Container maxW="7xl">
          <Flex py={4} align="center">
            <Link to="/dashboard">
              <HStack spacing={4}>
                <Icon as={FaUniversity} color="blue.600" boxSize={8} />
                <Heading
                  size="lg"
                  bgGradient="linear(to-r, blue.400, blue.600)"
                  bgClip="text"
                  fontWeight="extrabold"
                  letterSpacing="tight"
                >
                  UofT Stocker
                </Heading>
              </HStack>
            </Link>

            {currentUser && (
              <HStack spacing={1} ml="auto">
                <Button
                  as={Link}
                  to="/dashboard"
                  leftIcon={<FaChartLine />}
                  borderRadius="full"
                  px={6}
                  py={2}
                  fontSize="md"
                  fontWeight={isActive("/dashboard") ? "bold" : "normal"}
                  bgGradient={isActive("/dashboard") ? navButtonBg : undefined}
                  color={isActive("/dashboard") ? "white" : navTextColor}
                  _hover={{
                    bg: navButtonHover,
                    color: "white",
                    boxShadow: "md",
                  }}
                  transition="all 0.2s"
                  variant={isActive("/dashboard") ? "solid" : "ghost"}
                >
                  Dashboard
                </Button>
                <Button
                  as={Link}
                  to="/trading"
                  leftIcon={<FaExchangeAlt />}
                  borderRadius="full"
                  px={6}
                  py={2}
                  fontSize="md"
                  fontWeight={isActive("/trading") ? "bold" : "normal"}
                  bgGradient={isActive("/trading") ? navButtonBg : undefined}
                  color={isActive("/trading") ? "white" : navTextColor}
                  _hover={{
                    bg: navButtonHover,
                    color: "white",
                    boxShadow: "md",
                  }}
                  transition="all 0.2s"
                  variant={isActive("/trading") ? "solid" : "ghost"}
                >
                  Trading
                </Button>
                <Button
                  as={Link}
                  to="/leaderboard"
                  leftIcon={<FaTrophy />}
                  borderRadius="full"
                  px={6}
                  py={2}
                  fontSize="md"
                  fontWeight={isActive("/leaderboard") ? "bold" : "normal"}
                  bgGradient={
                    isActive("/leaderboard") ? navButtonBg : undefined
                  }
                  color={isActive("/leaderboard") ? "white" : navTextColor}
                  _hover={{
                    bg: navButtonHover,
                    color: "white",
                    boxShadow: "md",
                  }}
                  transition="all 0.2s"
                  variant={isActive("/leaderboard") ? "solid" : "ghost"}
                >
                  Leaderboard
                </Button>
                <Menu>
                  <MenuButton
                    as={Button}
                    borderRadius="full"
                    px={2}
                    py={2}
                    bg="transparent"
                    _hover={{}}
                    _focus={{}}
                    _active={{}}
                    _dark={{
                      _hover: {},
                      _focus: {},
                      _active: {},
                    }}
                    minW={0}
                  >
                    <Avatar
                      size="sm"
                      name={
                        currentUser?.displayName ||
                        currentUser?.email?.charAt(0)?.toUpperCase() ||
                        "U"
                      }
                      bg="blue.400"
                      color="white"
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuGroup title="Profile">
                      <MenuItem
                        icon={<Icon as={FaUser} />}
                        onClick={onAccountOpen}
                        color={menuItemTextColor}
                      >
                        My Account
                      </MenuItem>
                    </MenuGroup>
                    <MenuDivider />
                    <MenuGroup title="Settings">
                      <MenuItem closeOnSelect={false} color={menuItemTextColor}>
                        <Flex
                          justify="space-between"
                          align="center"
                          width="100%"
                        >
                          <HStack>
                            <Icon as={colorMode === "light" ? FaMoon : FaSun} />
                            <Text>Dark Mode</Text>
                          </HStack>
                          <Switch
                            isChecked={colorMode === "dark"}
                            onChange={toggleColorMode}
                            colorScheme="blue"
                          />
                        </Flex>
                      </MenuItem>
                      <MenuItem
                        icon={<Icon as={FaQuestionCircle} />}
                        onClick={onHelpOpen}
                        color={menuItemTextColor}
                      >
                        Help & Support
                      </MenuItem>
                    </MenuGroup>
                    <MenuDivider />
                    <MenuItem
                      icon={<Icon as={FaSignOutAlt} />}
                      onClick={handleLogout}
                      color="red.500"
                    >
                      Logout
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            )}
          </Flex>
        </Container>
      </Box>

      <Modal isOpen={isHelpOpen} onClose={onHelpClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBg} borderColor={modalBorder} borderWidth="1px">
          <ModalHeader color={navTextColor}>Contact & Support</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <HStack spacing={3} mb={2}>
                  <Icon as={FaEnvelope} color="blue.500" boxSize={5} />
                  <Text fontWeight="bold" color={menuItemTextColor}>
                    Email Support
                  </Text>
                </HStack>
                <ChakraLink
                  href="mailto:uoftstocker@gmail.com"
                  color="blue.500"
                >
                  uoftstocker@gmail.com
                </ChakraLink>
              </Box>

              <Box>
                <HStack spacing={3} mb={2}>
                  <Icon as={FaGithub} color="blue.500" boxSize={5} />
                  <Text fontWeight="bold" color={menuItemTextColor}>
                    GitHub
                  </Text>
                </HStack>
                <ChakraLink
                  href="https://github.com/uoftstocker"
                  isExternal
                  color="blue.500"
                >
                  github.com/uoftstocker
                </ChakraLink>
              </Box>

              <Box>
                <HStack spacing={3} mb={2}>
                  <Icon as={FaLinkedin} color="blue.500" boxSize={5} />
                  <Text fontWeight="bold" color={menuItemTextColor}>
                    LinkedIn
                  </Text>
                </HStack>
                <ChakraLink
                  href="https://linkedin.com/company/uoftstocker"
                  isExternal
                  color="blue.500"
                >
                  linkedin.com/company/uoftstocker
                </ChakraLink>
              </Box>

              <Text fontSize="sm" color={menuItemTextColor} mt={4}>
                For technical support or general inquiries, please email us or
                reach out through our social media channels. We typically
                respond within 24 hours.
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isAccountOpen} onClose={onAccountClose} size="md">
        <ModalOverlay />
        <ModalContent bg={modalBg} borderColor={modalBorder} borderWidth="1px">
          <ModalHeader color={navTextColor}>Account Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box mb={6}>
                <HStack spacing={3} mb={4}>
                  <Icon as={FaUser} color="blue.500" boxSize={5} />
                  <Heading size="md" color={mainTextColor}>
                    Profile Information
                  </Heading>
                </HStack>
                <Box
                  bg={useColorModeValue("gray.50", "gray.700")}
                  p={6}
                  borderRadius="lg"
                  border="1px"
                  borderColor={borderColor}
                >
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel color={subTextColor} fontWeight="medium">
                          First Name
                        </FormLabel>
                        {isEditing ? (
                          <Input
                            value={userInfo.firstName}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                firstName: e.target.value,
                              })
                            }
                            bg={formInputBg}
                            borderColor={formInputBorder}
                            _hover={{ borderColor: formInputHoverBorder }}
                            _focus={{
                              borderColor: formInputFocusBorder,
                              boxShadow: formInputFocusShadow,
                            }}
                          />
                        ) : (
                          <Text
                            color={mainTextColor}
                            fontSize="md"
                            fontWeight="medium"
                          >
                            {userInfo.firstName}
                          </Text>
                        )}
                      </FormControl>

                      <FormControl>
                        <FormLabel color={subTextColor} fontWeight="medium">
                          Last Name
                        </FormLabel>
                        {isEditing ? (
                          <Input
                            value={userInfo.lastName}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                lastName: e.target.value,
                              })
                            }
                            bg={formInputBg}
                            borderColor={formInputBorder}
                            _hover={{ borderColor: formInputHoverBorder }}
                            _focus={{
                              borderColor: formInputFocusBorder,
                              boxShadow: formInputFocusShadow,
                            }}
                          />
                        ) : (
                          <Text
                            color={mainTextColor}
                            fontSize="md"
                            fontWeight="medium"
                          >
                            {userInfo.lastName}
                          </Text>
                        )}
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel color={subTextColor} fontWeight="medium">
                          Major
                        </FormLabel>
                        {isEditing ? (
                          <Select
                            value={userInfo.major}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                major: e.target.value,
                              })
                            }
                            bg={formInputBg}
                            borderColor={formInputBorder}
                            _hover={{ borderColor: formInputHoverBorder }}
                            _focus={{
                              borderColor: formInputFocusBorder,
                              boxShadow: formInputFocusShadow,
                            }}
                          >
                            <option value="">Select Major</option>
                            {MAJORS.map((major) => (
                              <option key={major} value={major}>
                                {major}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Text
                            color={mainTextColor}
                            fontSize="md"
                            fontWeight="medium"
                          >
                            {userInfo.major}
                          </Text>
                        )}
                      </FormControl>

                      <FormControl>
                        <FormLabel color={subTextColor} fontWeight="medium">
                          Study Year
                        </FormLabel>
                        {isEditing ? (
                          <Select
                            value={userInfo.studyYear}
                            onChange={(e) =>
                              setUserInfo({
                                ...userInfo,
                                studyYear: e.target.value,
                              })
                            }
                            bg={formInputBg}
                            borderColor={formInputBorder}
                            _hover={{ borderColor: formInputHoverBorder }}
                            _focus={{
                              borderColor: formInputFocusBorder,
                              boxShadow: formInputFocusShadow,
                            }}
                          >
                            <option value="">Select Year</option>
                            {STUDY_YEARS.map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Text
                            color={mainTextColor}
                            fontSize="md"
                            fontWeight="medium"
                          >
                            {userInfo.studyYear}
                          </Text>
                        )}
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel color={subTextColor} fontWeight="medium">
                        Bio
                      </FormLabel>
                      {isEditing ? (
                        <Textarea
                          value={userInfo.bio}
                          onChange={(e) =>
                            setUserInfo({ ...userInfo, bio: e.target.value })
                          }
                          placeholder="Tell us about yourself..."
                          bg={formInputBg}
                          borderColor={formInputBorder}
                          _hover={{ borderColor: formInputHoverBorder }}
                          _focus={{
                            borderColor: formInputFocusBorder,
                            boxShadow: formInputFocusShadow,
                          }}
                          rows={4}
                        />
                      ) : (
                        <Text
                          color={mainTextColor}
                          bg={bioTextBg}
                          p={4}
                          borderRadius="md"
                          whiteSpace="pre-wrap"
                          fontSize="md"
                          border="1px"
                          borderColor={borderColor}
                        >
                          {userInfo.bio || "No bio available"}
                        </Text>
                      )}
                    </FormControl>

                    <FormControl>
                      <FormLabel color={subTextColor} fontWeight="medium">
                        LinkedIn Profile
                      </FormLabel>
                      {isEditing ? (
                        <Input
                          value={userInfo.linkedinUrl}
                          onChange={(e) =>
                            setUserInfo({
                              ...userInfo,
                              linkedinUrl: e.target.value,
                            })
                          }
                          placeholder="https://linkedin.com/in/your-profile"
                          bg={formInputBg}
                          borderColor={formInputBorder}
                          _hover={{ borderColor: formInputHoverBorder }}
                          _focus={{
                            borderColor: formInputFocusBorder,
                            boxShadow: formInputFocusShadow,
                          }}
                        />
                      ) : userInfo.linkedinUrl ? (
                        <ChakraLink
                          href={userInfo.linkedinUrl}
                          isExternal
                          color="blue.500"
                          _hover={{ textDecoration: "underline" }}
                          fontSize="md"
                        >
                          <HStack spacing={2}>
                            <Icon as={FaLinkedin} />
                            <Text>View LinkedIn Profile</Text>
                          </HStack>
                        </ChakraLink>
                      ) : (
                        <Text color={subTextColor} fontSize="md">
                          No LinkedIn profile added
                        </Text>
                      )}
                    </FormControl>
                  </VStack>
                </Box>

                {isEditing ? (
                  <HStack spacing={4} mt={4}>
                    <Button
                      colorScheme="blue"
                      onClick={handleUpdateInfo}
                      isLoading={isUpdating}
                      flex={1}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      flex={1}
                    >
                      Cancel
                    </Button>
                  </HStack>
                ) : (
                  <Button
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    mt={4}
                    width="100%"
                  >
                    Edit Information
                  </Button>
                )}
              </Box>

              <Divider />

              <Box>
                <HStack spacing={3} mb={4}>
                  <Icon as={FaKey} color="blue.500" boxSize={5} />
                  <Text fontWeight="bold" color={menuItemTextColor}>
                    Security
                  </Text>
                </HStack>
                <Button
                  width="100%"
                  variant="outline"
                  colorScheme="blue"
                  onClick={handlePasswordChange}
                >
                  Change Password
                </Button>
              </Box>

              <Divider />

              <Box>
                <HStack spacing={3} mb={4}>
                  <Icon as={FaTrash} color="red.500" boxSize={5} />
                  <Text fontWeight="bold" color={menuItemTextColor}>
                    Danger Zone
                  </Text>
                </HStack>
                <VStack spacing={4} align="stretch">
                  <Button
                    width="100%"
                    colorScheme="red"
                    variant="outline"
                    onClick={onDeleteOpen}
                    leftIcon={<Icon as={FaTrash} />}
                  >
                    Delete Account
                  </Button>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onAccountClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={modalBg}>
            <AlertDialogHeader
              fontSize="lg"
              fontWeight="bold"
              color={navTextColor}
            >
              Delete Account
            </AlertDialogHeader>

            <AlertDialogBody color={menuItemTextColor}>
              Are you sure? This action cannot be undone. All your data,
              including trading history and portfolio, will be permanently
              deleted.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleDeleteAccount}
                ml={3}
                isLoading={isReauthenticating}
              >
                Delete Account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {isReauthModalOpen && currentUser && (
        <Modal
          isOpen={isReauthModalOpen}
          onClose={() => setIsReauthModalOpen(false)}
          isCentered
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Account Deletion</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {currentUser.providerData &&
              currentUser.providerData[0]?.providerId === "password" ? (
                <VStack spacing={4}>
                  <Text>
                    Please enter your password to confirm account deletion.
                  </Text>
                  <Input
                    type="password"
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </VStack>
              ) : (
                <Text>
                  You'll be asked to re-authenticate with Google before deleting
                  your account.
                </Text>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={() => setIsReauthModalOpen(false)} mr={3}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmReauthAndDelete}
                isLoading={isReauthenticating}
              >
                Confirm Delete
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}

export default Navbar;
