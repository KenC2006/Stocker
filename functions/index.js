const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const db = admin.firestore();

const FINNHUB_API_KEY = functions.config().finnhub.key;
const FINNHUB_URL = "https://finnhub.io/api/v1/quote";
const API_LIMIT_PER_MIN = 60;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.updateLeaderboardDaily = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("America/Toronto")
  .onRun(async (context) => {
    console.log(
      "Starting daily leaderboard update at:",
      new Date().toISOString()
    );

    try {
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`Processing ${users.length} users`);

      let apiCalls = 0;
      let minuteStart = Date.now();
      let successfulUpdates = 0;
      let failedUpdates = 0;
      let totalApiErrors = 0;

      for (const user of users) {
        try {
          const stocksSnapshot = await db
            .collection("stocks")
            .where("userId", "==", user.id)
            .get();
          const stocks = stocksSnapshot.docs.map((doc) => doc.data());

          console.log(
            `Processing user ${user.id} with ${stocks.length} stocks`
          );

          let portfolioValue = 0;
          let initialValue = 0;
          let stockErrors = 0;

          for (const stock of stocks) {
            if (apiCalls >= API_LIMIT_PER_MIN) {
              const elapsed = Date.now() - minuteStart;
              if (elapsed < 60000) {
                const wait = 60000 - elapsed;
                console.log(`Rate limit reached, waiting ${wait}ms`);
                await sleep(wait);
              }
              apiCalls = 0;
              minuteStart = Date.now();
            }

            try {
              const response = await axios.get(FINNHUB_URL, {
                params: {
                  symbol: stock.symbol,
                  token: FINNHUB_API_KEY,
                },
                timeout: 10000,
              });
              apiCalls++;

              const price = response.data.c;
              if (price && stock.quantity) {
                portfolioValue += price * stock.quantity;
                initialValue += stock.purchasePrice * stock.quantity;
              } else {
                console.warn(
                  `Invalid price data for ${stock.symbol}:`,
                  response.data
                );
              }
            } catch (apiError) {
              stockErrors++;
              totalApiErrors++;
              console.error(`API error for ${stock.symbol}:`, {
                error: apiError.message,
                status: apiError.response?.status,
                data: apiError.response?.data,
                userId: user.id,
                stock: stock.symbol,
              });
            }
          }

          if (stockErrors > 0) {
            console.warn(`User ${user.id} had ${stockErrors} stock API errors`);
          }

          const cash = user.balance || 0;
          const totalValue = portfolioValue + cash;
          const initialInvestment = 30000;
          const gainLoss = totalValue - initialInvestment;
          const gainLossPercent =
            initialInvestment > 0 ? (gainLoss / initialInvestment) * 100 : 0;

          try {
            await db.collection("users").doc(user.id).update({
              portfolioValue,
              totalValue,
              gainLoss,
              gainLossPercent,
              lastLeaderboardUpdate:
                admin.firestore.FieldValue.serverTimestamp(),
            });
            successfulUpdates++;
            console.log(`Successfully updated user ${user.id}:`, {
              portfolioValue,
              totalValue,
              gainLoss,
              gainLossPercent,
            });
          } catch (dbError) {
            failedUpdates++;
            console.error(`Database update error for user ${user.id}:`, {
              error: dbError.message,
              code: dbError.code,
              userId: user.id,
            });
          }
        } catch (userError) {
          failedUpdates++;
          console.error(`Error processing user ${user.id}:`, {
            error: userError.message,
            userId: user.id,
          });
        }
      }

      console.log("Daily leaderboard update completed:", {
        totalUsers: users.length,
        successfulUpdates,
        failedUpdates,
        totalApiErrors,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Critical error in daily leaderboard update:", {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      throw error; // Re-throw to mark function as failed
    }
  });
