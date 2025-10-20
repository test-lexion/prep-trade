# TradeFi - Advanced Perpetual Futures Trading Platform

TradeFi is a feature-rich, professional trading platform designed for perpetual futures, spot, and options. It integrates advanced DeFi features, AI-powered analytics, and social copy trading to provide a comprehensive trading experience.

## ✨ Key Features

*   📈 **Multiple Trading Products**: Trade perpetual futures, spot, and options with leverage up to 50x.
*   💰 **DeFi Yield Generation**: Earn passive income by providing liquidity to platform pools.
*   📋 **Comprehensive Portfolio Management**: Track asset balances, manage collateral, and monitor unrealized PnL in a dedicated portfolio dashboard.
*   🤖 **AI Hub**: Leverage AI-driven market analysis, trading signals, and a no-code strategy builder to automate your trades.
*   🏆 **Social & Copy Trading**: Climb the leaderboard or follow and automatically copy the strategies of top-performing traders.
*   🗳️ **Decentralized Governance**: Participate in the protocol's future by voting on proposals with your governance tokens.
*   🎁 **Rewards & Loyalty Program**: Complete daily quests, earn XP, and level up your rank to unlock exclusive rewards and fee discounts.
*   📊 **Real-time Platform Statistics**: Monitor key platform metrics like trading volume, Total Value Locked (TVL), and open interest.

## 🛠️ Technology Stack

*   **Framework**: [React](https://reactjs.org/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
*   **Routing**: [React Router DOM](https://reactrouter.com/)
*   **State Management/Data Fetching**: [Tanstack Query](https://tanstack.com/query/)
*   **Web3 Integration**: [wagmi](https://wagmi.sh/) & [viem](https://viem.sh/)
*   **Charting**: [Recharts](https://recharts.org/)
*   **Linting**: [ESLint](https://eslint.org/)

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or a compatible package manager

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/test-lexion-trident-trade-suite.git
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd test-lexion-trident-trade-suite
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```

### Running the Application

To start the development server, run the following command. The application will be available at `http://localhost:8080`.

```sh
npm run dev
```

## 📜 Available Scripts

In the project directory, you can run:

*   `npm run dev`: Runs the app in development mode.
*   `npm run build`: Builds the app for production to the `dist` folder.
*   `npm run lint`: Lints the project files using ESLint.
*   `npm run preview`: Serves the production build locally for previewing.

## 📂 Project Structure

The project is organized with a clear separation of concerns to ensure scalability and maintainability.

```
test-lexion-trident-trade-suite/
├── public/              # Static assets and robots.txt
├── src/
│   ├── components/      # Reusable components
│   │   ├── trading/     # Feature-specific trading components
│   │   └── ui/          # Base UI components from shadcn/ui
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Top-level page components
│   ├── App.tsx          # Main app component with routing
│   └── main.tsx         # Application entry point
├── package.json         # Project dependencies and scripts
└── vite.config.ts       # Vite configuration
```
