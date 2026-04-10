import NotificationBell from "@/components/dashboard/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { signOut } = useAuth();
  const handleLogout = () => {
    signOut();
  };

  return (
    <header className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-gold text-lg font-bold tracking-wide">BIN AL SHEIKH</span>
          <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">REAL ESTATE<br />BROKERAGE</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="w-9 h-9 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center text-gold font-bold text-sm">
          AD
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
