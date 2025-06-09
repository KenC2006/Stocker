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
  Skeleton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  IconButton,
  HStack,

  // optimize api and read write usage at some point
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FaChartLine,
  FaTrophy,
  FaUserCircle,
  FaArrowRight,
  FaQuestionCircle,
  FaWallet,
  FaDollarSign,
} from "react-icons/fa";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { fetchStockPrices } from "../services/stockService";

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
  const mainTextColor = useColorModeValue("uoft.navy", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.200");
  const pageBgColor = useColorModeValue("gray.50", "gray.900");
  const iconColor = useColorModeValue("blue.500", "blue.200");

  const calculatePortfolioStats = async (userStocks, cash = 0) => {
    if (!userStocks.length) {
      return {
        portfolioValue: 0,
        totalValue: cash,
        percentageChange: 0,
      };
    }

    const symbols = userStocks.map((stock) => stock.symbol);
    const priceMap = await fetchStockPrices(symbols);

    let portfolioValue = 0;
    let initialValue = 0;

    userStocks.forEach((stock) => {
      const priceData = priceMap[stock.symbol];
      if (priceData) {
        portfolioValue += priceData.price * stock.quantity;
        initialValue += stock.purchasePrice * stock.quantity;
      }
    });

    const totalValue = portfolioValue + cash;
    const initialInvestment = 30000;
    const gainLoss = totalValue - initialInvestment;
    const percentageChange =
      initialInvestment > 0 ? (gainLoss / initialInvestment) * 100 : 0;

    return {
      portfolioValue,
      totalValue,
      percentageChange,
      gainLoss,
      gainLossPercent: percentageChange,
    };
  };

  const fetchUserRank = async (userTotalValue) => {
    try {
      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("totalValue", ">=", 0))
      );

      const allUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        totalValue: doc.data().totalValue || 0,
      }));

      allUsers.sort((a, b) => b.totalValue - a.totalValue);
      const rank =
        allUsers.findIndex((user) => user.id === currentUser.uid) + 1;
      const rankData = {
        rank: rank || allUsers.length,
        totalUsers: allUsers.length,
      };

      return rankData;
    } catch (error) {
      console.error("Error calculating rank:", error);
      return { rank: 0, totalUsers: 0 };
    }
  };

  const fetchData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const [userDoc, stocksSnapshot] = await Promise.all([
        getDoc(doc(db, "users", currentUser.uid)),
        getDocs(
          query(
            collection(db, "stocks"),
            where("userId", "==", currentUser.uid)
          )
        ),
      ]);

      const userData = userDoc.exists() ? userDoc.data() : null;
      const cash = userData?.balance || 0;
      setUserData(userData);

      const userStocks = stocksSnapshot.docs.map((doc) => doc.data());

      const [stats, rankData] = await Promise.all([
        calculatePortfolioStats(userStocks, cash),
        fetchUserRank(userData?.totalValue || 0),
      ]);

      setPortfolioStats({
        ...stats,
        ...rankData,
        cash,
      });

      const shouldUpdate =
        Math.abs(stats.totalValue - (userData?.totalValue || 0)) > 1;
      if (shouldUpdate) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          portfolioValue: stats.portfolioValue,
          totalValue: stats.totalValue,
          gainLoss: stats.gainLoss,
          gainLossPercent: stats.gainLossPercent,
          initialInvestment: 30000,
          lastUpdate: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const stats = [
    {
      label: "Portfolio Value",
      value: loading ? (
        <Skeleton height="20px" />
      ) : (
        `$${
          portfolioStats.portfolioValue?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`
      ),
      change: portfolioStats.percentageChange,
      icon: FaChartLine,
      helpText:
        portfolioStats.percentageChange >= 0
          ? `+${portfolioStats.percentageChange.toFixed(2)}%`
          : `${portfolioStats.percentageChange.toFixed(2)}%`,
    },
    {
      label: "Cash Balance",
      value: loading ? (
        <Skeleton height="20px" />
      ) : (
        `$${(portfolioStats.cash || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      ),
      icon: FaWallet,
    },
    {
      label: "Total Value",
      value: loading ? (
        <Skeleton height="20px" />
      ) : (
        `$${
          portfolioStats.totalValue?.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) || "0.00"
        }`
      ),
      icon: FaDollarSign,
    },
    {
      label: "Current Rank",
      value: loading ? (
        <Skeleton height="20px" />
      ) : portfolioStats.rank === 0 ? (
        "Not Ranked"
      ) : (
        `#${portfolioStats.rank}`
      ),
      helpText:
        loading || !portfolioStats.totalUsers
          ? "Calculating rank..."
          : portfolioStats.rank === 0
          ? "No active trades yet"
          : `Top ${Math.min(
              Math.ceil(
                (portfolioStats.rank / portfolioStats.totalUsers) * 100
              ),
              100
            )}%`,
      icon: FaTrophy,
    },
    {
      label: "Active Since",
      value: loading ? (
        <Skeleton height="20px" />
      ) : (
        new Date(userData?.createdAt || Date.now()).toLocaleDateString()
      ),
      helpText: "Trading Account",
      icon: FaUserCircle,
    },
  ];

  return (
    <Box position="relative" minH="100vh" bg={pageBgColor}>
      <Container maxW="container.lg" py={10}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={8}>
            <Heading
              color={mainTextColor}
              fontSize={{ base: "2xl", md: "4xl" }}
              fontWeight="extrabold"
            >
              Welcome Back
              {userData ? `, ${userData.firstName}` : ""}
            </Heading>
            <Text mt={2} color={subTextColor}>
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
                  <Icon as={stat.icon} w={6} h={6} color={iconColor} />
                  <Stat>
                    <StatLabel fontSize="sm" color={subTextColor}>
                      {stat.label}
                    </StatLabel>
                    <StatNumber
                      fontSize="2xl"
                      fontWeight="bold"
                      color={mainTextColor}
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
              <Heading size="md" color={mainTextColor} mb={2}>
                Contest Info
              </Heading>
              <Text color={subTextColor} mb={4} textAlign="center">
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
              <Heading size="md" color={mainTextColor}>
                Ready to Trade?
              </Heading>
              <Text color={subTextColor}>
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
          <Modal
            isOpen={isOpen}
            onClose={onClose}
            isCentered
            size="xl"
            motionPreset="slideInBottom"
          >
            <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.600" />
            <ModalContent
              borderRadius="2xl"
              boxShadow="2xl"
              bg={bgColor}
              p={6}
              mx={4}
              bgGradient={useColorModeValue(
                "linear(to-br, white, blue.50)",
                "linear(to-br, gray.800, blue.900)"
              )}
            >
              <ModalHeader
                color={mainTextColor}
                fontWeight="extrabold"
                fontSize="3xl"
                textAlign="center"
                pb={2}
                bgGradient={useColorModeValue(
                  "linear(to-r, blue.600, purple.600)",
                  "linear(to-r, blue.200, purple.200)"
                )}
                bgClip="text"
              >
                🏆 Trading Contest
              </ModalHeader>
              <ModalCloseButton size="lg" color={mainTextColor} />
              <ModalBody>
                <VStack spacing={6} align="stretch">
                  <Text
                    fontSize="lg"
                    color={mainTextColor}
                    textAlign="center"
                    fontWeight="medium"
                    lineHeight="tall"
                  >
                    This months is standard. All accounts will start with
                    $30,000. Trade your way to the top before the month is over
                    and win prizes!
                  </Text>

                  <Box
                    bg="uoft.navy"
                    color="white"
                    p={6}
                    borderRadius="2xl"
                    boxShadow="lg"
                    position="relative"
                    overflow="hidden"
                    _before={{
                      content: '""',
                      position: "absolute",
                      top: "-50%",
                      left: "-50%",
                      width: "200%",
                      height: "200%",
                      backgroundImage:
                        "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)",
                      opacity: 0.5,
                    }}
                  >
                    <HStack spacing={3} mb={4}>
                      <Icon as={FaChartLine} w={6} h={6} />
                      <Text fontWeight="bold" fontSize="xl">
                        Rules
                      </Text>
                    </HStack>
                    <VStack align="stretch" spacing={3} position="relative">
                      <HStack spacing={4}>
                        <Box w={1} h={6} bg="blue.300" borderRadius="full" />
                        <Text>Start with $30,000 in virtual cash</Text>
                      </HStack>
                      <HStack spacing={4}>
                        <Box w={1} h={6} bg="blue.300" borderRadius="full" />
                        <Text>Buy and sell real stocks with live prices</Text>
                      </HStack>
                      <HStack spacing={4}>
                        <Box w={1} h={6} bg="blue.300" borderRadius="full" />
                        <Text>
                          Top traders win prizes at the end of the contest
                        </Text>
                      </HStack>
                      <HStack spacing={4}>
                        <Box w={1} h={6} bg="blue.300" borderRadius="full" />
                        <Text>
                          No real money is involved - Winners will be contacted
                          by the end of the contest via Gmail
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  <Box
                    bg="uoft.lightBlue"
                    color="white"
                    p={6}
                    borderRadius="2xl"
                    boxShadow="lg"
                    position="relative"
                    overflow="hidden"
                    _before={{
                      content: '""',
                      position: "absolute",
                      top: "-50%",
                      left: "-50%",
                      width: "200%",
                      height: "200%",
                      backgroundImage:
                        "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)",
                      opacity: 0.5,
                    }}
                  >
                    <HStack spacing={3} mb={4}>
                      <Icon as={FaTrophy} w={6} h={6} />
                      <Text fontWeight="bold" fontSize="xl">
                        Prizes
                      </Text>
                    </HStack>
                    <VStack align="stretch" spacing={6}>
                      <HStack
                        spacing={4}
                        p={4}
                        bg="whiteAlpha.200"
                        borderRadius="xl"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "lg",
                        }}
                        transition="all 0.2s"
                      >
                        <Icon as={FaTrophy} color="yellow.300" w={8} h={8} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="lg">
                            1st Place
                          </Text>
                          <Text fontSize="xl" fontWeight="extrabold">
                            $50 Amazon Gift Card
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack
                        spacing={4}
                        p={4}
                        bg="whiteAlpha.200"
                        borderRadius="xl"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "lg",
                        }}
                        transition="all 0.2s"
                      >
                        <Icon as={FaTrophy} color="gray.300" w={7} h={7} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="lg">
                            2nd Place
                          </Text>
                          <Text fontSize="xl" fontWeight="extrabold">
                            $25 Amazon Gift Card
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack
                        spacing={4}
                        p={4}
                        bg="whiteAlpha.200"
                        borderRadius="xl"
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "lg",
                        }}
                        transition="all 0.2s"
                      >
                        <Icon as={FaTrophy} color="orange.300" w={6} h={6} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="lg">
                            3rd Place
                          </Text>
                          <Text fontSize="xl" fontWeight="extrabold">
                            $10 Amazon Gift Card
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </Box>

                  <Text
                    fontSize="sm"
                    color={subTextColor}
                    textAlign="center"
                    fontStyle="italic"
                  >
                    For more details, contact organizers
                  </Text>
                </VStack>
              </ModalBody>
              <ModalFooter justifyContent="center" pt={6}>
                <Button
                  colorScheme="blue"
                  size="lg"
                  borderRadius="full"
                  px={12}
                  onClick={onClose}
                  bgGradient="linear(to-r, blue.400, blue.600)"
                  _hover={{
                    bgGradient: "linear(to-r, blue.500, blue.700)",
                    transform: "translateY(-2px)",
                    boxShadow: "lg",
                  }}
                  transition="all 0.2s"
                >
                  Got it!
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
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
          <ModalHeader color={mainTextColor} fontWeight="bold" fontSize="2xl">
            About UofT Stocker
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="lg" color={subTextColor}>
              UofT Stocker is a simulated stock trading platform designed for
              University of Toronto students. Compete with your peers, manage a
              virtual portfolio, and climb the leaderboard. Each month features
              a unique contest to see who can grow their portfolio the most. Aim
              for the top and earn rewards—click on "Contest Info" for details.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard;
