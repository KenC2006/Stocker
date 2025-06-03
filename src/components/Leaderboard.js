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
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import axios from "axios";

const MotionTr = motion(Tr);

function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const bgColor = useColorModeValue("white", "gray.800");
  const headerBgColor = useColorModeValue("gray.50", "gray.700");
  const hoverBgColor = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const getStockPrice = async (symbol) => {
    try {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
      );
      return response.data.chart.result[0].meta.regularMarketPrice;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return 0;
    }
  };

  const calculatePortfolioValue = async (stocks) => {
    let totalValue = 0;
    let initialValue = 0;

    for (const stock of stocks) {
      try {
        const currentPrice = await getStockPrice(stock.symbol);
        totalValue += currentPrice;
        initialValue += stock.purchasePrice;
      } catch (error) {
        console.error(`Error calculating value for ${stock.symbol}:`, error);
      }
    }

    return {
      currentValue: totalValue,
      initialValue: initialValue,
      percentageGain: ((totalValue - initialValue) / initialValue) * 100,
    };
  };

  const fetchLeaderboardData = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const stocksSnapshot = await getDocs(collection(db, "stocks"));

      const stocksByUser = {};
      stocksSnapshot.forEach((doc) => {
        const stock = doc.data();
        if (!stocksByUser[stock.userId]) {
          stocksByUser[stock.userId] = [];
        }
        stocksByUser[stock.userId].push(stock);
      });

      const leaderboardEntries = [];
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userStocks = stocksByUser[userDoc.id] || [];

        if (userStocks.length > 0) {
          const portfolio = await calculatePortfolioValue(userStocks);
          leaderboardEntries.push({
            userId: userDoc.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            major: userData.major,
            studyYear: userData.studyYear,
            ...portfolio,
          });
        }
      }

      leaderboardEntries.sort((a, b) => b.percentageGain - a.percentageGain);
      setLeaderboardData(leaderboardEntries);
    } catch (error) {
      console.error("Error fetching leaderboard data:", error);
    }
    setIsLoading(false);
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="extrabold"
          >
            Stock Trading Leaderboard
          </Heading>
          <Text mt={2} color="gray.500">
            See how your portfolio stacks up against other traders
          </Text>
        </Box>

        <Box
          w="100%"
          bg={bgColor}
          borderRadius="lg"
          boxShadow="xl"
          overflow="hidden"
        >
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr bg={headerBgColor}>
                  <Th py={4}>Rank</Th>
                  <Th py={4}>Trader</Th>
                  <Th py={4} isNumeric>
                    Portfolio Value
                  </Th>
                  <Th py={4} isNumeric>
                    Initial Investment
                  </Th>
                  <Th py={4} isNumeric>
                    Gain/Loss
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading
                  ? [...Array(5)].map((_, i) => (
                      <Tr key={i}>
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
                  : leaderboardData.map((entry, index) => (
                      <MotionTr
                        key={entry.userId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        _hover={{ bg: hoverBgColor }}
                        cursor="pointer"
                      >
                        <Td py={4}>
                          <Badge
                            colorScheme={index < 3 ? "yellow" : "gray"}
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            #{index + 1}
                          </Badge>
                        </Td>
                        <Td py={4}>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="medium">
                              {entry.firstName} {entry.lastName}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {entry.major} • {entry.studyYear}
                            </Text>
                          </VStack>
                        </Td>
                        <Td py={4} isNumeric>
                          <Text fontWeight="bold">
                            ${entry.currentValue.toFixed(2)}
                          </Text>
                        </Td>
                        <Td py={4} isNumeric>
                          ${entry.initialValue.toFixed(2)}
                        </Td>
                        <Td py={4} isNumeric>
                          <Badge
                            colorScheme={
                              entry.percentageGain >= 0 ? "green" : "red"
                            }
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            {entry.percentageGain >= 0 ? "+" : ""}
                            {entry.percentageGain.toFixed(2)}%
                          </Badge>
                        </Td>
                      </MotionTr>
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
