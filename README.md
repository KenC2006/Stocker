# UofT Stock Leaderboard

A competitive stock trading platform for University of Toronto students. Track your portfolio performance and compete with other students on the leaderboard.

## Features

- User authentication with email/password
- Real-time stock data from Yahoo Finance
- Personal stock portfolio tracking
- Live leaderboard with performance metrics
- Modern, responsive UI with Chakra UI

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd uoft-stock-leaderboard
```

2. Install dependencies:

```bash
npm install
```

3. Create a Firebase project and update the configuration in `src/config/firebase.js`

4. Enable Email/Password authentication in Firebase Console

5. Create a Firestore database in Firebase Console

6. Start the development server:

```bash
npm start
```

## Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Usage

1. Register/Login with your UofT email address
2. Add stocks to your portfolio using their ticker symbols
3. Track your portfolio performance
4. View the leaderboard to see how you rank against other traders

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
