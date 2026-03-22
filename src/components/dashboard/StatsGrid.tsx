import React from "react";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  columns?: number;
}

const StatsGrid = ({ stats, columns = 4 }: StatsGridProps) => (
  <div className={`grid grid-cols-2 lg:grid-cols-${columns} gap-3`}>
    {stats.map((s, i) => (
      <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-gold">
          <s.icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className={`text-xl font-bold ${s.color || "text-foreground"}`}>{s.value}</p>
        </div>
      </div>
    ))}
  </div>
);

export default StatsGrid;
