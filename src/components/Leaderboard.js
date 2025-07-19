import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  VStack,
  Text,
  Badge,
  Box,
  useColorModeValue,
  Skeleton,
  TableContainer,
  Tag,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  HStack,
  Avatar,
  Divider,
  Icon,
  Link,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Flex,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  FaTrophy,
  FaGraduationCap,
  FaInfoCircle,
  FaLinkedin,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
} from "react-icons/fa";
import { MAJOR_COLORS } from "../constants/majors";
import { useAuth } from "../contexts/AuthContext";
import { Link as RouterLink } from "react-router-dom";

const MotionTr = motion(Tr);

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { guestMode, exitGuestMode } = useAuth();

  const headerBgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mainTextColor = useColorModeValue("uoft.navy", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.200");
  const pageBgColor = useColorModeValue("gray.50", "gray.900");
  const cardBgColor = useColorModeValue("white", "gray.800");
  const timerGradient = useColorModeValue(
    "linear(to-r, blue.100, blue.300)",
    "linear(to-r, blue.700, blue.900)"
  );
  const timerNumberColor = useColorModeValue("blue.800", "white");
  const timerLabelColor = useColorModeValue("uoft.navy", "white");
  const timerSubColor = useColorModeValue("gray.600", "gray.200");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");
  const guestAlertBg = useColorModeValue("blue.50", "blue.900");
  const guestAlertBorder = useColorModeValue("blue.200", "blue.700");

  const getNextReset = () => {
    const now = new Date();
    const torontoNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Toronto" })
    );
    const next = new Date(torontoNow);
    next.setHours(2, 0, 0, 0);
    if (torontoNow >= next) {
      next.setDate(next.getDate() + 1);
    }
    return next - torontoNow;
  };

  const formatTime = (ms) => {
    let totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    totalSeconds %= 3600;
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const fetchLeaderboardData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const leaderboardEntries = usersSnapshot.docs
        .map((doc) => {
          const userData = doc.data();
          return {
            userId: doc.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            major: userData.major,
            studyYear: userData.studyYear,
            bio: userData.bio,
            linkedinUrl: userData.linkedinUrl,
            cash: userData.balance || 0,
            portfolioValue: userData.portfolioValue || 0,
            totalValue: userData.totalValue || 0,
            gainLoss: userData.gainLoss || 0,
            gainLossPercent: userData.gainLossPercent || 0,
            initialInvestment: userData.initialInvestment || 30000,
            lastLeaderboardUpdate: userData.lastLeaderboardUpdate,
            emailVerified: userData.emailVerified,
          };
        })
        .filter((user) => user.emailVerified !== false);
      leaderboardEntries.sort((a, b) => b.totalValue - a.totalValue);
      setLeaderboardData(leaderboardEntries);
      setFilteredData(leaderboardEntries);
    } catch (error) {}
    setIsLoading(false);
  };

  const majorColor = (major) => {
    return MAJOR_COLORS[major] || "gray";
  };

  const handleRowClick = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    const updateTimer = () => {
      setTimeLeft(getNextReset());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(leaderboardData);
    } else {
      const searchLower = searchTerm.toLowerCase();

      const filtered = leaderboardData.filter((user) => {
        const fullName = `${user.firstName || ""} ${
          user.lastName || ""
        }`.toLowerCase();
        return (
          (user.firstName &&
            user.firstName.toLowerCase().includes(searchLower)) ||
          (user.lastName &&
            user.lastName.toLowerCase().includes(searchLower)) ||
          fullName.includes(searchLower) ||
          (user.major && user.major.toLowerCase().includes(searchLower)) ||
          (user.studyYear && user.studyYear.toLowerCase().includes(searchLower))
        );
      });
      setFilteredData(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, leaderboardData]);

  const totalPages = Math.ceil(filteredData.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box minH="100vh" bg={pageBgColor}>
      <Container maxW="1400px" py={10}>
        <VStack spacing={8}>
          <Box textAlign="center" w="100%">
            <Heading
              color={mainTextColor}
              fontSize={{ base: "2xl", md: "4xl" }}
              fontWeight="extrabold"
            >
              Stock Trading Leaderboard
            </Heading>
            <Text mt={2} color={subTextColor}>
              See how your portfolio stacks up against your friends!
            </Text>
            <Box
              mt={4}
              mb={2}
              display="inline-block"
              px={6}
              py={3}
              borderRadius="xl"
              bgGradient={timerGradient}
              boxShadow="md"
            >
              <Text fontWeight="bold" color={timerLabelColor} fontSize="lg">
                Next Leaderboard Update In:
              </Text>
              <Text
                fontSize={{ base: "2xl", md: "3xl" }}
                fontWeight="extrabold"
                color={timerNumberColor}
                letterSpacing="wide"
                textShadow={useColorModeValue(
                  "0 1px 4px #fff8",
                  "0 1px 8px #000a"
                )}
              >
                {formatTime(timeLeft)}
              </Text>
              <Text fontSize="sm" color={timerSubColor}>
                (Updates daily at 2:00am Toronto time)
              </Text>
            </Box>
          </Box>

          {guestMode && (
            <Alert
              status="info"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="auto"
              py={6}
              px={4}
              borderRadius="xl"
              bg={guestAlertBg}
              border="1px"
              borderColor={guestAlertBorder}
            >
              <AlertIcon boxSize="24px" color="blue.500" />
              <VStack spacing={3} mt={2}>
                <Text fontWeight="bold" color={mainTextColor}>
                  👋 Welcome to UofT Stocker!
                </Text>
                <Text color={subTextColor} fontSize="sm">
                  You're currently browsing in guest mode. Sign up to start
                  trading, build your portfolio, and compete on this
                  leaderboard!
                </Text>
                <HStack spacing={3} mt={2}>
                  <Button
                    as={RouterLink}
                    to="/signup"
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<FaUser />}
                    onClick={exitGuestMode}
                    _hover={{
                      transform: "translateY(-1px)",
                      boxShadow: "md",
                    }}
                    transition="all 0.2s"
                  >
                    Sign Up to Trade
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/login"
                    variant="outline"
                    size="sm"
                    onClick={exitGuestMode}
                    _hover={{
                      transform: "translateY(-1px)",
                      boxShadow: "md",
                    }}
                    transition="all 0.2s"
                  >
                    Login
                  </Button>
                </HStack>
              </VStack>
            </Alert>
          )}

          <Box w="100%" maxW="600px">
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search by name, major, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg={cardBgColor}
                borderColor={borderColor}
                _hover={{ borderColor: "blue.400" }}
                _focus={{
                  borderColor: "blue.500",
                  boxShadow: "0 0 0 1px blue.500",
                }}
              />
            </InputGroup>
          </Box>

          <Box
            w="100%"
            bg={cardBgColor}
            borderRadius="lg"
            boxShadow="xl"
            border="1px"
            borderColor={borderColor}
            p={{ base: 2, md: 4 }}
            overflowX="auto"
          >
            <TableContainer w="100%">
              <Table variant="simple" w="100%">
                <Thead>
                  <Tr bg={headerBgColor}>
                    <Th py={4} color={mainTextColor}>
                      Rank
                    </Th>
                    <Th py={4} color={mainTextColor}>
                      Trader
                    </Th>
                    <Th py={4} isNumeric color={mainTextColor}>
                      Portfolio Value
                    </Th>
                    <Th py={4} isNumeric color={mainTextColor}>
                      Cash
                    </Th>
                    <Th py={4} isNumeric color={mainTextColor}>
                      Total Value
                    </Th>
                    <Th py={4} isNumeric color={mainTextColor}>
                      Initial Investment
                    </Th>
                    <Th py={4} isNumeric color={mainTextColor}>
                      Total Gain/Loss
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {isLoading
                    ? Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <Tr key={index}>
                            <Td>
                              <Skeleton height="20px" />
                            </Td>
                            <Td>
                              <Skeleton height="20px" />
                            </Td>
                            <Td>
                              <Skeleton height="20px" />
                            </Td>
                            <Td>
                              <Skeleton height="20px" />
                            </Td>
                            <Td>
                              <Skeleton height="20px" />
                            </Td>
                            <Td>
                              <Skeleton height="20px" />
                            </Td>
                            <Td>
                              <Skeleton height="20px" />
                            </Td>
                          </Tr>
                        ))
                    : currentUsers.map((trader, index) => (
                        <MotionTr
                          key={trader.userId}
                          _hover={{ bg: rowHoverBg, cursor: "pointer" }}
                          onClick={() => handleRowClick(trader)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Td>
                            <Badge
                              colorScheme={
                                startIndex + index === 0
                                  ? "yellow"
                                  : startIndex + index === 1
                                  ? "gray"
                                  : startIndex + index === 2
                                  ? "orange"
                                  : "uoft"
                              }
                              fontSize="md"
                              px={3}
                              py={1}
                              borderRadius="full"
                              mr={2}
                            >
                              #{startIndex + index + 1}
                            </Badge>
                            {startIndex + index < 3 && (
                              <FaTrophy
                                style={{
                                  marginLeft: 4,
                                  color:
                                    startIndex + index === 0
                                      ? "#FFD700"
                                      : startIndex + index === 1
                                      ? "#C0C0C0"
                                      : "#CD7F32",
                                }}
                              />
                            )}
                          </Td>
                          <Td>
                            <Text fontWeight="bold" color={mainTextColor}>
                              {trader.firstName} {trader.lastName}
                              <Tag
                                ml={2}
                                colorScheme={majorColor(trader.major)}
                                variant="solid"
                                borderRadius="full"
                                fontSize="sm"
                              >
                                {trader.major}
                              </Tag>
                            </Text>
                            <Text fontSize="sm" color={subTextColor}>
                              {trader.studyYear}
                            </Text>
                          </Td>
                          <Td isNumeric fontWeight="bold" color={mainTextColor}>
                            $
                            {typeof trader.portfolioValue === "number"
                              ? trader.portfolioValue.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )
                              : "0.00"}
                          </Td>
                          <Td isNumeric color={subTextColor}>
                            $
                            {trader.cash.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Td>
                          <Td isNumeric fontWeight="bold" color={mainTextColor}>
                            $
                            {trader.totalValue.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Td>
                          <Td isNumeric color={subTextColor}>
                            $
                            {trader.initialInvestment.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={
                                trader.gainLoss >= 0 ? "green" : "red"
                              }
                              fontSize="sm"
                              px={2}
                              py={1}
                            >
                              {trader.gainLoss >= 0 ? "+" : "-"}$
                              {Math.abs(trader.gainLoss).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                              {" ("}
                              {trader.gainLossPercent >= 0 ? "+" : "-"}
                              {Math.abs(trader.gainLossPercent).toFixed(2)}%
                              {")"}
                            </Badge>
                          </Td>
                        </MotionTr>
                      ))}
                </Tbody>
              </Table>
            </TableContainer>

            <Flex justify="center" align="center" mt={6} gap={2}>
              <Button
                leftIcon={<FaChevronLeft />}
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                variant="outline"
                colorScheme="blue"
              >
                Previous
              </Button>

              <HStack spacing={2}>
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    colorScheme={currentPage === index + 1 ? "blue" : "gray"}
                    variant={currentPage === index + 1 ? "solid" : "outline"}
                    size="sm"
                  >
                    {index + 1}
                  </Button>
                ))}
              </HStack>

              <Button
                rightIcon={<FaChevronRight />}
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === totalPages}
                variant="outline"
                colorScheme="blue"
              >
                Next
              </Button>
            </Flex>
          </Box>
        </VStack>
      </Container>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg={cardBgColor} borderRadius="xl">
          <ModalHeader color={mainTextColor}>
            <HStack spacing={3}>
              <Avatar
                name={`${selectedUser?.firstName} ${selectedUser?.lastName}`}
                bg="blue.500"
                color="white"
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="xl" fontWeight="bold">
                  {selectedUser?.firstName} {selectedUser?.lastName}
                </Text>
                <Tag
                  colorScheme={majorColor(selectedUser?.major)}
                  size="sm"
                  borderRadius="full"
                >
                  {selectedUser?.major}
                </Tag>
              </VStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}>
                <Icon as={FaGraduationCap} color="blue.500" />
                <Text color={subTextColor}>{selectedUser?.studyYear}</Text>
              </HStack>

              {selectedUser?.linkedinUrl && (
                <HStack spacing={3}>
                  <Icon as={FaLinkedin} color="blue.500" />
                  <Link
                    href={selectedUser.linkedinUrl}
                    isExternal
                    color="blue.500"
                    _hover={{ textDecoration: "underline" }}
                  >
                    View LinkedIn Profile
                  </Link>
                </HStack>
              )}

              <Divider />

              <Box>
                <HStack spacing={3} mb={2}>
                  <Icon as={FaInfoCircle} color="blue.500" />
                  <Text fontWeight="bold" color={mainTextColor}>
                    About
                  </Text>
                </HStack>
                <Text
                  color={subTextColor}
                  bg={useColorModeValue("gray.50", "gray.700")}
                  p={4}
                  borderRadius="md"
                  whiteSpace="pre-wrap"
                >
                  {selectedUser?.bio || "No bio available"}
                </Text>
              </Box>

              <Divider />

              <Box>
                <HStack spacing={3} mb={2}>
                  <Icon as={FaTrophy} color="blue.500" />
                  <Text fontWeight="bold" color={mainTextColor}>
                    Trading Stats
                  </Text>
                </HStack>
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text color={subTextColor}>Portfolio Value</Text>
                    <Text fontWeight="bold" color={mainTextColor}>
                      $
                      {selectedUser?.portfolioValue?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={subTextColor}>Cash Balance</Text>
                    <Text fontWeight="bold" color={mainTextColor}>
                      $
                      {selectedUser?.cash?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color={subTextColor}>Total Gain/Loss</Text>
                    <Badge
                      colorScheme={
                        selectedUser?.gainLoss >= 0 ? "green" : "red"
                      }
                      fontSize="sm"
                      px={2}
                      py={1}
                    >
                      {selectedUser?.gainLoss >= 0 ? "+" : "-"}$
                      {Math.abs(selectedUser?.gainLoss || 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                      {" ("}
                      {selectedUser?.gainLossPercent >= 0 ? "+" : "-"}
                      {Math.abs(selectedUser?.gainLossPercent || 0).toFixed(2)}%
                      {")"}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Leaderboard;
