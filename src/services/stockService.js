import axios from "axios";

// Global cache and rate limiting
const priceCache = new Map();
let apiCallsCount = 0;
let lastResetTime = Date.now();
const API_CALL_LIMIT = 60;
const FINNHUB_API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

const checkRateLimit = () => {
  const now = Date.now();
  if (now - lastResetTime >= 60000) {
    apiCallsCount = 0;
    lastResetTime = now;
    return true;
  }

  if (apiCallsCount >= API_CALL_LIMIT) {
    console.warn("Rate limit reached, using cached data");
    return false;
  }

  return true;
};

const getCachedPrice = (stockSymbol) => {
  const cached = priceCache.get(stockSymbol);
  return cached ? cached.data : null;
};

export const fetchStockPrice = async (stockSymbol, forceRefresh = false) => {
  try {
    if (!stockSymbol || !stockSymbol.match(/^[A-Za-z]+$/)) {
      throw new Error("Invalid symbol format. Use letters only.");
    }

    // Only use cache if not forcing refresh and rate limit allows
    if (!forceRefresh) {
      const cachedData = getCachedPrice(stockSymbol);
      if (cachedData && checkRateLimit()) {
        console.log(`Using cached price for ${stockSymbol}`);
        return cachedData;
      }
    }

    if (!checkRateLimit()) {
      const cached = getCachedPrice(stockSymbol);
      if (cached) {
        console.log(`Using cached price for ${stockSymbol} due to rate limit`);
        return cached;
      }
      throw new Error("Rate limit reached. Please try again later.");
    }

    apiCallsCount++;

    const response = await axios.get("https://finnhub.io/api/v1/quote", {
      params: {
        symbol: stockSymbol,
        token: FINNHUB_API_KEY,
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
    throw error;
  }
};

export const fetchStockPrices = async (symbols, forceRefresh = false) => {
  const uniqueSymbols = [...new Set(symbols)];
  const priceMap = {};

  // If not forcing refresh, check cache first
  if (!forceRefresh) {
    uniqueSymbols.forEach((symbol) => {
      const cached = getCachedPrice(symbol);
      if (cached) {
        priceMap[symbol] = cached;
      }
    });
  }

  const uncachedSymbols = uniqueSymbols.filter((symbol) => !priceMap[symbol]);
  const batchSize = 10;

  for (let i = 0; i < uncachedSymbols.length; i += batchSize) {
    const batch = uncachedSymbols.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (symbol) => {
        try {
          const price = await fetchStockPrice(symbol, forceRefresh);
          if (price) {
            priceMap[symbol] = price;
          }
        } catch (error) {
          console.error(`Error fetching price for ${symbol}:`, error);
        }
      })
    );
  }

  return priceMap;
};
