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
  // leaderboard stuff is perfectly optimized basically, just improve ui maybe
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaTrophy } from "react-icons/fa";

const MotionTr = motion(Tr);

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

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
  const timerNumberColor = useColorModeValue("blue.800", "yellow.200");
  const timerLabelColor = useColorModeValue("uoft.navy", "white");
  const timerSubColor = useColorModeValue("gray.600", "gray.200");
  const rowHoverBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  useEffect(() => {
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
    const updateTimer = () => {
      setTimeLeft(getNextReset());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

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
          portfolioValue: userData.portfolioValue || 0,
          totalValue: userData.totalValue || 0,
          gainLoss: userData.gainLoss || 0,
          gainLossPercent: userData.gainLossPercent || 0,
          initialInvestment: userData.initialInvestment || 30000,
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
    <Box minH="100vh" bg={pageBgColor}>
      <Container maxW="7xl" py={10}>
        <VStack spacing={8}>
          <Box textAlign="center">
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
                Next Leaderboard Reset In:
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
                (Resets daily at 2:00am Toronto time)
              </Text>
            </Box>
          </Box>
          <Box
            w="100%"
            bg={cardBgColor}
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
                    : leaderboardData.map((trader, index) => (
                        <Tr key={trader.userId} _hover={{ bg: rowHoverBg }}>
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
                        </Tr>
                      ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

export default Leaderboard;
