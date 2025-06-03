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
  Skeleton,
  Alert,
  AlertIcon,
  Progress,
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
      const stocks = [];
      for (const doc of querySnapshot.docs) {
        const stock = { id: doc.id, ...doc.data() };
        // Get current price for each stock
        const priceData = await fetchStockPrice(stock.symbol);
        if (priceData) {
          stock.currentPrice = priceData.price;
          stock.totalValue = priceData.price * stock.quantity;
          stock.profitLoss =
            (priceData.price - stock.purchasePrice) * stock.quantity;
          stock.profitLossPercentage =
            ((priceData.price - stock.purchasePrice) / stock.purchasePrice) *
            100;
        } else {
          stock.currentPrice = 0;
          stock.totalValue = 0;
          stock.profitLoss = 0;
          stock.profitLossPercentage = 0;
        }
        stocks.push(stock);
      }
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
    console.log("fetchStockPrice called with:", {
      stockSymbol,
      type: typeof stockSymbol,
    });

    try {
      // Validate symbol format
      if (!stockSymbol || !stockSymbol.match(/^[A-Za-z]+$/)) {
        console.log("Symbol validation failed:", { stockSymbol });
        throw new Error(
          "Invalid symbol format. Please use only letters (e.g., AAPL, MSFT, GOOGL)"
        );
      }

      // Check cache first
      const cachedData = getCachedPrice(stockSymbol);
      if (cachedData) {
        console.log("Using cached data:", cachedData);
        return cachedData;
      }

      const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${stockSymbol}?interval=1d&range=1d`;
      console.log("Making API request to:", apiUrl);

      const response = await axios.get(apiUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
        },
      });

      console.log("API Response received:", {
        status: response.status,
        hasData: !!response.data,
        hasResult: !!response.data?.chart?.result?.[0],
      });

      if (!response.data?.chart?.result?.[0]) {
        throw new Error(
          `Stock symbol '${stockSymbol}' not found. Please verify it's correct.`
        );
      }

      const result = response.data.chart.result[0];
      const quote = result.meta;
      const timestamp = result.timestamp[result.timestamp.length - 1];

      console.log("Parsed quote data:", {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        previousClose: quote.chartPreviousClose,
      });

      if (!quote.regularMarketPrice || !quote.chartPreviousClose) {
        throw new Error("Missing required price data from API");
      }

      const stockData = {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        previousClose: quote.chartPreviousClose,
        change: quote.regularMarketPrice - quote.chartPreviousClose,
        changePercent:
          ((quote.regularMarketPrice - quote.chartPreviousClose) /
            quote.chartPreviousClose) *
          100,
        currency: quote.currency || "USD",
        exchange: quote.exchangeName || "Unknown",
        timestamp: new Date(timestamp * 1000).toLocaleString(),
      };

      console.log("Processed stock data:", stockData);

      // Cache the result
      priceCache.set(stockSymbol, {
        data: stockData,
        timestamp: Date.now(),
      });

      return stockData;
    } catch (error) {
      console.error("Stock API Error:", {
        symbol: stockSymbol,
        errorType: error.name,
        errorMessage: error.message,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });

      if (error.response?.status === 404) {
        throw new Error(
          `Stock symbol '${stockSymbol}' not found. Please verify it's correct.`
        );
      }

      throw new Error(
        error.message || "Unable to fetch stock data. Please try again."
      );
    }
  };

  const searchStock = async () => {
    console.log("searchStock called with symbol:", {
      symbol,
      type: typeof symbol,
    });

    if (!symbol) {
      console.log("No symbol provided");
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
      console.log("Processed symbol:", {
        original: symbol,
        processed: upperSymbol,
      });

      const stockData = await fetchStockPrice(upperSymbol);
      console.log("Received stock data:", stockData);

      setStockData({
        symbol: upperSymbol,
        ...stockData,
      });

      // Clear any previous error messages
      toast.closeAll();
    } catch (error) {
      console.error("Search error:", {
        originalSymbol: symbol,
        processedSymbol: symbol?.trim().toUpperCase(),
        error: error.message,
      });

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
    if (!stockData || !quantity) return;

    try {
      const tradeData = {
        userId: currentUser.uid,
        symbol: stockData.symbol,
        quantity: Number(quantity),
        purchasePrice: stockData.price,
        tradeType: type,
        timestamp: new Date().toISOString(),
      };

      await addDoc(collection(db, "stocks"), tradeData);
      toast({
        title: "Success",
        description: `Successfully ${
          type === "buy" ? "bought" : "sold"
        } ${quantity} shares of ${stockData.symbol}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      fetchPortfolio();
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

  const handleSell = async (stockId, symbol, currentPrice, quantity) => {
    try {
      await deleteDoc(doc(db, "stocks", stockId));
      await addDoc(collection(db, "stocks"), {
        userId: currentUser.uid,
        symbol,
        quantity: -quantity, // Negative quantity for selling
        purchasePrice: currentPrice,
        tradeType: "sell",
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: `Successfully sold ${quantity} shares of ${symbol}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      fetchPortfolio();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sell stock",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8}>
        <Heading
          bgGradient="linear(to-r, blue.400, purple.500)"
          bgClip="text"
          fontSize={{ base: "2xl", md: "4xl" }}
          fontWeight="extrabold"
        >
          Stock Trading
        </Heading>

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
                    colorScheme="blue"
                  />
                </>
              )}
            </VStack>
          </Alert>
        )}

        <Tabs width="100%" variant="enclosed">
          <TabList>
            <Tab>Trade</Tab>
            <Tab>Portfolio</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={6}>
                <Box width="100%">
                  <InputGroup size="lg">
                    <Input
                      placeholder="Enter stock symbol (e.g., AAPL)"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") searchStock();
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
                </Box>

                {stockData && (
                  <Box
                    p={6}
                    borderRadius="lg"
                    boxShadow="xl"
                    bg={bgColor}
                    border="1px"
                    borderColor={borderColor}
                    width="100%"
                  >
                    <VStack spacing={4}>
                      <Stat textAlign="center">
                        <StatLabel fontSize="xl">{stockData.symbol}</StatLabel>
                        <StatNumber fontSize="3xl">
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
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>

                      <Text fontSize="lg" fontWeight="bold">
                        Total: ${(stockData.price * quantity).toFixed(2)}
                      </Text>

                      <Button
                        colorScheme="green"
                        width="100%"
                        onClick={() => handleTrade("buy")}
                      >
                        Buy
                      </Button>
                    </VStack>
                  </Box>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <Box
                borderRadius="lg"
                boxShadow="xl"
                bg={bgColor}
                border="1px"
                borderColor={borderColor}
                overflow="hidden"
              >
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Symbol</Th>
                      <Th isNumeric>Quantity</Th>
                      <Th isNumeric>Purchase Price</Th>
                      <Th isNumeric>Current Price</Th>
                      <Th isNumeric>Total Value</Th>
                      <Th isNumeric>Profit/Loss</Th>
                      <Th>Action</Th>
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
                          <Td>{stock.symbol}</Td>
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
                              ${stock.profitLoss.toFixed(2)} (
                              {stock.profitLossPercentage.toFixed(2)}%)
                            </Badge>
                          </Td>
                          <Td>
                            <Button
                              colorScheme="red"
                              size="sm"
                              onClick={() =>
                                handleSell(
                                  stock.id,
                                  stock.symbol,
                                  stock.currentPrice,
                                  stock.quantity
                                )
                              }
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
