import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// --- 1. Import Wagmi and Reown Providers ---
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/wagmi'; // Your new config file
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// --- 2. Import Wallet Context and Error Boundary ---
import { WalletProvider } from '@/contexts/WalletContext';
import ErrorBoundary from '@/components/ErrorBoundary';

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Futures from "./pages/Futures";
import Spot from "./pages/Spot";
import Options from "./pages/Options";
import Earn from "./pages/Earn";
import Portfolio from "./pages/Portfolio";
import Leaderboard from "./pages/Leaderboard";
import AIHub from "./pages/AIHub";
import Stats from "./pages/Stats";
import Governance from "./pages/Governance";
import Rewards from "./pages/Rewards";
import NotFound from "./pages/NotFound";
import MiniAppSDK from "@farcaster/miniapp-sdk";
import { useEffect } from "react";

const queryClient = new QueryClient();
// You need to provide the correct config for WagmiAdapter, e.g.:
const adapter = new WagmiAdapter({
  networks: Array.from(wagmiConfig.chains), // make a mutable copy
  projectId: process.env.REACT_APP_PROJECT_ID || "", // replace with your actual projectId
  // Add other required fields if needed
});

const FarcasterProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    MiniAppSDK.actions.ready();
  }, []);

  return <>{children}</>;
}

const App = () => (
  // --- 2. Wrap the entire application with providers ---
  <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          <WalletProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <div className="flex h-screen flex-col bg-background">
                    <Header />
                    <main className="flex-1 overflow-y-auto">
                      <Routes>
                        <Route path="/" element={<Futures />} />
                        <Route path="/spot" element={<Spot />} />
                        <Route path="/options" element={<Options />} />
                        <Route path="/earn" element={<Earn />} />
                        <Route path="/portfolio" element={<Portfolio />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/ai-hub" element={<AIHub />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/governance" element={<Governance />} />
                        <Route path="/rewards" element={<Rewards />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <Footer />
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </ThemeProvider>
          </WalletProvider>
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </ErrorBoundary>
);

export default App;
