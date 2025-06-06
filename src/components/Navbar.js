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
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  HStack,
  useColorMode,
  Text,
  Tooltip,
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
  FaUserEdit,
} from "react-icons/fa";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
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

  // Move all useColorModeValue hooks to the top level
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
  const menuButtonHoverBg = useColorModeValue("gray.100", "gray.700");
  const navTextColor = useColorModeValue("uoft.navy", "white");
  const menuItemTextColor = useColorModeValue("gray.700", "gray.200");
  const modalBg = useColorModeValue("white", "gray.800");
  const modalBorder = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  const handleDeleteAccount = () => {
    // Placeholder for delete account functionality
    toast({
      title: "Not Implemented",
      description: "Account deletion functionality is not yet implemented.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
    onDeleteClose();
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
              <Heading
                size="lg"
                bgGradient="linear(to-r, blue.400, blue.600)"
                bgClip="text"
                fontWeight="extrabold"
                letterSpacing="tight"
              >
                UofT Stocker
              </Heading>
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
                    _hover={{ bg: menuButtonHoverBg }}
                    minW={0}
                  >
                    <Avatar
                      size="sm"
                      name={currentUser.displayName || currentUser.email || "U"}
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

      {/* Help & Support Modal */}
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
                  href="mailto:support@uoftstocker.com"
                  color="blue.500"
                >
                  support@uoftstocker.com
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

      {/* Account Settings Modal */}
      <Modal isOpen={isAccountOpen} onClose={onAccountClose} size="md">
        <ModalOverlay />
        <ModalContent bg={modalBg} borderColor={modalBorder} borderWidth="1px">
          <ModalHeader color={navTextColor}>Account Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6} align="stretch">
              <Box>
                <HStack spacing={3} mb={4}>
                  <Icon as={FaUserEdit} color="blue.500" boxSize={5} />
                  <Text fontWeight="bold" color={menuItemTextColor}>
                    Profile Information
                  </Text>
                </HStack>
                <FormControl>
                  <FormLabel color={menuItemTextColor}>Display Name</FormLabel>
                  <Input
                    placeholder={
                      currentUser.displayName || "Set your display name"
                    }
                    bg={inputBg}
                    isDisabled
                  />
                </FormControl>
                <FormControl mt={4}>
                  <FormLabel color={menuItemTextColor}>Email</FormLabel>
                  <Input value={currentUser.email} isReadOnly bg={inputBg} />
                </FormControl>
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
                  isDisabled
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
                <Button
                  width="100%"
                  colorScheme="red"
                  variant="outline"
                  onClick={onDeleteOpen}
                >
                  Delete Account
                </Button>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onAccountClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Account Confirmation Dialog */}
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
              <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                Delete Account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}

export default Navbar;
