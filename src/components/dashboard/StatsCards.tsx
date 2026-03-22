import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone, MessageSquare, Bell, Heart, CalendarCheck } from "lucide-react";

const StatsCards = () => {
  const [stats, setStats] = useState({
    users: 0,
    agents: 0,
    agencies: 0,
    notifications: 0,
    properties: 0,
    visits: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [profilesRes, notifRes, propsRes, visitsRes] = await Promise.all([
        supabase.from("profiles").select("user_type"),
        supabase.from("notifications").select("id", { count: "exact", head: true }),
        supabase.from("properties").select("id", { count: "exact", head: true }),
        supabase.from("visit_schedules").select("id", { count: "exact", head: true }),
      ]);

      const profiles = profilesRes.data || [];
      const users = profiles.filter((p) => p.user_type === "user").length;
      const agents = profiles.filter((p) => p.user_type === "agent").length;
      const agencies = profiles.filter((p) => p.user_type === "agency").length;

      setStats({
        users: users + agents + agencies,
        agents,
        agencies,
        notifications: notifRes.count || 0,
        properties: propsRes.count || 0,
        visits: visitsRes.count || 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { value: stats.users.toLocaleString(), label: "Mobile Users", change: `${stats.agents} Agents`, icon: Smartphone, gradient: "from-gold-dark/40 to-card" },
    { value: stats.agents.toLocaleString(), label: "Active Agents", change: `${stats.agencies} Agencies`, icon: MessageSquare, gradient: "from-gold-dark/30 to-card" },
    { value: stats.notifications.toLocaleString(), label: "Notifications Sent", change: "", icon: Bell, gradient: "from-purple-900/40 to-card" },
    { value: stats.properties.toLocaleString(), label: "Properties Listed", change: "", icon: Heart, gradient: "from-gold-dark/40 to-card" },
    { value: stats.agencies.toLocaleString(), label: "Agencies", change: "", icon: Heart, gradient: "from-gold-dark/30 to-card" },
    { value: stats.visits.toLocaleString(), label: "Scheduled Visits", change: "", icon: CalendarCheck, gradient: "from-blue-900/40 to-card" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((stat, i) => (
        <div
          key={i}
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} border border-border p-4 flex flex-col justify-between min-h-[100px]`}
        >
          <div className="absolute top-2 right-2 text-gold/30">
            <stat.icon className="w-10 h-10" />
          </div>
          <div>
            <p className="text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
          {stat.change && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-success">{stat.change}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
