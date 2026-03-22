import { useState } from "react";
import { DashboardTab } from "@/types/dashboard";
import Header from "@/components/dashboard/Header";
import Sidebar from "@/components/dashboard/Sidebar";
import StatsCards from "@/components/dashboard/StatsCards";
import ActionButtons from "@/components/dashboard/ActionButtons";
import RecentActivity from "@/components/dashboard/RecentActivity";
import BottomTabs from "@/components/dashboard/BottomTabs";
import PropertiesPage from "@/pages/PropertiesPage";
import UsersPage from "@/pages/UsersPage";
import NotificationsPage from "@/pages/NotificationsPage";
import PropertiesListPage from "@/pages/PropertiesListPage";
import BookingsPage from "@/pages/BookingsPage";
import AgenciesPage from "@/pages/AgenciesPage";
import AgentsPage from "@/pages/AgentsPage";
import ChatBoxPage from "@/pages/ChatBoxPage";
import PropertyTypesPage from "@/pages/PropertyTypesPage";
import AddPropertyForm from "@/components/dashboard/AddPropertyForm";
import CreatePopupDialog from "@/components/dashboard/CreatePopupDialog";

// DashboardTab type imported from @/types/dashboard

const Index = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("mobile-app");
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);

  const renderContent = () => {
    if (activeTab === "mobile-app" && showAddProperty) {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Add Property</h2>
            <p className="text-sm text-muted-foreground">Add a new property listing to the mobile app</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <AddPropertyForm onSuccess={() => setShowAddProperty(false)} />
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "mobile-app":
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Mobile App Management Center</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage mobile users, content, notifications & automation</p>
            </div>
            <StatsCards />
            <ActionButtons onAction={(action) => {
              if (action === "notification") setActiveTab("notifications");
              if (action === "project") setActiveTab("projects");
              if (action === "popup") setShowCreatePopup(true);
              if (action === "property") setShowAddProperty(true);
            }} />
            <RecentActivity />
            <CreatePopupDialog open={showCreatePopup} onOpenChange={setShowCreatePopup} />
          </div>
        );
      case "properties-list":
        return <PropertiesListPage />;
      case "projects":
        return <PropertiesPage />;
      case "notifications":
        return <NotificationsPage />;
      case "users":
        return <UsersPage />;
      case "bookings":
        return <BookingsPage />;
      case "agencies":
        return <AgenciesPage />;
      case "agents":
        return <AgentsPage />;
      case "chatbox":
        return <ChatBoxPage />;
      case "property-types":
        return <PropertyTypesPage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowAddProperty(false); }} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 pb-20 lg:pb-6">
          {renderContent()}
          <BottomTabs activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setShowAddProperty(false); }} />
        </main>
      </div>
    </div>
  );
};

export default Index;
