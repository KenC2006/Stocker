const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const db = admin.firestore();

const FINNHUB_API_KEY = "d0vg651r01qkepd02btgd0vg651r01qkepd02bu0"; // <-- Replace with your real key
const FINNHUB_URL = "https://finnhub.io/api/v1/quote";
const API_LIMIT_PER_MIN = 60;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.updateLeaderboardDaily = functions.pubsub
  .schedule("0 2 * * *") // 2am UTC
  .timeZone("America/Toronto")
  .onRun(async (context) => {
    console.log("Starting leaderboard update...");

    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    let apiCalls = 0;
    let minuteStart = Date.now();

    for (const user of users) {
      // Get all stocks for this user
      const stocksSnapshot = await db
        .collection("stocks")
        .where("userId", "==", user.id)
        .get();
      const stocks = stocksSnapshot.docs.map((doc) => doc.data());

      let portfolioValue = 0;
      let initialValue = 0;
      for (const stock of stocks) {
        // Rate limit logic
        if (apiCalls >= API_LIMIT_PER_MIN) {
          const elapsed = Date.now() - minuteStart;
          if (elapsed < 60000) {
            const wait = 60000 - elapsed;
            console.log(`API limit reached, waiting ${wait}ms...`);
            await sleep(wait);
          }
          apiCalls = 0;
          minuteStart = Date.now();
        }

        // Fetch latest price
        try {
          const response = await axios.get(FINNHUB_URL, {
            params: {
              symbol: stock.symbol,
              token: FINNHUB_API_KEY,
            },
          });
          apiCalls++;

          const price = response.data.c;
          if (price && stock.quantity) {
            portfolioValue += price * stock.quantity;
            initialValue += stock.purchasePrice * stock.quantity;
          }
        } catch (err) {
          console.error(
            `Error fetching price for ${stock.symbol}:`,
            err.message
          );
        }
      }

      // Add cash balance
      const cash = user.balance || 0;
      const totalValue = portfolioValue + cash;
      const initialInvestment = 30000;
      const gainLoss = totalValue - initialInvestment;
      const gainLossPercent = (gainLoss / initialInvestment) * 100;

      // Update user document with new values
      try {
        await db.collection("users").doc(user.id).update({
          portfolioValue,
          totalValue,
          gainLoss,
          gainLossPercent,
          initialInvestment,
          lastLeaderboardUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(
          `Updated user ${
            user.id
          } with portfolioValue $${portfolioValue.toFixed(
            2
          )}, totalValue $${totalValue.toFixed(
            2
          )}, gain/loss $${gainLoss.toFixed(2)} (${gainLossPercent.toFixed(
            2
          )}%)`
        );
      } catch (err) {
        console.error(`Error updating user ${user.id}:`, err.message);
      }
    }

    console.log("Leaderboard update complete.");
    return null;
  });
