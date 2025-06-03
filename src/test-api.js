const axios = require("axios");

async function testYahooFinanceAPI(symbol = "AAPL") {
  try {
    console.log(`\nTesting symbol: ${symbol}`);
    console.log("----------------------------------------");

    // Test different API endpoints
    const endpoints = [
      {
        name: "Chart API",
        url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      },
      {
        name: "Quote API",
        url: `https://query1.finance.yahoo.com/v6/finance/quote?symbols=${symbol}`,
      },
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`\nTrying ${endpoint.name}...`);
        console.log(`URL: ${endpoint.url}`);

        const response = await axios.get(endpoint.url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "application/json",
            Origin: "https://finance.yahoo.com",
          },
          timeout: 10000,
        });

        console.log("Status:", response.status);
        console.log("Headers:", JSON.stringify(response.headers, null, 2));

        if (endpoint.name === "Chart API") {
          const result = response.data.chart.result[0];
          const quote = result.meta;
          console.log("\nStock Data:");
          console.log("Symbol:", quote.symbol);
          console.log("Price:", quote.regularMarketPrice);
          console.log("Previous Close:", quote.chartPreviousClose);
          console.log("Currency:", quote.currency);
          console.log("Exchange:", quote.exchangeName);
        } else {
          const quote = response.data.quoteResponse.result[0];
          console.log("\nStock Data:");
          console.log("Symbol:", quote.symbol);
          console.log("Price:", quote.regularMarketPrice);
          console.log("Previous Close:", quote.regularMarketPreviousClose);
          console.log("Currency:", quote.currency);
          console.log("Exchange:", quote.fullExchangeName);
        }
      } catch (error) {
        console.error(`\nError with ${endpoint.name}:`);
        console.error("Error Type:", error.name);
        console.error("Error Message:", error.message);
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error(
            "Response Data:",
            JSON.stringify(error.response.data, null, 2)
          );
        } else if (error.request) {
          console.error("No response received");
          console.error("Request details:", {
            method: error.request.method,
            path: error.request.path,
            host: error.request.host,
          });
        }
      }
    }
  } catch (error) {
    console.error("\nGeneral Error:");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
  }
}

// Test with AAPL
testYahooFinanceAPI();
