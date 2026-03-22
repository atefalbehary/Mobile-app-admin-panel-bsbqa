import React from "react";

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  url?: string | null;
}

const InfoCard = ({ icon, label, value, url }: InfoCardProps) => (
  <div className="flex items-center gap-3 bg-gold/5 border border-gold/20 rounded-xl p-4">
    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center text-gold shrink-0">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      {value && <p className="text-sm font-medium text-foreground truncate">{value}</p>}
    </div>
    {url && (
      <a href={url} target="_blank" rel="noopener noreferrer">
        <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-gold text-primary-foreground hover:bg-gold/80 transition-colors">View</button>
      </a>
    )}
  </div>
);

export default InfoCard;
