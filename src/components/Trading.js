import React, { useState, useEffect, useCallback } from "react";
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
  useColorModeValue,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  Skeleton,
  HStack,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { FaDollarSign, FaChartPie } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { db } from "../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { fetchStockPrice, fetchStockPrices } from "../services/stockService";

function Trading() {
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [portfolio, setPortfolio] = useState([]);
  const [userData, setUserData] = useState(null);
  const [sellQuantities, setSellQuantities] = useState({});
  const [isTrading, setIsTrading] = useState(false);

  const { currentUser, guestMode } = useAuth();
  const toast = useToast();
  const location = useLocation();

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const mainTextColor = useColorModeValue("blue.900", "white");
  const subTextColor = useColorModeValue("gray.600", "gray.200");
  const pageBgColor = useColorModeValue("gray.50", "gray.900");
  const cardBgColor = useColorModeValue("white", "gray.800");
  const numberInputBg = useColorModeValue("gray.100", "gray.700");
  const stockHeaderBg = useColorModeValue("gray.50", "gray.700");
  const tradingControlsBg = useColorModeValue("gray.50", "gray.700");
  const cardShadow = useColorModeValue("lg", "dark-lg");
  const balanceGradient = useColorModeValue(
    "linear(to-r, green.400, green.500)",
    "linear(to-r, green.500, green.600)"
  );
  const portfolioGradient = useColorModeValue(
    "linear(to-r, blue.400, blue.500)",
    "linear(to-r, blue.500, blue.600)"
  );
  const guestAlertBg = useColorModeValue("blue.50", "blue.900");
  const guestAlertBorder = useColorModeValue("blue.200", "blue.700");

  const isMarketOpen = () => {
    const now = new Date();
    const nyNow = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const day = nyNow.getDay();
    const hours = nyNow.getHours();
    const minutes = nyNow.getMinutes();

    if (day === 0 || day === 6) return false;
    if (hours < 9 || (hours === 9 && minutes < 30)) return false;
    if (hours > 16 || (hours === 16 && minutes > 0)) return false;
    return true;
  };

  const marketOpen = isMarketOpen();

  const fetchData = useCallback(async () => {
    if (!currentUser && !guestMode) return;

    if (guestMode) {
      setUserData({
        balance: 30000,
        firstName: "Guest",
        lastName: "User",
        email: "guest@example.com",
      });
      setPortfolio([]);
      return;
    }

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

      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }

      const stocksRaw = stocksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const uniqueSymbols = [
        ...new Set(stocksRaw.map((stock) => stock.symbol)),
      ];
      const priceMap = await fetchStockPrices(uniqueSymbols, true);

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
          currentPrice: stock.purchasePrice,
          totalValue: stock.purchasePrice * stock.quantity,
          profitLoss: 0,
          profitLossPercentage: 0,
        };
      });

      setPortfolio(stocks);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch portfolio data. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [currentUser, guestMode, toast]);

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
      const stockData = await fetchStockPrice(upperSymbol, false);
      setStockData({ symbol: upperSymbol, ...stockData });
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

  const handleTrade = async (type) => {
    if (guestMode) {
      toast({
        title: "Guest Mode",
        description: "Please sign up to start trading!",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

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

    if (!stockData || !quantity || isTrading) return;

    setIsTrading(true);
    try {
      const cost = stockData.price * quantity;

      if (type === "buy") {
        if (cost > userData.balance) {
          throw new Error("Insufficient funds");
        }

        const batch = writeBatch(db);
        const userRef = doc(db, "users", currentUser.uid);
        batch.update(userRef, { balance: increment(-cost) });

        const existingStockQuery = query(
          collection(db, "stocks"),
          where("userId", "==", currentUser.uid),
          where("symbol", "==", stockData.symbol)
        );
        const existingStockDocs = await getDocs(existingStockQuery);

        if (!existingStockDocs.empty) {
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
          const stockRef = doc(collection(db, "stocks"));
          batch.set(stockRef, {
            userId: currentUser.uid,
            symbol: stockData.symbol,
            quantity: quantity,
            purchasePrice: stockData.price,
            timestamp: serverTimestamp(),
          });
        }

        await batch.commit();
        setUserData((prev) => ({ ...prev, balance: prev.balance - cost }));

        if (existingStockDocs.empty) {
          await fetchData();
        } else {
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
    } finally {
      setIsTrading(false);
    }
  };

  const handleSell = async (stock, sellQuantity) => {
    if (guestMode) {
      toast({
        title: "Guest Mode",
        description: "Please sign up to start trading!",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

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

    if (isTrading) return;

    setIsTrading(true);
    try {
      const priceData = await fetchStockPrice(stock.symbol);
      const proceeds = priceData.price * sellQuantity;

      const batch = writeBatch(db);
      const userRef = doc(db, "users", currentUser.uid);
      batch.update(userRef, { balance: increment(proceeds) });

      const stockRef = doc(db, "stocks", stock.id);
      if (sellQuantity === stock.quantity) {
        batch.delete(stockRef);
      } else {
        batch.update(stockRef, { quantity: stock.quantity - sellQuantity });
      }

      await batch.commit();
      setUserData((prev) => ({ ...prev, balance: prev.balance + proceeds }));

      setPortfolio((prev) =>
        prev
          .map((s) => {
            if (s.id === stock.id) {
              if (sellQuantity === s.quantity) return null;
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
    } finally {
      setIsTrading(false);
    }
  };

  const handleMaxBuy = () => {
    if (!stockData || !userData) return;
    const maxQuantity = Math.floor(userData.balance / stockData.price);
    setQuantity(maxQuantity);
  };

  useEffect(() => {
    if (currentUser || guestMode) {
      fetchData();
    }
  }, [currentUser, guestMode, location.pathname, fetchData]);

  useEffect(() => {
    if (!portfolio.length) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [portfolio.length, fetchData]);

  useEffect(() => {
    if (!stockData?.symbol) return;
    let isMounted = true;

    const refreshSelectedStock = async () => {
      try {
        const priceData = await fetchStockPrice(stockData.symbol, true);
        if (!isMounted) return;

        setStockData((prev) => ({
          ...prev,
          price: priceData.price,
          change: priceData.change,
          changePercent: priceData.changePercent,
          timestamp: priceData.timestamp,
        }));
      } catch (error) {}
    };

    const interval = setInterval(refreshSelectedStock, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [stockData?.symbol]);

  return (
    <Box minH="100vh" bg={pageBgColor} py={8}>
      <Container maxW="1400px">
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
          <HStack spacing={4} width={{ base: "100%", md: "auto" }}>
            <Box
              bg={cardBgColor}
              p={6}
              borderRadius="xl"
              boxShadow={cardShadow}
              position="relative"
              overflow="hidden"
              minW="200px"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                bgGradient: balanceGradient,
              }}
            >
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={FaDollarSign} color="green.400" boxSize={5} />
                  <Text color={subTextColor} fontSize="sm" fontWeight="medium">
                    Available Balance
                  </Text>
                  {guestMode && (
                    <Badge colorScheme="orange" size="sm" variant="solid">
                      Demo
                    </Badge>
                  )}
                </HStack>
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
            </Box>

            <Box
              bg={cardBgColor}
              p={6}
              borderRadius="xl"
              boxShadow={cardShadow}
              position="relative"
              overflow="hidden"
              minW="200px"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                bgGradient: portfolioGradient,
              }}
            >
              <VStack align="start" spacing={2}>
                <HStack>
                  <Icon as={FaChartPie} color="blue.400" boxSize={5} />
                  <Text color={subTextColor} fontSize="sm" fontWeight="medium">
                    Portfolio Value
                  </Text>
                </HStack>
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
            </Box>
          </HStack>
        </Flex>

        {guestMode && (
          <Alert
            status="info"
            variant="subtle"
            borderRadius="lg"
            mb={6}
            bg={guestAlertBg}
            border="1px"
            borderColor={guestAlertBorder}
          >
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" color={mainTextColor}>
                🎮 Demo Mode
              </Text>
              <Text fontSize="sm" color={subTextColor}>
                You're exploring the trading interface in demo mode. Sign up to
                start trading!
              </Text>
            </VStack>
          </Alert>
        )}

        <Flex gap={8} direction={{ base: "column", xl: "row" }}>
          <Box flex={0.8}>
            <VStack spacing={6} align="stretch">
              <Box
                bg={cardBgColor}
                p={6}
                borderRadius="lg"
                boxShadow={cardShadow}
              >
                <VStack spacing={4}>
                  <InputGroup size="lg">
                    <Input
                      placeholder="Search stock symbol (EG. NVDA)"
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

              {stockData && (
                <Box
                  bg={cardBgColor}
                  borderRadius="lg"
                  boxShadow={cardShadow}
                  overflow="hidden"
                >
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
                          Last Updated:{" "}
                          {stockData.timestamp ||
                            new Date().toLocaleTimeString()}
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

                  <Box p={6}>
                    <VStack spacing={6}>
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

                      <HStack w="100%" spacing={4}>
                        <Button
                          colorScheme="blue"
                          onClick={() => handleTrade("buy")}
                          isDisabled={
                            !stockData || !isMarketOpen() || isTrading
                          }
                          flex="1"
                        >
                          {isTrading ? "Buying..." : "Buy"}
                        </Button>
                        <Button
                          colorScheme="blue"
                          variant="outline"
                          onClick={handleMaxBuy}
                          isDisabled={
                            !stockData || !isMarketOpen() || isTrading
                          }
                          flex="1"
                        >
                          Max Buy
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

          <Box
            flex={1.4}
            bg={cardBgColor}
            borderRadius="lg"
            boxShadow={cardShadow}
            height="fit-content"
            overflow="hidden"
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
              <Box
                bg={cardBgColor}
                p={6}
                borderRadius="xl"
                boxShadow={cardShadow}
                overflow="hidden"
              >
                <Box overflowX="auto">
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
                                  handleSell(
                                    stock,
                                    sellQuantities[stock.id] || 1
                                  )
                                }
                                isDisabled={!isMarketOpen() || isTrading}
                              >
                                {isTrading ? "Selling..." : "Sell"}
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </Box>
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
