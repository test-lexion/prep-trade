import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  TrendingUp,
  Wallet,
  BarChart3,
  DollarSign,
  Briefcase,
  Trophy,
  Brain,
  AreaChart,
  Vote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNav = [
  { path: "/earn", label: "Earn", icon: DollarSign },
  { path: "/portfolio", label: "Portfolio", icon: Briefcase },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/ai-hub", label: "AI Hub", icon: Brain },
  { path: "/stats", label: "Stats", icon: AreaChart },
  { path: "/governance", label: "Governance", icon: Vote },
];

const tradeNav = [
  { path: "/", label: "Futures", icon: TrendingUp },
  { path: "/spot", label: "Spot", icon: Wallet },
  { path: "/options", label: "Options", icon: BarChart3 },
];

export const MobileDrawer = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-4">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">TradeFi</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-4">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Trade</h4>
            <nav className="flex flex-col gap-1">
              {tradeNav.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Menu</h4>
            <nav className="flex flex-col gap-1">
              {mainNav.map((item) => (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
