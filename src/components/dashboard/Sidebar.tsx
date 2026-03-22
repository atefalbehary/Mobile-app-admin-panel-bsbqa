import { Search, BarChart3, Users, Bell, MapPin, Settings, Building2, UserCircle, CalendarDays, Smartphone, List, MessageCircle, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardTab } from "@/types/dashboard";

const navItems: { icon: typeof Search; label: string; tab?: DashboardTab }[] = [
  { icon: Smartphone, label: "Mobile App", tab: "mobile-app" },
  { icon: List, label: "Properties", tab: "properties-list" },
  { icon: BarChart3, label: "SEO" },
  { icon: UserCircle, label: "Agents", tab: "agents" },
  { icon: Bell, label: "Notifications", tab: "notifications" },
  { icon: Settings, label: "Settings" },
  { icon: Building2, label: "Agencies", tab: "agencies" },
  { icon: Users, label: "Users", tab: "users" },
  { icon: CalendarDays, label: "Bookings", tab: "bookings" },
  { icon: MessageCircle, label: "Chat Box", tab: "chatbox" },
  { icon: LayoutGrid, label: "Property Types", tab: "property-types" },
];

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
  return (
    <aside className="hidden lg:flex w-[72px] flex-col items-center bg-sidebar border-r border-sidebar-border py-4 gap-1">
      {navItems.map((item, i) => (
        <button
          key={i}
          onClick={() => item.tab && onTabChange(item.tab)}
          className={cn(
            "flex flex-col items-center justify-center w-14 h-14 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-[10px] gap-1",
            item.tab === activeTab && "bg-sidebar-accent text-gold border border-gold/30"
          )}
        >
          <item.icon className="w-5 h-5" />
          {item.label && <span className="truncate">{item.label}</span>}
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;
