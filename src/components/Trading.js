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
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
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
} from "firebase/firestore";

// Cache for storing stock prices
const priceCache = new Map();
// Track API calls
let apiCallsCount = 0;
let lastResetTime = Date.now();
const API_CALL_LIMIT = 5;
const CACHE_DURATION = 60000; // 1 minute cache

function Trading() {
  const [symbol, setSymbol] = useState("");
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [portfolio, setPortfolio] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [apiCallsRemaining, setApiCallsRemaining] = useState(API_CALL_LIMIT);
  const [cooldownTime, setCooldownTime] = useState(0);
  const { currentUser } = useAuth();
  const toast = useToast();
  const [userData, setUserData] = useState(null);
  const [sellQuantities, setSellQuantities] = useState({});

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    fetchPortfolio();
    // Reset cooldown timer
    const timer = setInterval(() => {
      const now = Date.now();
      if (now - lastResetTime >= 60000) {
        apiCallsCount = 0;
        lastResetTime = now;
        setApiCallsRemaining(API_CALL_LIMIT);
        setCooldownTime(0);
      } else if (apiCallsCount >= API_CALL_LIMIT) {
        setCooldownTime(60 - Math.floor((now - lastResetTime) / 1000));
      }
    }, 1000);

    const fetchUserData = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();

    return () => clearInterval(timer);
  }, [currentUser]);

  const checkRateLimit = () => {
    const now = Date.now();
    if (now - lastResetTime >= 60000) {
      apiCallsCount = 0;
      lastResetTime = now;
      setApiCallsRemaining(API_CALL_LIMIT);
      return true;
    }

    if (apiCallsCount >= API_CALL_LIMIT) {
      toast({
        title: "Rate Limit Reached",
        description: "Please wait a minute before making more requests.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const getCachedPrice = (stockSymbol) => {
    const cached = priceCache.get(stockSymbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  };

  const fetchPortfolio = async () => {
    try {
      const q = query(
        collection(db, "stocks"),
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const stocksRaw = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Deduplicate symbols
      const uniqueSymbols = [
        ...new Set(stocksRaw.map((stock) => stock.symbol)),
      ];
      // Fetch prices for unique symbols only
      const priceMap = {};
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          priceMap[symbol] = await fetchStockPrice(symbol);
        })
      );
      // Build stocks with price data
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
        } else {
          return {
            ...stock,
            currentPrice: 0,
            totalValue: 0,
            profitLoss: 0,
            profitLossPercentage: 0,
          };
        }
      });
      setPortfolio(stocks);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      toast({
        title: "Error",
        description: "Failed to fetch portfolio",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingPortfolio(false);
    }
  };

  const validateSymbol = (symbol) => {
    if (!symbol || typeof symbol !== "string") {
      throw new Error("Please enter a stock symbol");
    }

    const trimmedSymbol = symbol.trim().toUpperCase();
    if (!trimmedSymbol) {
      throw new Error("Please enter a stock symbol");
    }

    if (!trimmedSymbol.match(/^[A-Z]+$/)) {
      throw new Error(
        "Invalid symbol format. Please use only letters (e.g., AAPL, MSFT, GOOGL)"
      );
    }

    return trimmedSymbol;
  };

  const fetchStockPrice = async (stockSymbol) => {
    try {
      if (!stockSymbol || !stockSymbol.match(/^[A-Za-z]+$/)) {
        throw new Error("Invalid symbol format. Use letters only.");
      }

      const cachedData = getCachedPrice(stockSymbol);
      if (cachedData) return cachedData;

      const response = await axios.get("https://finnhub.io/api/v1/quote", {
        params: {
          symbol: stockSymbol,
          token: "d0vg651r01qkepd02btgd0vg651r01qkepd02bu0",
        },
      });

      const data = response.data;
      if (!data || data.c === 0) {
        throw new Error(`Symbol '${stockSymbol}' not found.`);
      }

      const stockData = {
        symbol: stockSymbol,
        price: data.c,
        previousClose: data.pc,
        change: data.c - data.pc,
        changePercent: ((data.c - data.pc) / data.pc) * 100,
        currency: "USD",
        exchange: "Finnhub",
        timestamp: new Date().toLocaleString(),
      };

      priceCache.set(stockSymbol, {
        data: stockData,
        timestamp: Date.now(),
      });

      return stockData;
    } catch (error) {
      console.error("Finnhub API error:", error.message);
      throw new Error("Unable to fetch stock data from Finnhub.");
    }
  };

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

      // Clear any previous error messages
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

  // Helper to refresh user data
  const refreshUserData = async () => {
    if (!currentUser) return;
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  // Update isMarketOpen to only restrict trading on weekends
  function isMarketOpen() {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Only restrict trading on weekends
    if (utcDay === 0 || utcDay === 6) return false; // Weekend
    return true; // Allow trading at all hours on weekdays
  }

  const marketOpen = isMarketOpen();

  const handleTrade = async (type) => {
    if (!marketOpen) {
      toast({
        title: "Market Closed",
        description: "Trading is only allowed Monday through Friday.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    if (!stockData || !quantity) return;
    if (!userData) return;
    const totalCost = stockData.price * quantity;
    if (type === "buy") {
      if (userData.balance < totalCost) {
        toast({
          title: "Insufficient Balance",
          description: `You do not have enough cash to complete this purchase. Required: $${totalCost.toFixed(
            2
          )}, Available: $${userData.balance.toFixed(2)}`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }
    try {
      let newPortfolio = [...portfolio];
      let newBalance = userData.balance;
      if (type === "buy") {
        // Always create a new stock document, even if the user already owns this stock
        const tradeData = {
          userId: currentUser.uid,
          symbol: stockData.symbol,
          quantity: Number(quantity),
          purchasePrice: stockData.price,
          tradeType: type,
          timestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, "stocks"), tradeData);
        // Optimistically update local state
        newPortfolio.push({
          id: `temp-${Date.now()}`,
          ...tradeData,
          currentPrice: stockData.price,
          totalValue: stockData.price * Number(quantity),
          profitLoss: 0,
          profitLossPercentage: 0,
        });
        newBalance -= totalCost;
      } else if (type === "sell") {
        // ... existing sell logic ...
      }
      await updateDoc(doc(db, "users", currentUser.uid), {
        balance: newBalance,
      });
      setUserData({ ...userData, balance: newBalance });
      setPortfolio(newPortfolio);
      toast({
        title: "Success",
        description: `Successfully ${
          type === "buy" ? "bought" : "sold"
        } ${quantity} shares of ${stockData.symbol}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      // Optionally, you can refetch from Firebase for consistency, but not always necessary
      // fetchPortfolio();
      // await refreshUserData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${type} stock`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSell = async (stock, sellQuantity) => {
    if (sellQuantity < 1 || sellQuantity > stock.quantity) {
      toast({
        title: "Invalid Quantity",
        description: `You can only sell between 1 and ${stock.quantity} shares.`,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    try {
      const proceeds = stock.currentPrice * sellQuantity;
      if (sellQuantity === stock.quantity) {
        // Sell all: delete the stock document
        await deleteDoc(doc(db, "stocks", stock.id));
      } else {
        // Sell part: update the stock document
        await updateDoc(doc(db, "stocks", stock.id), {
          quantity: stock.quantity - sellQuantity,
        });
      }
      // Optimistically update local state
      let newPortfolio = portfolio
        .map((s) => {
          if (s.id === stock.id) {
            if (sellQuantity === stock.quantity) {
              return null; // Remove stock
            } else {
              return { ...s, quantity: s.quantity - sellQuantity };
            }
          }
          return s;
        })
        .filter(Boolean);
      const newBalance = (userData?.balance || 0) + proceeds;
      await updateDoc(doc(db, "users", currentUser.uid), {
        balance: newBalance,
      });
      setUserData({ ...userData, balance: newBalance });
      setPortfolio(newPortfolio);
      toast({
        title: "Success",
        description: `Successfully sold ${sellQuantity} shares of ${stock.symbol}`,
        status: "success",
        duration: 4000,
        isClosable: true,
      });
      // Optionally, you can refetch from Firebase for consistency, but not always necessary
      // fetchPortfolio();
      // await refreshUserData();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to sell stock: ${error.message}`,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      console.error("Sell error:", error);
    }
  };

  // Periodically refresh prices for all stocks in the portfolio every minute
  useEffect(() => {
    if (!portfolio || portfolio.length === 0) return;
    let isMounted = true;
    const refreshPortfolioPrices = async () => {
      // Deduplicate symbols
      const uniqueSymbols = [
        ...new Set(portfolio.map((stock) => stock.symbol)),
      ];
      const priceMap = {};
      await Promise.all(
        uniqueSymbols.map(async (symbol) => {
          priceMap[symbol] = await fetchStockPrice(symbol);
        })
      );
      if (!isMounted) return;
      setPortfolio((prev) =>
        prev.map((stock) => {
          const priceData = priceMap[stock.symbol];
          if (priceData) {
            return {
              ...stock,
              currentPrice: priceData.price,
              totalValue: priceData.price * stock.quantity,
              profitLoss:
                (priceData.price - stock.purchasePrice) * stock.quantity,
              profitLossPercentage:
                ((priceData.price - stock.purchasePrice) /
                  stock.purchasePrice) *
                100,
            };
          } else {
            return stock;
          }
        })
      );
    };
    const interval = setInterval(refreshPortfolioPrices, 60000);
    // Initial refresh
    refreshPortfolioPrices();
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [portfolio.length]);

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading
          color="uoft.navy"
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="extrabold"
        >
          Stock Trading
        </Heading>

        {/* Show user balance */}
        <Box w="100%" textAlign="right">
          <Stat>
            <StatLabel color="gray.600">Cash Balance</StatLabel>
            <StatNumber color="uoft.navy">
              {userData ? (
                `$${userData.balance?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              ) : (
                <Skeleton height="20px" />
              )}
            </StatNumber>
          </Stat>
        </Box>

        {apiCallsRemaining < API_CALL_LIMIT && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <VStack align="start" spacing={2} flex="1">
              <Text>
                API Calls Remaining: {apiCallsRemaining} of {API_CALL_LIMIT}
              </Text>
              {cooldownTime > 0 && (
                <>
                  <Text>Resets in: {cooldownTime} seconds</Text>
                  <Progress
                    value={(60 - cooldownTime) * (100 / 60)}
                    size="sm"
                    width="100%"
                    colorScheme="uoft"
                  />
                </>
              )}
            </VStack>
          </Alert>
        )}

        <Tabs width="100%" colorScheme="uoft">
          <TabList>
            <Tab _selected={{ color: "uoft.navy", borderColor: "uoft.navy" }}>
              Trade
            </Tab>
            <Tab _selected={{ color: "uoft.navy", borderColor: "uoft.navy" }}>
              Portfolio
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={6}>
                <InputGroup size="lg">
                  <Input
                    placeholder="Enter stock symbol (e.g., AAPL)"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        searchStock();
                      }
                    }}
                    _focus={{
                      borderColor: "uoft.navy",
                      boxShadow: "0 0 0 1px uoft.navy",
                    }}
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      onClick={searchStock}
                      isLoading={loading}
                    >
                      <SearchIcon />
                    </Button>
                  </InputRightElement>
                </InputGroup>

                {stockData && (
                  <Box
                    p={8}
                    borderRadius="2xl"
                    boxShadow="2xl"
                    bgGradient="linear(to-br, white, blue.50)"
                    border="2px solid"
                    borderColor="uoft.navy"
                    width="100%"
                    _hover={{
                      borderColor: "blue.400",
                      boxShadow: "3xl",
                    }}
                  >
                    <VStack spacing={6} align="stretch">
                      <Stat textAlign="center">
                        <StatLabel fontSize="2xl" color="gray.600">
                          {stockData.symbol}
                        </StatLabel>
                        <StatNumber fontSize="4xl" color="uoft.navy">
                          ${stockData.price.toFixed(2)}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow
                            type={
                              stockData.change > 0 ? "increase" : "decrease"
                            }
                          />
                          {Math.abs(stockData.changePercent).toFixed(2)}%
                        </StatHelpText>
                      </Stat>
                      <NumberInput
                        value={quantity}
                        min={1}
                        onChange={(value) => setQuantity(Number(value))}
                        size="lg"
                        width="50%"
                        mx="auto"
                      >
                        <NumberInputField
                          _focus={{
                            borderColor: "uoft.navy",
                            boxShadow: "0 0 0 1px uoft.navy",
                          }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text
                        fontSize="xl"
                        fontWeight="bold"
                        color="uoft.navy"
                        textAlign="center"
                      >
                        Total: ${(stockData.price * quantity).toFixed(2)}
                      </Text>
                      <Button
                        width="100%"
                        size="lg"
                        colorScheme="blue"
                        onClick={() => handleTrade("buy")}
                        _hover={{
                          bg: "uoft.lightBlue",
                          boxShadow: "xl",
                        }}
                        fontWeight="extrabold"
                        borderRadius="full"
                        isDisabled={!marketOpen}
                      >
                        Buy
                      </Button>
                      {!marketOpen && (
                        <Text
                          color="red.500"
                          fontWeight="bold"
                          textAlign="center"
                        >
                          Market is closed on weekends. Trading is allowed
                          Monday through Friday.
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <Box
                p={6}
                borderRadius="lg"
                boxShadow="xl"
                bg={bgColor}
                border="1px"
                borderColor={borderColor}
                _hover={{
                  borderColor: "uoft.navy",
                }}
              >
                <Table variant="striped" colorScheme="blue">
                  <Thead>
                    <Tr>
                      <Th color="uoft.navy">Symbol</Th>
                      <Th isNumeric color="uoft.navy">
                        Quantity
                      </Th>
                      <Th isNumeric color="uoft.navy">
                        Purchase Price
                      </Th>
                      <Th isNumeric color="uoft.navy">
                        Current Price
                      </Th>
                      <Th isNumeric color="uoft.navy">
                        Total Value
                      </Th>
                      <Th isNumeric color="uoft.navy">
                        P/L
                      </Th>
                      <Th></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {loadingPortfolio ? (
                      <Tr>
                        <Td colSpan={7}>
                          <Skeleton height="20px" />
                        </Td>
                      </Tr>
                    ) : (
                      portfolio.map((stock) => (
                        <Tr key={stock.id}>
                          <Td fontWeight="bold">{stock.symbol}</Td>
                          <Td isNumeric>{stock.quantity}</Td>
                          <Td isNumeric>${stock.purchasePrice.toFixed(2)}</Td>
                          <Td isNumeric>${stock.currentPrice.toFixed(2)}</Td>
                          <Td isNumeric>${stock.totalValue.toFixed(2)}</Td>
                          <Td isNumeric>
                            <Badge
                              colorScheme={
                                stock.profitLoss >= 0 ? "green" : "red"
                              }
                            >
                              {stock.profitLoss >= 0 ? "+" : "-"}$
                              {Math.abs(stock.profitLoss).toFixed(2)}
                            </Badge>
                          </Td>
                          <Td>
                            <NumberInput
                              size="sm"
                              min={1}
                              max={stock.quantity}
                              value={
                                stock.quantity === 1
                                  ? 1
                                  : sellQuantities[stock.id] &&
                                    sellQuantities[stock.id] >= 1
                                  ? sellQuantities[stock.id]
                                  : 1
                              }
                              onChange={(valueString, valueNumber) => {
                                let value = Number(valueString);
                                if (isNaN(value) || value < 1) value = 1;
                                if (value > stock.quantity)
                                  value = stock.quantity;
                                setSellQuantities((prev) => ({
                                  ...prev,
                                  [stock.id]: value,
                                }));
                              }}
                              clampValueOnBlur={true}
                              width="80px"
                              readOnly={stock.quantity === 1}
                            >
                              <NumberInputField />
                              <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                              </NumberInputStepper>
                            </NumberInput>
                            <Button
                              size="sm"
                              ml={2}
                              onClick={() =>
                                handleSell(
                                  stock,
                                  stock.quantity === 1
                                    ? 1
                                    : sellQuantities[stock.id] || 1
                                )
                              }
                              variant="outline"
                              _hover={{
                                bg: "red.500",
                                color: "white",
                                borderColor: "red.500",
                              }}
                            >
                              Sell
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </Table>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

export default Trading;
