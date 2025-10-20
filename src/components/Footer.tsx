import { Link, useLocation } from "react-router-dom";
import { Brain, DollarSign, TrendingUp, Trophy, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Trade", icon: TrendingUp, trade: true },
  { path: "/earn", label: "Earn", icon: DollarSign },
  { path: "/portfolio", label: "Portfolio", icon: Wallet },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/ai-hub", label: "AI Hub", icon: Brain },
];

export const Footer = () => {
  const location = useLocation();

  const isTradeActive = ["/", "/spot", "/options"].includes(location.pathname);

  return (
    <footer className="sticky bottom-0 z-50 w-full border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:hidden">
      <nav className="container flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = item.trade ? isTradeActive : location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
};
