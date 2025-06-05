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
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaTrophy, FaUserCircle } from "react-icons/fa";

const MotionTr = motion(Tr);

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  const bgColor = useColorModeValue("white", "gray.800");
  const headerBgColor = useColorModeValue("gray.50", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  // Countdown timer for next leaderboard reset (2am Toronto time)
  useEffect(() => {
    const getNextReset = () => {
      // Get current time in America/Toronto
      const now = new Date();
      const torontoNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/Toronto" })
      );
      // Set next reset to 2:00am Toronto time
      const next = new Date(torontoNow);
      next.setHours(2, 0, 0, 0);
      if (torontoNow >= next) {
        next.setDate(next.getDate() + 1);
      }
      // Calculate the difference in Toronto time
      return next - torontoNow;
    };
    const updateTimer = () => {
      setTimeLeft(getNextReset());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format time left as HH:MM:SS
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
      const leaderboardEntries = usersSnapshot.docs.map((doc) => {
        const userData = doc.data();
        return {
          userId: doc.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          major: userData.major,
          studyYear: userData.studyYear,
          cash: userData.balance || 0,
          totalValue: userData.totalValue || 0,
          lastLeaderboardUpdate: userData.lastLeaderboardUpdate,
        };
      });
      leaderboardEntries.sort((a, b) => b.totalValue - a.totalValue);
      setLeaderboardData(leaderboardEntries);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    }
    setIsLoading(false);
  };

  const majorColor = (major) => {
    switch ((major || "").toLowerCase()) {
      case "computer science":
        return "blue";
      case "engineering":
        return "orange";
      case "mathematics":
        return "purple";
      case "physics":
        return "teal";
      case "chemistry":
        return "green";
      case "biology":
        return "lime";
      case "economics":
        return "yellow";
      case "business":
        return "pink";
      default:
        return "gray";
    }
  };

  return (
    <Container maxW="7xl" py={10}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading
            color="uoft.navy"
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="extrabold"
          >
            Stock Trading Leaderboard
          </Heading>
          <Text mt={2} color="gray.600">
            See how your portfolio stacks up against other traders
          </Text>
          {/* Countdown Timer */}
          <Box
            mt={4}
            mb={2}
            display="inline-block"
            px={6}
            py={3}
            borderRadius="xl"
            bgGradient="linear(to-r, blue.100, blue.300)"
            boxShadow="md"
          >
            <Text fontWeight="bold" color="uoft.navy" fontSize="lg">
              Next Leaderboard Reset In:
            </Text>
            <Text
              fontSize={{ base: "2xl", md: "3xl" }}
              fontWeight="extrabold"
              color="blue.700"
              letterSpacing="wide"
            >
              {formatTime(timeLeft)}
            </Text>
            <Text fontSize="sm" color="gray.600">
              (Resets daily at 2:00am Toronto time)
            </Text>
          </Box>
        </Box>
        <Box
          w="100%"
          bg={bgColor}
          borderRadius="lg"
          boxShadow="xl"
          border="1px"
          borderColor={borderColor}
          p={{ base: 2, md: 4 }}
        >
          <TableContainer w="100%" overflowX="unset">
            <Table variant="simple" w="100%">
              <Thead>
                <Tr bg={headerBgColor}>
                  <Th py={4} color="uoft.navy">
                    Rank
                  </Th>
                  <Th py={4} color="uoft.navy">
                    Trader
                  </Th>
                  <Th py={4} isNumeric color="uoft.navy">
                    Portfolio Value
                  </Th>
                  <Th py={4} isNumeric color="uoft.navy">
                    Cash
                  </Th>
                  <Th py={4} isNumeric color="uoft.navy">
                    Total Value
                  </Th>
                  <Th py={4} isNumeric color="uoft.navy">
                    Initial Investment
                  </Th>
                  <Th py={4} isNumeric color="uoft.navy">
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
                  : leaderboardData.map((trader, index) => (
                      <Tr key={trader.userId} _hover={{ bg: "gray.50" }}>
                        <Td>
                          <Badge
                            colorScheme={
                              index === 0
                                ? "yellow"
                                : index === 1
                                ? "gray"
                                : index === 2
                                ? "orange"
                                : "uoft"
                            }
                            fontSize="md"
                            px={3}
                            py={1}
                            borderRadius="full"
                            mr={2}
                          >
                            #{index + 1}
                          </Badge>
                          {index < 3 && (
                            <FaTrophy
                              style={{
                                marginLeft: 4,
                                color:
                                  index === 0
                                    ? "#FFD700"
                                    : index === 1
                                    ? "#C0C0C0"
                                    : "#FFA500",
                              }}
                            />
                          )}
                        </Td>
                        <Td>
                          <Text fontWeight="bold" color="uoft.navy">
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
                          <Text fontSize="sm" color="gray.600">
                            {trader.studyYear}
                          </Text>
                        </Td>
                        <Td isNumeric fontWeight="bold" color="uoft.navy">
                          $
                          {typeof trader.totalValue === "number"
                            ? trader.totalValue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"}
                        </Td>
                        <Td isNumeric color="gray.600">
                          $
                          {trader.cash.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Td>
                        <Td isNumeric fontWeight="bold" color="uoft.navy">
                          $
                          {trader.totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Td>
                        <Td isNumeric color="gray.600">
                          $
                          {trader.totalValue.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Td>
                        <Td isNumeric>
                          <Badge
                            colorScheme={
                              trader.totalValue >= 0 ? "green" : "red"
                            }
                            fontSize="sm"
                            px={2}
                            py={1}
                          >
                            {trader.totalValue >= 0 ? "+" : ""}$
                            {typeof trader.totalValue === "number"
                              ? trader.totalValue.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : "0.00"}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </VStack>
    </Container>
  );
}

export default Leaderboard;
