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
    const usersSnapshot = await db.collection("users").get();
    const users = usersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((user) => user.emailVerified === true);

    let apiCalls = 0;
    let minuteStart = Date.now();

    for (const user of users) {
      const stocksSnapshot = await db
        .collection("stocks")
        .where("userId", "==", user.id)
        .get();
      const stocks = stocksSnapshot.docs.map((doc) => doc.data());

      let portfolioValue = 0;
      let initialValue = 0;
      for (const stock of stocks) {
        if (apiCalls >= API_LIMIT_PER_MIN) {
          const elapsed = Date.now() - minuteStart;
          if (elapsed < 60000) {
            const wait = 60000 - elapsed;
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
          });
          apiCalls++;

          const price = response.data.c;
          if (price && stock.quantity) {
            portfolioValue += price * stock.quantity;
            initialValue += stock.purchasePrice * stock.quantity;
          }
        } catch (err) {}
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
          lastLeaderboardUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {}
    }
  });
