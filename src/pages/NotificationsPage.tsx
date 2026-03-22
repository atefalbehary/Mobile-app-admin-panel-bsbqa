import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send, Zap, History } from "lucide-react";
import ManualNotifications from "@/components/dashboard/notifications/ManualNotifications";
import AutomaticNotifications from "@/components/dashboard/notifications/AutomaticNotifications";
import NotificationHistory from "@/components/dashboard/notifications/NotificationHistory";

// ==========================================
// NotificationsPage - Refactored with 3 tabs:
// 1. Manual Notifications (admin-created)
// 2. Automatic Notifications (system rules)
// 3. Notification History (unified log)
// ==========================================

type NotifTab = "manual" | "automatic" | "history";

const tabs: { value: NotifTab; label: string; icon: React.ReactNode }[] = [
  { value: "manual", label: "Manual Notifications", icon: <Send className="w-4 h-4" /> },
  { value: "automatic", label: "Automatic Notifications", icon: <Zap className="w-4 h-4" /> },
  { value: "history", label: "Notification History", icon: <History className="w-4 h-4" /> },
];

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<NotifTab>("manual");
  // Used to trigger history refresh when a manual notification is sent
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Notification Center</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage manual campaigns and automatic notification rules
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            size="sm"
            variant={activeTab === tab.value ? "default" : "outline"}
            className={
              activeTab === tab.value
                ? "bg-gold text-primary-foreground hover:bg-gold/80"
                : "border-border"
            }
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.icon}
            <span className="ml-2">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "manual" && (
        <ManualNotifications
          onSent={() => setHistoryRefreshKey((k) => k + 1)}
        />
      )}
      {activeTab === "automatic" && <AutomaticNotifications />}
      {activeTab === "history" && <NotificationHistory refreshKey={historyRefreshKey} />}
    </div>
  );
};

export default NotificationsPage;
