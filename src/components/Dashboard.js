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
  Badge,
  Td,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  IconButton,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaChartLine,
  FaTrophy,
  FaUserCircle,
  FaArrowRight,
  FaQuestionCircle,
} from "react-icons/fa";
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAboutOpen,
    onOpen: onAboutOpen,
    onClose: onAboutClose,
  } = useDisclosure();

  const getCachedPrice = (stockSymbol) => {
    const cached = priceCache.get(stockSymbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const fetchStockPrice = async (symbol) => {
    try {
      // Use Finnhub API (replace with your actual API key)
      const response = await axios.get("https://finnhub.io/api/v1/quote", {
        params: {
          symbol,
          token: "d0vg651r01qkepd02btgd0vg651r01qkepd02bu0", // <-- your Finnhub API key
        },
      });
      const data = response.data;
      if (!data || data.c === 0) {
        throw new Error(`Symbol '${symbol}' not found.`);
      }
      return {
        price: data.c,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
      };
    } catch (error) {
      console.error("Finnhub API error:", error.message);
      return null;
    }
  };

  const calculatePortfolioValue = async (stocks, cash = 0) => {
    let portfolioValue = 0;
    let initialValue = 0;
    // Deduplicate symbols
    const uniqueSymbols = [...new Set(stocks.map((stock) => stock.symbol))];
    // Fetch prices for unique symbols only
    const priceMap = {};
    await Promise.all(
      uniqueSymbols.map(async (symbol) => {
        priceMap[symbol] = await fetchStockPrice(symbol);
      })
    );
    stocks.forEach((stock) => {
      const priceData = priceMap[stock.symbol];
      if (priceData) {
        portfolioValue += priceData.price * stock.quantity;
        initialValue += stock.purchasePrice * stock.quantity;
      }
    });
    const initialInvestment = 30000; // or userData.initialInvestment
    const totalValue = cash + portfolioValue;
    const gainLoss = totalValue - initialInvestment;
    const gainLossPercent = (gainLoss / initialInvestment) * 100;
    return {
      portfolioValue,
      initialValue,
      totalValue,
      percentageChange:
        initialValue > 0
          ? ((portfolioValue - initialValue) / initialValue) * 100
          : 0,
    };
  };

  const fetchUserRank = async (userTotalValue) => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const stocksSnapshot = await getDocs(collection(db, "stocks"));
      // Group stocks by userId
      const stocksByUser = {};
      stocksSnapshot.forEach((doc) => {
        const stock = doc.data();
        if (!stocksByUser[stock.userId]) {
          stocksByUser[stock.userId] = [];
        }
        stocksByUser[stock.userId].push(stock);
      });
      // Collect all unique symbols across all users
      const allStocks = stocksSnapshot.docs.map((doc) => doc.data());
      const uniqueSymbols = [
        ...new Set(allStocks.map((stock) => stock.symbol)),
      ];
      // Fetch prices for all unique symbols only once
      const priceMap = {};
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          priceMap[symbol] = await fetchStockPrice(symbol);
        })
      );
      // Calculate total value for each user
      const userValues = [];
      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userStocks = stocksByUser[userDoc.id] || [];
        let portfolioValue = 0;
        let initialValue = 0;
        userStocks.forEach((stock) => {
          const priceData = priceMap[stock.symbol];
          if (priceData) {
            portfolioValue += priceData.price * stock.quantity;
            initialValue += stock.purchasePrice * stock.quantity;
          }
        });
        const cash = userData.balance || 0;
        const initialInvestment = 30000;
        const totalValue = cash + portfolioValue;
        userValues.push(totalValue);
      }
      userValues.sort((a, b) => b - a);
      const rank = userValues.indexOf(userTotalValue) + 1;
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
        let cash = 0;
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          cash = userDoc.data().balance || 0;
        }
        // Fetch user's stocks
        const stocksQuery = query(
          collection(db, "stocks"),
          where("userId", "==", currentUser.uid)
        );
        const stocksSnapshot = await getDocs(stocksQuery);
        const userStocks = stocksSnapshot.docs.map((doc) => doc.data());
        // Calculate portfolio value (stocks only)
        const { portfolioValue, initialValue, totalValue, percentageChange } =
          await calculatePortfolioValue(userStocks, cash);
        // Calculate user's rank
        const { rank, totalUsers } = await fetchUserRank(totalValue);
        setPortfolioStats({
          portfolioValue,
          totalValue,
          percentageChange,
          rank,
          totalUsers,
          cash,
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
      label: "Portfolio Value (Stocks)",
      value: userData ? (
        `$${
          portfolioStats.portfolioValue?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`
      ) : (
        <Skeleton height="20px" />
      ),
      change: portfolioStats.percentageChange,
      icon: FaChartLine,
    },
    {
      label: "Cash Balance",
      value: userData ? (
        `$${userData.balance?.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      ) : (
        <Skeleton height="20px" />
      ),
      icon: FaUserCircle,
    },
    {
      label: "Total Value (Cash + Stocks)",
      value: userData ? (
        `$${
          portfolioStats.totalValue?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`
      ) : (
        <Skeleton height="20px" />
      ),
      icon: FaTrophy,
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
    <Box position="relative">
      <Container maxW="container.lg" py={10}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={8}>
            <Heading
              color="uoft.navy"
              fontSize={{ base: "2xl", md: "4xl" }}
              fontWeight="extrabold"
            >
              Welcome Back
              {userData ? `, ${userData.firstName}` : ""}
            </Heading>
            <Text mt={2} color="gray.600">
              Track your portfolio performance and market trends
            </Text>
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
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "2xl",
                  borderColor: "uoft.navy",
                }}
              >
                <VStack spacing={3} align="stretch">
                  <Icon as={stat.icon} w={6} h={6} color="uoft.navy" />
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.600">
                      {stat.label}
                    </StatLabel>
                    <StatNumber
                      fontSize="2xl"
                      fontWeight="bold"
                      color="uoft.navy"
                    >
                      {loading ? <Skeleton height="20px" /> : stat.value}
                    </StatNumber>
                    {stat.helpText && (
                      <StatHelpText>{stat.helpText}</StatHelpText>
                    )}
                  </Stat>
                </VStack>
              </Box>
            ))}
            {/* Contest Info Box */}
            <Box
              bg={bgColor}
              p={6}
              borderRadius="lg"
              boxShadow="xl"
              border="1px"
              borderColor={borderColor}
              transition="all 0.2s"
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "2xl",
                borderColor: "uoft.navy",
              }}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
            >
              <Heading size="md" color="uoft.navy" mb={2}>
                Contest Info
              </Heading>
              <Text color="gray.600" mb={4} textAlign="center">
                Learn more about the current trading contest, rules, and prizes.
              </Text>
              <Button
                colorScheme="blue"
                borderRadius="full"
                px={6}
                onClick={onOpen}
              >
                Show More
              </Button>
            </Box>
          </SimpleGrid>

          <Box
            bg={bgColor}
            p={8}
            borderRadius="lg"
            boxShadow="xl"
            border="1px"
            borderColor={borderColor}
            textAlign="center"
            _hover={{
              borderColor: "uoft.navy",
            }}
          >
            <VStack spacing={4}>
              <Heading size="md" color="uoft.navy">
                Ready to Trade?
              </Heading>
              <Text color="gray.600">
                Start trading stocks and build your portfolio
              </Text>
              <Button
                as={Link}
                to="/trading"
                size="lg"
                colorScheme="blue"
                leftIcon={<FaArrowRight />}
                fontWeight="bold"
                borderRadius="full"
                px={8}
                py={6}
                fontSize="xl"
                boxShadow="md"
                _hover={{
                  bg: "blue.600",
                  color: "white",
                  transform: "translateY(-2px)",
                  boxShadow: "xl",
                }}
              >
                Start Trading
              </Button>
            </VStack>
          </Box>
          {/* Contest Info Modal */}
          <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
            <ModalOverlay />
            <ModalContent borderRadius="2xl" boxShadow="2xl" bg={bgColor}>
              <ModalHeader
                color="uoft.navy"
                fontWeight="bold"
                fontSize="2xl"
                textAlign="center"
              >
                Contest Information
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack spacing={4} align="stretch">
                  <Text fontSize="lg" color="gray.700">
                    Welcome to the UofT Stocker Trading Contest! Compete with
                    fellow students to grow your virtual portfolio and climb the
                    leaderboard.
                  </Text>
                  <Box
                    bg="uoft.navy"
                    color="white"
                    p={4}
                    borderRadius="lg"
                    boxShadow="md"
                  >
                    <Text fontWeight="bold">Contest Rules:</Text>
                    <ul style={{ marginLeft: 20 }}>
                      <li>Start with $30,000 in virtual cash.</li>
                      <li>Buy and sell real stocks with live prices.</li>
                      <li>Top traders win prizes at the end of the contest.</li>
                      <li>
                        No real money is involved—it's all for fun and learning!
                      </li>
                    </ul>
                  </Box>
                  <Box
                    bg="uoft.lightBlue"
                    color="uoft.navy"
                    p={4}
                    borderRadius="lg"
                    boxShadow="md"
                  >
                    <Text fontWeight="bold">Prizes:</Text>
                    <ul style={{ marginLeft: 20 }}>
                      <li>1st Place: $200 Amazon Gift Card</li>
                      <li>2nd Place: $100 Amazon Gift Card</li>
                      <li>3rd Place: $50 Amazon Gift Card</li>
                    </ul>
                  </Box>
                  <Text fontSize="md" color="gray.600">
                    For more details, visit the official contest page or contact
                    the organizers.
                  </Text>
                </VStack>
              </ModalBody>
              <ModalFooter>
                <Button
                  colorScheme="blue"
                  borderRadius="full"
                  px={8}
                  onClick={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
      {/* Floating About Button */}
      <IconButton
        icon={<FaQuestionCircle />}
        aria-label="About UofT Stocker"
        borderRadius="full"
        size="lg"
        colorScheme="blue"
        bg="white"
        color="uoft.navy"
        borderWidth={2}
        borderColor="uoft.navy"
        position="fixed"
        bottom={6}
        left={6}
        zIndex={20}
        boxShadow="lg"
        _hover={{ bg: "uoft.navy", color: "white" }}
        onClick={onAboutOpen}
      />
      <Modal isOpen={isAboutOpen} onClose={onAboutClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="2xl" boxShadow="2xl">
          <ModalHeader color="uoft.navy" fontWeight="bold" fontSize="2xl">
            About UofT Stocker
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="lg" color="gray.700">
              UofT Stocker is a simulated stock trading platform for University
              of Toronto students. Compete with your peers, manage a virtual
              portfolio, and climb the leaderboard! No real money is
              involved—it's all for fun and learning.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard;
