import axios from "axios";

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
    return false;
  }

  return true;
};

const getCachedPrice = (stockSymbol) => {
  const cached = priceCache.get(stockSymbol);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.data;
  }
  return null;
};

export const fetchStockPrice = async (stockSymbol, forceRefresh = false) => {
  try {
    if (!stockSymbol || !stockSymbol.match(/^[A-Za-z]+$/)) {
      throw new Error("Invalid symbol format. Use letters only.");
    }

    if (!forceRefresh) {
      const cachedData = getCachedPrice(stockSymbol);
      if (cachedData && checkRateLimit()) {
        return cachedData;
      }
    }

    if (!checkRateLimit()) {
      const cached = getCachedPrice(stockSymbol);
      if (cached) {
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
    throw error;
  }
};

export const fetchStockPrices = async (symbols, forceRefresh = false) => {
  const uniqueSymbols = [...new Set(symbols)];
  const priceMap = {};

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
        } catch (error) {}
      })
    );
  }

  return priceMap;
};
