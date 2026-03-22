import { Smartphone, Megaphone, Grid3X3, Bell, Users, Building2, UserCircle, MessageCircle, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardTab } from "@/types/dashboard";

const tabs: { icon: typeof Smartphone; label: string; tab: DashboardTab }[] = [
  { icon: Smartphone, label: "Mobile App", tab: "mobile-app" },
  { icon: Megaphone, label: "Properties List", tab: "properties-list" },
  { icon: Grid3X3, label: "Projects", tab: "projects" },
  { icon: Bell, label: "Notifications", tab: "notifications" },
  { icon: Users, label: "Users", tab: "users" },
  { icon: Building2, label: "Agencies", tab: "agencies" },
  { icon: UserCircle, label: "Agents", tab: "agents" },
  { icon: MessageCircle, label: "Chat Box", tab: "chatbox" },
  { icon: LayoutGrid, label: "Prop Types", tab: "property-types" },
];

interface BottomTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const BottomTabs = ({ activeTab, onTabChange }: BottomTabsProps) => {
  return (
    <>
      {/* Desktop tab bar */}
      <div className="hidden lg:flex gap-2 mt-6 flex-wrap">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => onTabChange(tab.tab)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors",
              activeTab === tab.tab
                ? "bg-gold text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border flex justify-around py-2 z-50 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => onTabChange(tab.tab)}
            className={cn(
              "flex flex-col items-center gap-0.5 text-[10px] py-1 px-2 shrink-0",
              activeTab === tab.tab ? "text-gold" : "text-muted-foreground"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="truncate max-w-[60px]">{tab.label}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default BottomTabs;
