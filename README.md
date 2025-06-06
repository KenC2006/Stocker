# Stocker

Stocker is a full-stack stock trading simulation web application designed for students. It allows users to search for stocks, simulate buying and selling, manage a virtual portfolio, and compete on a live leaderboard. The app features real-time price updates, a scheduled leaderboard reset, and a modern, responsive UI built with React and Chakra UI.

## Features

- **Stock Search & Trading:** Search for real stocks, view live prices, and simulate buying or selling shares.
- **Portfolio Management:** Track your holdings, see real-time profit/loss, and manage your virtual cash balance.
- **Live Price Updates:** Stock prices in your portfolio and trade screens update automatically every minute.
- **Leaderboard:** Compete with other users. The leaderboard is updated daily at 2:00am Toronto time by a scheduled backend job.
- **Authentication:** Secure sign-up and login for students.
- **Firebase Backend:** Uses Firestore for user data, trades, and scheduled leaderboard updates.
- **Modern UI:** Built with React and Chakra UI for a clean, responsive experience.

## Tech Stack

- **Frontend:** React, Chakra UI
- **Backend:** Firebase (Firestore, Auth, Cloud Functions)
- **APIs:** Finnhub for real-time stock prices
- **Scheduling:** Firebase Cloud Functions (Pub/Sub)

## Setup Instructions

1. **Clone the repository:**

   ```sh
   git clone https://github.com/YourUsername/Stocker.git
   cd Stocker
   ```

2. **Install dependencies:**

   ```sh
   npm install
   # or
   yarn install
   ```

3. **Configure Firebase:**

   - Create a Firebase project.
   - Add your Firebase config to `src/config/firebase.js`.
   - Set up Firestore and Authentication in the Firebase console.
   - Deploy the provided Cloud Functions for scheduled leaderboard updates.

4. **Run the app locally:**

   ```sh
   npm start
   # or
   yarn start
   ```

5. **Deploy (optional):**
   - Deploy frontend to Vercel, Netlify, or Firebase Hosting.
   - Deploy backend functions to Firebase Cloud Functions.

## Usage

- **Trade stocks:** Use the Trading tab to search for stocks and simulate trades. Prices update every minute.
- **View your portfolio:** See your holdings, real-time values, and profit/loss.
- **Leaderboard:** Check your rank and see when the next reset will occur (2:00am Toronto time).

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](LICENSE)

---

**Note:** This project is for educational and simulation purposes only. No real money or real trades are involved.
