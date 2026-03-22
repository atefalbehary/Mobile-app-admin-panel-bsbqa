import { UserCircle, Home, DollarSign, Clock, ChevronRight } from "lucide-react";

const activities = [
  { icon: UserCircle, iconColor: "text-blue-400", text: <>William <span className="font-semibold">approved</span></>, sub: "3 mins ago", time: "3 mins ago" },
  { icon: Home, iconColor: "text-gold", text: <>New skyline apartment <span className="font-semibold">added</span></>, sub: "2 hours ago", time: "2 hours ago" },
  { icon: DollarSign, iconColor: "text-purple-400", text: <>Price updated for <span className="font-semibold">Pearl Suite 910</span></>, sub: "5 hours ago", time: "5 hours ago" },
  { icon: Clock, iconColor: "text-gold-light", text: <>Visit reminder sent to <span className="font-semibold">Ali Al Murri</span></>, sub: "Yesterday", time: "Yesterday" },
];

const RecentActivity = () => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">Recent Activity</h2>
      <div className="space-y-2">
        {activities.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-gold/20 transition-colors"
          >
            <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${item.iconColor}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{item.text}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs shrink-0">
              <span className="hidden sm:inline">{item.time}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-3">
        <button className="text-sm text-gold flex items-center gap-1 hover:underline">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RecentActivity;
