import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Progress,
  Badge,
} from "@chakra-ui/react";
import {
  FaChartLine,
  FaTrophy,
  FaUserCircle,
  FaArrowRight,
  FaQuestionCircle,
  FaWallet,
  FaDollarSign,
  FaClock,
  FaCalendarAlt,
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
import { useAuth } from "../contexts/AuthContext";
import { fetchStockPrices } from "../services/stockService";

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    percentageChange: 0,
    rank: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [contestTimer, setContestTimer] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const { currentUser } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isAboutOpen,
    onOpen: onAboutOpen,
    onClose: onAboutClose,
  } = useDisclosure();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mainTextColor = useColorModeValue("uoft.navy", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.200");
  const pageBgColor = useColorModeValue("gray.50", "gray.900");
  const iconColor = useColorModeValue("blue.500", "blue.200");
  const cardShadow = useColorModeValue("lg", "dark-lg");
  const gradientStart = useColorModeValue("blue.400", "blue.500");
  const gradientEnd = useColorModeValue("blue.500", "blue.600");
  const hoverBorderColor = useColorModeValue("blue.400", "blue.300");
  const cardHoverBg = useColorModeValue("gray.50", "gray.700");
  const progressBg = useColorModeValue("gray.100", "gray.600");

  const prizeCardBg = useColorModeValue("white", "gray.800");
  const prizeCardBorder = useColorModeValue("purple.200", "purple.600");
  const prizeTextColor = useColorModeValue("purple.600", "purple.300");

  const ruleItemBg = useColorModeValue("whiteAlpha.200", "whiteAlpha.100");
  const ruleBulletBg = useColorModeValue("blue.200", "blue.300");
  const keyRulesBg = useColorModeValue("blue.600", "uoft.navy");
  const keyRulesTextColor = useColorModeValue("white", "white");

  const calculateContestTimer = () => {
    const now = new Date();
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    const timeLeft = endOfMonth - now;

    if (timeLeft > 0) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setContestTimer({ days, hours, minutes, seconds });
    } else {
      setContestTimer({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    }
  };

  useEffect(() => {
    calculateContestTimer();
    const timer = setInterval(calculateContestTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      const hasSeenModal = localStorage.getItem("contestModalSeen");
      if (!hasSeenModal) {
        onOpen();
        localStorage.setItem("contestModalSeen", "true");
      }
    }
  }, [loading, onOpen]);

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

    userStocks.forEach((stock) => {
      const priceData = priceMap[stock.symbol];
      if (priceData) {
        portfolioValue += priceData.price * stock.quantity;
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

  useEffect(() => {
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
          Math.abs(stats.totalValue - (userData?.totalValue || 0)) > 5;
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

  const transitionStyles = { transition: "all 0.3s ease" };
  const buttonTransitionStyles = { transition: "all 0.2s ease" };

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
              Welcome
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
                borderRadius="xl"
                boxShadow={cardShadow}
                border="1px"
                borderColor={borderColor}
                {...transitionStyles}
                position="relative"
                overflow="hidden"
                _hover={{
                  transform: "translateY(-4px)",
                  boxShadow: "2xl",
                  borderColor: hoverBorderColor,
                  bg: cardHoverBg,
                }}
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  bgGradient: `linear(to-r, ${gradientStart}, ${gradientEnd})`,
                }}
              >
                <VStack spacing={3} align="stretch">
                  <HStack spacing={2}>
                    <Icon as={stat.icon} w={6} h={6} color={iconColor} />
                    <Text
                      color={subTextColor}
                      fontSize="sm"
                      fontWeight="medium"
                    >
                      {stat.label}
                    </Text>
                  </HStack>
                  <Stat>
                    <StatNumber
                      fontSize="2xl"
                      fontWeight="bold"
                      color={mainTextColor}
                    >
                      {loading ? <Skeleton height="20px" /> : stat.value}
                    </StatNumber>
                    {stat.helpText && (
                      <StatHelpText fontSize="sm" fontWeight="medium">
                        {stat.helpText}
                      </StatHelpText>
                    )}
                  </Stat>
                  {stat.change !== undefined &&
                    stat.label !== "Portfolio Value" && (
                      <Progress
                        value={Math.abs(stat.change)}
                        max={100}
                        size="sm"
                        colorScheme={stat.change >= 0 ? "green" : "red"}
                        borderRadius="full"
                        bg={progressBg}
                      />
                    )}
                </VStack>
              </Box>
            ))}
            <Box
              bg={bgColor}
              p={6}
              borderRadius="xl"
              boxShadow={cardShadow}
              border="1px"
              borderColor={borderColor}
              {...transitionStyles}
              position="relative"
              overflow="hidden"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "2xl",
                borderColor: hoverBorderColor,
                bg: cardHoverBg,
              }}
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                bgGradient: `linear(to-r, ${gradientStart}, ${gradientEnd})`,
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
                {...buttonTransitionStyles}
                _hover={{
                  transform: "translateY(-2px)",
                  boxShadow: "lg",
                }}
              >
                Show More
              </Button>
            </Box>
          </SimpleGrid>

          <Box
            bg={bgColor}
            p={8}
            borderRadius="xl"
            boxShadow={cardShadow}
            border="1px"
            borderColor={borderColor}
            textAlign="center"
            {...transitionStyles}
            position="relative"
            overflow="hidden"
            _hover={{
              borderColor: hoverBorderColor,
              bg: cardHoverBg,
            }}
            _before={{
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              bgGradient: `linear(to-r, ${gradientStart}, ${gradientEnd})`,
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
                {...buttonTransitionStyles}
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
              p={0}
              mx={4}
              overflow="hidden"
              maxH="90vh"
            >
              <Box
                bgGradient={useColorModeValue(
                  "linear(to-r, blue.600, purple.600)",
                  "linear(to-r, blue.700, purple.700)"
                )}
                p={6}
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
                  opacity: 0.3,
                }}
              >
                <VStack spacing={4} position="relative" zIndex={1}>
                  <Heading
                    color="white"
                    fontWeight="extrabold"
                    fontSize="3xl"
                    textAlign="center"
                  >
                    🏆 Monthly Trading Contest
                  </Heading>
                </VStack>
              </Box>

              <ModalBody p={6} maxH="70vh" overflowY="auto">
                <VStack spacing={4} align="stretch">
                  <Box textAlign="center" mb={2}>
                    <Badge
                      colorScheme="yellow"
                      variant="solid"
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontSize="md"
                      fontWeight="bold"
                    >
                      Kickoff Contest
                    </Badge>
                  </Box>

                  <Box
                    bg={useColorModeValue("blue.50", "blue.900")}
                    p={4}
                    borderRadius="xl"
                    border="2px"
                    borderColor={useColorModeValue("blue.200", "blue.700")}
                    textAlign="center"
                  >
                    <HStack spacing={2} mb={3} justify="center">
                      <Icon as={FaClock} color="blue.500" w={5} h={5} />
                      <Text
                        fontWeight="bold"
                        fontSize="lg"
                        color={mainTextColor}
                      >
                        Contest Ends In
                      </Text>
                    </HStack>

                    <SimpleGrid columns={4} spacing={2} mb={3}>
                      {[
                        { value: contestTimer.days, label: "Days" },
                        {
                          value: contestTimer.hours.toString().padStart(2, "0"),
                          label: "Hours",
                        },
                        {
                          value: contestTimer.minutes
                            .toString()
                            .padStart(2, "0"),
                          label: "Mins",
                        },
                        {
                          value: contestTimer.seconds
                            .toString()
                            .padStart(2, "0"),
                          label: "Secs",
                        },
                      ].map((item, index) => (
                        <VStack key={index} spacing={1}>
                          <Box
                            bg="blue.500"
                            color="white"
                            p={2}
                            borderRadius="lg"
                            fontWeight="bold"
                            fontSize="lg"
                            minW="50px"
                          >
                            {item.value}
                          </Box>
                          <Text
                            fontSize="xs"
                            color={subTextColor}
                            fontWeight="medium"
                          >
                            {item.label}
                          </Text>
                        </VStack>
                      ))}
                    </SimpleGrid>

                    <Progress
                      value={(contestTimer.days / 31) * 100}
                      colorScheme="blue"
                      size="sm"
                      borderRadius="full"
                      bg={useColorModeValue("blue.100", "blue.800")}
                    />
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box
                      bg={useColorModeValue("gray.50", "gray.700")}
                      p={4}
                      borderRadius="xl"
                      border="1px"
                      borderColor={useColorModeValue("gray.200", "gray.600")}
                    >
                      <HStack spacing={2} mb={3}>
                        <Icon as={FaCalendarAlt} color="blue.500" w={5} h={5} />
                        <Text
                          fontWeight="bold"
                          fontSize="md"
                          color={mainTextColor}
                        >
                          Overview
                        </Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        color={subTextColor}
                        lineHeight="tall"
                      >
                        Start with $30,000 virtual cash. Trade real stocks with
                        live prices. Highest portfolio value at the end of the
                        month wins! Add your LinkedIn and a description about
                        yourself in settings!
                      </Text>
                    </Box>

                    <Box
                      bg={keyRulesBg}
                      color={keyRulesTextColor}
                      p={4}
                      borderRadius="xl"
                      boxShadow="lg"
                    >
                      <HStack spacing={2} mb={3}>
                        <Icon as={FaChartLine} w={5} h={5} />
                        <Text fontWeight="bold" fontSize="md">
                          Key Rules
                        </Text>
                      </HStack>
                      <VStack align="stretch" spacing={2}>
                        {[
                          "$30,000 starting balance",
                          "Live market prices",
                          "Daily leaderboard update",
                          "Winners notified by email",
                        ].map((rule, index) => (
                          <HStack
                            key={index}
                            spacing={2}
                            p={2}
                            bg={ruleItemBg}
                            borderRadius="md"
                          >
                            <Box
                              w={1.5}
                              h={1.5}
                              bg={ruleBulletBg}
                              borderRadius="full"
                            />
                            <Text fontSize="sm" fontWeight="medium">
                              {rule}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  </SimpleGrid>

                  <Box
                    bg={useColorModeValue("purple.50", "purple.900")}
                    p={4}
                    borderRadius="xl"
                    border="2px"
                    borderColor={useColorModeValue("purple.200", "purple.700")}
                  >
                    <HStack spacing={2} mb={4} justify="center">
                      <Icon as={FaTrophy} color="purple.500" w={5} h={5} />
                      <Text
                        fontWeight="bold"
                        fontSize="lg"
                        color={mainTextColor}
                      >
                        Prizes
                      </Text>
                    </HStack>
                    <SimpleGrid columns={3} spacing={3}>
                      {[
                        {
                          place: "1st",
                          prize: "tbd",
                          medal: "🥇",
                          color: "yellow",
                        },
                        {
                          place: "2nd",
                          prize: "tbd",
                          medal: "🥈",
                          color: "gray",
                        },
                        {
                          place: "3rd",
                          prize: "tbd",
                          medal: "🥉",
                          color: "orange",
                        },
                      ].map((prize, index) => (
                        <VStack
                          key={index}
                          spacing={2}
                          p={3}
                          bg={prizeCardBg}
                          borderRadius="lg"
                          boxShadow="sm"
                          border="1px"
                          borderColor={prizeCardBorder}
                          _hover={{
                            transform: "translateY(-1px)",
                            boxShadow: "md",
                          }}
                          transition="all 0.2s"
                        >
                          <Text fontSize="2xl">{prize.medal}</Text>
                          <Text
                            fontWeight="bold"
                            fontSize="sm"
                            color={mainTextColor}
                          >
                            {prize.place} Place
                          </Text>
                          <Text
                            fontSize="lg"
                            fontWeight="extrabold"
                            color={prizeTextColor}
                          >
                            {prize.prize}
                          </Text>
                          <Badge
                            colorScheme={prize.color}
                            variant="solid"
                            fontSize="xs"
                          >
                            {prize.place === "1st"
                              ? "GOLD"
                              : prize.place === "2nd"
                              ? "SILVER"
                              : "BRONZE"}
                          </Badge>
                        </VStack>
                      ))}
                    </SimpleGrid>
                  </Box>

                  <Text
                    fontSize="sm"
                    color={subTextColor}
                    textAlign="center"
                    fontStyle="italic"
                    mt={2}
                  >
                    Good luck! Trade wisely and may the best portfolio win! 🚀
                  </Text>
                </VStack>
              </ModalBody>

              <ModalFooter
                justifyContent="center"
                p={6}
                bg={useColorModeValue("gray.50", "gray.800")}
              >
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
              a unique contest with new rules to see who can grow their
              portfolio the most. Aim for the top and earn rewards—click on
              "Contest Info" for details.
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Dashboard;
