import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  useColorModeValue,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Skeleton,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FaChartLine, FaTrophy, FaUserCircle } from "react-icons/fa";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import axios from "axios";

// Cache for storing stock prices
const priceCache = new Map();
const CACHE_DURATION = 60000; // 1 minute cache

function Dashboard() {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    percentageChange: 0,
    rank: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const getCachedPrice = (stockSymbol) => {
    const cached = priceCache.get(stockSymbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const fetchStockPrice = async (symbol) => {
    try {
      // Check cache first
      const cachedData = getCachedPrice(symbol);
      if (cachedData) {
        return cachedData;
      }

      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        }
      );

      if (!response.data?.chart?.result?.[0]) {
        throw new Error("Invalid response format");
      }

      const result = response.data.chart.result[0];
      const quote = result.meta;

      const stockData = {
        price: quote.regularMarketPrice,
        change: quote.regularMarketPrice - quote.chartPreviousClose,
        changePercent:
          ((quote.regularMarketPrice - quote.chartPreviousClose) /
            quote.chartPreviousClose) *
          100,
      };

      // Cache the result
      priceCache.set(symbol, {
        data: stockData,
        timestamp: Date.now(),
      });

      return stockData;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  };

  const calculatePortfolioValue = async (stocks) => {
    let totalValue = 0;
    let initialValue = 0;

    for (const stock of stocks) {
      const priceData = await fetchStockPrice(stock.symbol);
      if (priceData) {
        totalValue += priceData.price * stock.quantity;
        initialValue += stock.purchasePrice * stock.quantity;
      }
    }

    return {
      totalValue,
      percentageChange:
        initialValue > 0
          ? ((totalValue - initialValue) / initialValue) * 100
          : 0,
    };
  };

  const fetchUserRank = async (userPortfolioValue) => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const userValues = [];

      for (const userDoc of usersSnapshot.docs) {
        const stocksQuery = query(
          collection(db, "stocks"),
          where("userId", "==", userDoc.id)
        );
        const stocksSnapshot = await getDocs(stocksQuery);
        const userStocks = stocksSnapshot.docs.map((doc) => doc.data());

        if (userStocks.length > 0) {
          const { totalValue } = await calculatePortfolioValue(userStocks);
          userValues.push(totalValue);
        }
      }

      // Sort in descending order
      userValues.sort((a, b) => b - a);
      const rank = userValues.indexOf(userPortfolioValue) + 1;

      return {
        rank,
        totalUsers: userValues.length,
      };
    } catch (error) {
      console.error("Error calculating rank:", error);
      return { rank: 0, totalUsers: 0 };
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Fetch user's stocks
        const stocksQuery = query(
          collection(db, "stocks"),
          where("userId", "==", currentUser.uid)
        );
        const stocksSnapshot = await getDocs(stocksQuery);
        const userStocks = stocksSnapshot.docs.map((doc) => doc.data());

        // Calculate portfolio value
        const { totalValue, percentageChange } = await calculatePortfolioValue(
          userStocks
        );

        // Calculate user's rank
        const { rank, totalUsers } = await fetchUserRank(totalValue);

        setPortfolioStats({
          totalValue,
          percentageChange,
          rank,
          totalUsers,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const stats = [
    {
      label: "Portfolio Value",
      value: `$${portfolioStats.totalValue.toFixed(2)}`,
      change: portfolioStats.percentageChange,
      icon: FaChartLine,
    },
    {
      label: "Current Rank",
      value: `#${portfolioStats.rank}`,
      helpText:
        portfolioStats.totalUsers > 0
          ? `Top ${(
              (portfolioStats.rank / portfolioStats.totalUsers) *
              100
            ).toFixed(0)}%`
          : "No ranking",
      icon: FaTrophy,
    },
    {
      label: "Active Since",
      value: new Date(userData?.createdAt || Date.now()).toLocaleDateString(),
      helpText: "Trading Account",
      icon: FaUserCircle,
    },
  ];

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading
            bgGradient="linear(to-r, blue.400, purple.500)"
            bgClip="text"
            fontSize={{ base: "2xl", md: "4xl" }}
            fontWeight="extrabold"
            mb={2}
          >
            {loading ? (
              <Skeleton height="50px" width="300px" mx="auto" />
            ) : (
              `Welcome back, ${userData?.firstName || "Trader"}!`
            )}
          </Heading>
          {!loading && userData && (
            <Text fontSize="lg" color="gray.500">
              {userData.major} • {userData.studyYear}
            </Text>
          )}
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          {stats.map((stat, index) => (
            <Box
              key={index}
              bg={bgColor}
              p={6}
              borderRadius="lg"
              boxShadow="xl"
              border="1px"
              borderColor={borderColor}
              transition="all 0.2s"
              _hover={{ transform: "translateY(-2px)", boxShadow: "2xl" }}
            >
              <VStack spacing={3} align="stretch">
                <Icon as={stat.icon} w={6} h={6} color="blue.500" />
                <Stat>
                  <StatLabel fontSize="sm" color="gray.500">
                    {stat.label}
                  </StatLabel>
                  <StatNumber fontSize="2xl" fontWeight="bold">
                    {loading ? <Skeleton height="20px" /> : stat.value}
                  </StatNumber>
                  {stat.change && (
                    <StatHelpText>
                      <StatArrow
                        type={stat.change > 0 ? "increase" : "decrease"}
                      />
                      {Math.abs(stat.change).toFixed(2)}%
                    </StatHelpText>
                  )}
                  {stat.helpText && (
                    <StatHelpText>{stat.helpText}</StatHelpText>
                  )}
                </Stat>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>

        <Box
          bg={bgColor}
          p={8}
          borderRadius="lg"
          boxShadow="xl"
          border="1px"
          borderColor={borderColor}
          textAlign="center"
        >
          <VStack spacing={4}>
            <Heading size="md">Ready to Trade?</Heading>
            <Text color="gray.500">
              Start trading stocks and build your portfolio
            </Text>
            <Button
              as={Link}
              to="/trading"
              colorScheme="blue"
              size="lg"
              _hover={{ transform: "translateY(-2px)" }}
              transition="all 0.2s"
            >
              Start Trading
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
}

export default Dashboard;
