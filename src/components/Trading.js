import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  VStack,
  Input,
  Button,
  Text,
  Heading,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  InputGroup,
  InputRightElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Progress,
  Skeleton,
  HStack,
  Flex,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import {
  FaChartLine,
  FaSearch,
  FaArrowRight,
  FaInfoCircle,
} from "react-icons/fa";
import { fetchStockPrice, fetchStockPrices } from "../services/stockService";

function Trading() {
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [portfolio, setPortfolio] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [userData, setUserData] = useState(null);
  const [sellQuantities, setSellQuantities] = useState({});
  const location = useLocation();

  const { currentUser } = useAuth();
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mainTextColor = useColorModeValue("blue.900", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.200");
  const statNumberColor = useColorModeValue("blue.800", "blue.200");
  const pageBgColor = useColorModeValue("gray.50", "gray.900");
  const cardBgColor = useColorModeValue("white", "gray.800");
  const cardBorderColor = useColorModeValue("blue.400", borderColor);
  const tableHeaderBg = useColorModeValue("blue.100", "blue.800");
  const tableRowAltBg = useColorModeValue("white", "blue.800");
  const tableRowBg = useColorModeValue("blue.50", "blue.900");
  const buyButtonGradient = useColorModeValue(
    "linear(to-r, blue.400, blue.600)",
    "linear(to-r, blue.700, blue.900)"
  );
  const buyButtonHover = useColorModeValue("blue.600", "blue.400");
  const sellButtonBg = useColorModeValue("red.500", "red.400");
  const sellButtonColor = useColorModeValue("white", "blue.900");
  const sellButtonHover = useColorModeValue("red.600", "red.300");
  const tabSelectedBg = useColorModeValue("blue.200", "blue.700");
  const tabSelectedColor = useColorModeValue("blue.900", "white");
  const numberInputBg = useColorModeValue("gray.100", "gray.700");

  // Blue gradient for hover and avatar
  const blueGradient = useColorModeValue(
    "linear(to-r, blue.400, blue.600)",
    "linear(to-r, blue.700, blue.900)"
  );
  const blueSolid = useColorModeValue("blue.600", "blue.400");

  // Use solid blue for avatar and row hover
  const solidAvatarBg = useColorModeValue("blue.600", "blue.300");
  const solidAvatarColor = "white";
  const tableRowHoverBg = useColorModeValue("blue.50", "blue.900");

  // For P/L badge (only green and red)
  const badgePositiveColorScheme = "green";
  const badgeNegativeColorScheme = "red";
  const badgePositiveBg = useColorModeValue("green.100", "green.700");
  const badgeNegativeBg = useColorModeValue("red.100", "red.700");
  const badgePositiveColor = useColorModeValue("green.800", "green.200");
  const badgeNegativeColor = useColorModeValue("red.800", "red.200");

  const tableRowBorderBottom = useColorModeValue(
    "1px solid #90cdf4",
    "1px solid #2b6cb0"
  );

  // Add new color mode values
  const stockHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tradingControlsBg = useColorModeValue("gray.50", "gray.700");
  const cardShadow = useColorModeValue("lg", "dark-lg");

  // Consolidated data fetching
  const fetchData = async () => {
    if (!currentUser) return;

    setLoadingPortfolio(true);
    try {
      // Fetch user data and stocks in parallel
      const [userDoc, stocksSnapshot] = await Promise.all([
        getDoc(doc(db, "users", currentUser.uid)),
        getDocs(
          query(
            collection(db, "stocks"),
            where("userId", "==", currentUser.uid)
          )
        ),
      ]);

      // Process user data
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      // Process portfolio data
      const stocksRaw = stocksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get prices for all stocks
      const uniqueSymbols = [
        ...new Set(stocksRaw.map((stock) => stock.symbol)),
      ];
      const priceMap = await fetchStockPrices(uniqueSymbols);

      // Build portfolio with price data
      const stocks = stocksRaw.map((stock) => {
        const priceData = priceMap[stock.symbol];
        if (priceData) {
          return {
            ...stock,
            currentPrice: priceData.price,
            totalValue: priceData.price * stock.quantity,
            profitLoss:
              (priceData.price - stock.purchasePrice) * stock.quantity,
            profitLossPercentage:
              ((priceData.price - stock.purchasePrice) / stock.purchasePrice) *
              100,
          };
        }
        return {
          ...stock,
          currentPrice: stock.purchasePrice, // Fallback to purchase price if current price unavailable
          totalValue: stock.purchasePrice * stock.quantity,
          profitLoss: 0,
          profitLossPercentage: 0,
        };
      });

      setPortfolio(stocks);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingPortfolio(false);
    }
  };

  // Initial data fetch and refresh on route change
  useEffect(() => {
    fetchData();
  }, [currentUser, location.pathname]);

  // Periodic refresh of portfolio data
  useEffect(() => {
    if (!portfolio.length) return;

    const interval = setInterval(fetchData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [portfolio.length]);

  const searchStock = async () => {
    if (!symbol) {
      toast({
        title: "Error",
        description: "Please enter a stock symbol",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const upperSymbol = symbol.trim().toUpperCase();
      const stockData = await fetchStockPrice(upperSymbol);

      setStockData({
        symbol: upperSymbol,
        ...stockData,
      });

      toast.closeAll();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setStockData(null);
    } finally {
      setLoading(false);
    }
  };

  // Update isMarketOpen to restrict trading to regular US market hours (Mon-Fri, 9:30am-4:00pm ET)
  function isMarketOpen() {
    const now = new Date();
    // Get current time in America/New_York (Eastern Time)
    const nyNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const day = nyNow.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const hours = nyNow.getHours();
    const minutes = nyNow.getMinutes();
    // Market open: 9:30am to 4:00pm ET, Monday-Friday
    if (day === 0 || day === 6) return false; // Weekend
    if (hours < 9 || (hours === 9 && minutes < 30)) return false; // Before 9:30am
    if (hours > 16 || (hours === 16 && minutes > 0)) return false; // After 4:00pm
    return true;
  }

  const marketOpen = isMarketOpen();

  const handleTrade = async (type) => {
    if (!marketOpen) {
      toast({
        title: "Market Closed",
        description:
          "Trading is only allowed during market hours (Mon-Fri, 9:30am-4:00pm ET)",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!stockData || !quantity) return;

    try {
      const batch = writeBatch(db);
      const cost = stockData.price * quantity;

      if (type === "buy") {
        if (cost > userData.balance) {
          throw new Error("Insufficient funds");
        }

        // Update user balance
        const userRef = doc(db, "users", currentUser.uid);
        batch.update(userRef, {
          balance: userData.balance - cost,
        });

        // Check if user already owns this stock
        const existingStockQuery = query(
          collection(db, "stocks"),
          where("userId", "==", currentUser.uid),
          where("symbol", "==", stockData.symbol)
        );
        const existingStockDocs = await getDocs(existingStockQuery);

        if (!existingStockDocs.empty) {
          // Update existing position
          const existingStock = existingStockDocs.docs[0];
          const newQuantity = existingStock.data().quantity + quantity;
          const newAvgPrice =
            (existingStock.data().purchasePrice *
              existingStock.data().quantity +
              cost) /
            newQuantity;

          batch.update(existingStock.ref, {
            quantity: newQuantity,
            purchasePrice: newAvgPrice,
          });
        } else {
          // Create new position
          const stockRef = doc(collection(db, "stocks"));
          batch.set(stockRef, {
            userId: currentUser.uid,
            symbol: stockData.symbol,
            quantity: quantity,
            purchasePrice: stockData.price,
            timestamp: serverTimestamp(),
          });
        }

        // Commit the batch
        await batch.commit();

        // Optimistically update state
        setUserData((prev) => ({
          ...prev,
          balance: prev.balance - cost,
        }));

        // Only fetch portfolio if it's a new position
        if (existingStockDocs.empty) {
          await fetchData();
        } else {
          // Optimistically update portfolio for existing position
          setPortfolio((prev) =>
            prev.map((stock) =>
              stock.symbol === stockData.symbol
                ? {
                    ...stock,
                    quantity: stock.quantity + quantity,
                    purchasePrice:
                      (stock.purchasePrice * stock.quantity + cost) /
                      (stock.quantity + quantity),
                  }
                : stock
            )
          );
        }

        toast({
          title: "Success",
          description: `Successfully bought ${quantity} shares of ${stockData.symbol}`,
          status: "success",
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      console.error("Trade error:", error);
    }
  };

  const handleSell = async (stock, sellQuantity) => {
    if (!marketOpen) {
      toast({
        title: "Market Closed",
        description:
          "Trading is only allowed during market hours (Mon-Fri, 9:30am-4:00pm ET)",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      // Get latest price
      const priceData = await fetchStockPrice(stock.symbol);
      const proceeds = priceData.price * sellQuantity;

      const batch = writeBatch(db);

      // Update user balance
      const userRef = doc(db, "users", currentUser.uid);
      batch.update(userRef, {
        balance: increment(proceeds),
      });

      // Update or delete stock position
      const stockRef = doc(db, "stocks", stock.id);
      if (sellQuantity === stock.quantity) {
        batch.delete(stockRef);
      } else {
        batch.update(stockRef, {
          quantity: stock.quantity - sellQuantity,
        });
      }

      // Commit the batch
      await batch.commit();

      // Optimistically update state
      setUserData((prev) => ({
        ...prev,
        balance: prev.balance + proceeds,
      }));

      // Optimistically update portfolio
      setPortfolio((prev) =>
        prev
          .map((s) => {
            if (s.id === stock.id) {
              if (sellQuantity === s.quantity) {
                return null; // Remove stock
              }
              return {
                ...s,
                quantity: s.quantity - sellQuantity,
                currentPrice: priceData.price,
                totalValue: priceData.price * (s.quantity - sellQuantity),
                profitLoss:
                  (priceData.price - s.purchasePrice) *
                  (s.quantity - sellQuantity),
              };
            }
            return s;
          })
          .filter(Boolean)
      );

      toast({
        title: "Success",
        description: `Successfully sold ${sellQuantity} shares of ${stock.symbol}`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      console.error("Sell error:", error);
    }
  };

  // Add refresh for currently selected stock
  useEffect(() => {
    if (!stockData?.symbol) return;
    let isMounted = true;

    const refreshSelectedStock = async () => {
      try {
        const priceData = await fetchStockPrice(stockData.symbol);
        if (!isMounted) return;

        setStockData((prev) => ({
          ...prev,
          price: priceData.price,
          change: priceData.change,
          changePercent: priceData.changePercent,
          timestamp: priceData.timestamp,
        }));
      } catch (error) {
        console.error("Error refreshing selected stock:", error);
      }
    };

    const interval = setInterval(refreshSelectedStock, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [stockData?.symbol]);

  return (
    <Box minH="100vh" bg={pageBgColor} py={8}>
      <Container maxW="container.xl">
        {/* Header with Balance */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          mb={8}
          gap={4}
        >
          <VStack align="start" spacing={1}>
            <Heading size="lg" color={mainTextColor}>
              Stock Trading
            </Heading>
            <Text color={subTextColor}>Live market trading simulation</Text>
          </VStack>
          <Box bg={cardBgColor} p={4} borderRadius="lg" boxShadow={cardShadow}>
            <HStack spacing={8} align="end">
              {/* Available Balance */}
              <VStack align="end" spacing={1}>
                <Text color={subTextColor} fontSize="sm">
                  Available Balance
                </Text>
                <Text color={mainTextColor} fontSize="2xl" fontWeight="bold">
                  {userData ? (
                    `$${userData.balance?.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  ) : (
                    <Skeleton height="1.5rem" width="150px" />
                  )}
                </Text>
              </VStack>

              {/* Portfolio Value */}
              <VStack align="end" spacing={1}>
                <Text color={subTextColor} fontSize="sm">
                  Portfolio Value
                </Text>
                <Text color={mainTextColor} fontSize="2xl" fontWeight="bold">
                  {portfolio.length > 0
                    ? `$${portfolio
                        .reduce(
                          (total, stock) =>
                            total + stock.currentPrice * stock.quantity,
                          0
                        )
                        .toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                    : "$0.00"}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </Flex>

        {/* Main Content */}
        <Flex gap={8} direction={{ base: "column", xl: "row" }}>
          {/* Left Panel - Trading Interface */}
          <Box flex={1}>
            <VStack spacing={6} align="stretch">
              {/* Search Bar */}
              <Box
                bg={cardBgColor}
                p={6}
                borderRadius="lg"
                boxShadow={cardShadow}
              >
                <VStack spacing={4}>
                  <InputGroup size="lg">
                    <Input
                      placeholder="Search stock symbol (NVDA)"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      bg={useColorModeValue("white", "gray.700")}
                      color={mainTextColor}
                      borderRadius="md"
                      fontSize="lg"
                      textTransform="uppercase"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          searchStock();
                        }
                      }}
                    />
                    <InputRightElement width="5.5rem" pr={1}>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        isLoading={loading}
                        onClick={searchStock}
                      >
                        Search
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </VStack>
              </Box>

              {/* Stock Info & Trading Panel */}
              {stockData && (
                <Box
                  bg={cardBgColor}
                  borderRadius="lg"
                  boxShadow={cardShadow}
                  overflow="hidden"
                >
                  {/* Stock Header */}
                  <Box
                    p={6}
                    borderBottom="1px"
                    borderColor={borderColor}
                    bg={stockHeaderBg}
                  >
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <HStack>
                          <Text
                            fontSize="2xl"
                            fontWeight="bold"
                            color={mainTextColor}
                          >
                            {stockData.symbol}
                          </Text>
                          <Badge
                            colorScheme={
                              stockData.change >= 0 ? "green" : "red"
                            }
                            fontSize="md"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                          >
                            {stockData.change >= 0 ? "+" : ""}
                            {stockData.changePercent.toFixed(2)}%
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color={subTextColor}>
                          Last Updated: {new Date().toLocaleTimeString()}
                        </Text>
                      </VStack>
                      <Text
                        fontSize="3xl"
                        fontWeight="bold"
                        color={mainTextColor}
                      >
                        ${stockData.price.toFixed(2)}
                      </Text>
                    </Flex>
                  </Box>

                  {/* Trading Controls */}
                  <Box p={6}>
                    <VStack spacing={6}>
                      {/* Market Status */}
                      <HStack
                        w="100%"
                        p={3}
                        bg={tradingControlsBg}
                        borderRadius="md"
                        justify="center"
                      >
                        <Box
                          w={2}
                          h={2}
                          borderRadius="full"
                          bg={isMarketOpen() ? "green.400" : "red.400"}
                        />
                        <Text color={subTextColor} fontSize="sm">
                          Market {isMarketOpen() ? "Open" : "Closed"}
                        </Text>
                      </HStack>

                      {/* Trade Form */}
                      <HStack w="100%" spacing={4}>
                        <Box flex={1}>
                          <Text mb={2} color={subTextColor} fontSize="sm">
                            Quantity
                          </Text>
                          <NumberInput
                            value={quantity}
                            min={1}
                            onChange={(value) => setQuantity(Number(value))}
                            size="lg"
                          >
                            <NumberInputField bg={numberInputBg} />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Box>
                        <Box flex={1}>
                          <Text mb={2} color={subTextColor} fontSize="sm">
                            Total Cost
                          </Text>
                          <Text
                            p={4}
                            bg={numberInputBg}
                            borderRadius="md"
                            fontSize="lg"
                            fontWeight="bold"
                            color={mainTextColor}
                          >
                            ${(stockData.price * quantity).toFixed(2)}
                          </Text>
                        </Box>
                      </HStack>

                      {/* Action Buttons */}
                      <HStack w="100%" spacing={4}>
                        <Button
                          flex={1}
                          size="lg"
                          colorScheme="green"
                          onClick={() => handleTrade("buy")}
                          isDisabled={!isMarketOpen()}
                        >
                          Buy {stockData.symbol}
                        </Button>
                      </HStack>

                      {!isMarketOpen() && (
                        <Alert status="warning" borderRadius="md">
                          <AlertIcon />
                          <Text fontSize="sm">
                            Market is closed. Trading hours: Mon-Fri, 9:30 AM -
                            4:00 PM ET
                          </Text>
                        </Alert>
                      )}
                    </VStack>
                  </Box>
                </Box>
              )}
            </VStack>
          </Box>

          {/* Right Panel - Portfolio */}
          <Box
            flex={1}
            bg={cardBgColor}
            borderRadius="lg"
            boxShadow={cardShadow}
            height="fit-content"
          >
            <Box
              p={4}
              borderBottom="1px"
              borderColor={borderColor}
              bg={useColorModeValue("gray.50", "gray.700")}
            >
              <Heading size="md" color={mainTextColor}>
                Your Portfolio
              </Heading>
            </Box>

            {portfolio.length > 0 ? (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Symbol</Th>
                    <Th isNumeric>Shares</Th>
                    <Th isNumeric>Avg. Cost</Th>
                    <Th isNumeric>Current</Th>
                    <Th isNumeric>P/L</Th>
                    <Th>Action</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {portfolio.map((stock) => (
                    <Tr key={stock.id}>
                      <Td fontWeight="bold" color={mainTextColor}>
                        {stock.symbol}
                      </Td>
                      <Td isNumeric>{stock.quantity}</Td>
                      <Td isNumeric>${stock.purchasePrice.toFixed(2)}</Td>
                      <Td isNumeric>${stock.currentPrice.toFixed(2)}</Td>
                      <Td isNumeric>
                        <Text
                          color={
                            stock.profitLoss >= 0 ? "green.400" : "red.400"
                          }
                          fontWeight="bold"
                        >
                          {stock.profitLoss >= 0 ? "+" : ""}$
                          {stock.profitLoss.toFixed(2)}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <NumberInput
                            size="sm"
                            min={1}
                            max={stock.quantity}
                            value={sellQuantities[stock.id] || 1}
                            onChange={(value) => {
                              const numValue = Number(value);
                              setSellQuantities((prev) => ({
                                ...prev,
                                [stock.id]: Math.min(
                                  Math.max(1, numValue),
                                  stock.quantity
                                ),
                              }));
                            }}
                            width="80px"
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                          <Button
                            size="sm"
                            colorScheme="red"
                            onClick={() =>
                              handleSell(stock, sellQuantities[stock.id] || 1)
                            }
                            isDisabled={!isMarketOpen()}
                          >
                            Sell
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Box p={8} textAlign="center">
                <Text color={subTextColor}>
                  Your portfolio is empty. Start trading to build your
                  portfolio!
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

export default Trading;
