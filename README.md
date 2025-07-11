# Stocker

Stocker is a full-stack stock trading simulation web application designed for students. It allows users to search for stocks, simulate buying and selling, manage a virtual portfolio, and compete on a live leaderboard. The app features real-time price updates, a scheduled leaderboard reset, and a UI built with React and Chakra UI.

## Features

- **Stock Search & Trading:** Search for real stocks, view live prices, and simulate buying or selling shares.
- **Portfolio Management:** Track your holdings, see real-time profit/loss, and manage your virtual cash balance.
- **Live Price Updates:** Stock prices in your portfolio and trade screens update automatically every minute.
- **Leaderboard:** Compete with other users. The leaderboard is updated daily at 2:00am Toronto time by a scheduled backend job.
- **Authentication:** Secure sign-up and login for UofT students.
- **Firebase Backend:** Uses Firestore for user data, trades, and scheduled leaderboard updates.
- **Modern UI:** Built with React and Chakra UI

## Tech Stack

- **Frontend:** React, Chakra UI
- **Backend:** Firebase (Firestore, Auth, Cloud Functions)
- **APIs:** Finnhub for real-time (and free) stock prices
- **Scheduling:** Firebase Cloud Functions (Pub/Sub)

## Usage

- **Trade stocks:** Use the Trading tab to search for stocks and simulate trades. Prices update every minute.
- **View your portfolio:** See your holdings, real-time values, and profit/loss.
- **Leaderboard:** Check your rank and see when the next reset will occur (2:00am Toronto time).

## Link

http://stockerstorage.web.app/
