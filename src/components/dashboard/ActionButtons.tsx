import { Send, Grid3X3, Megaphone, UserPlus } from "lucide-react";

const actions = [
  { icon: Send, label: "Send Notification", action: "notification" },
  { icon: Grid3X3, label: "Add Project", action: "project" },
  { icon: Megaphone, label: "Create Pop-up", action: "popup" },
  { icon: UserPlus, label: "Add Property", action: "property" },
];

interface ActionButtonsProps {
  onAction?: (action: string) => void;
}

const ActionButtons = ({ onAction }: ActionButtonsProps) => {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={() => onAction?.(a.action)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gold/40 text-gold hover:bg-gold/10 transition-colors text-sm font-medium"
        >
          <a.icon className="w-4 h-4" />
          {a.label}
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
