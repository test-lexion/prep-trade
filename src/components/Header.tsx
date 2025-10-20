import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, TrendingUp, Wallet, BarChart3, Moon, Sun } from "lucide-react";
import { MobileDrawer } from "./MobileDrawer";

// --- 1. Import the Enhanced Wallet Connect component ---
import { EnhancedWalletConnect } from "@/components/wallet/EnhancedWalletConnect";

export const Header = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileDrawer />
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden text-xl font-bold sm:inline">TradeFi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={isActive("/") || isActive("/spot") || isActive("/options") ? "secondary" : "ghost"} className="gap-1">
                  Trade <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem asChild><Link to="/" className="w-full cursor-pointer"><TrendingUp className="mr-2 h-4 w-4" />Futures</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/spot" className="w-full cursor-pointer"><Wallet className="mr-2 h-4 w-4" />Spot</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/options" className="w-full cursor-pointer"><BarChart3 className="mr-2 h-4 w-4" />Options</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/earn"><Button variant={isActive("/earn") ? "secondary" : "ghost"}>Earn</Button></Link>
            <Link to="/portfolio"><Button variant={isActive("/portfolio") ? "secondary" : "ghost"}>Portfolio</Button></Link>
            <Link to="/leaderboard"><Button variant={isActive("/leaderboard") ? "secondary" : "ghost"}>Leaderboard</Button></Link>
            <Link to="/ai-hub"><Button variant={isActive("/ai-hub") ? "secondary" : "ghost"}>AI Hub</Button></Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* --- 2. Use the Enhanced Wallet Connect component --- */}
          <EnhancedWalletConnect />
        </div>
      </div>
    </header>
  );
};
