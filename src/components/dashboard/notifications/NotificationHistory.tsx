import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Bell, Smartphone, Mail, MessageSquare, Zap, User } from "lucide-react";
import { format } from "date-fns";

// ==========================================
// Notification History - Unified log table
// Shows both automatic and manual notifications
// with filters for category, status, etc.
// ==========================================

interface HistoryNotification {
  id: string;
  title: string;
  title_ar: string | null;
  body: string | null;
  type: string;
  target: string;
  status: string;
  source_type: string;
  trigger_type: string | null;
  delivery_channel: string;
  sent_at: string | null;
  scheduled_at: string | null;
  recipient_count: number | null;
  open_rate: number | null;
  created_at: string;
  created_by: string | null;
}

type FilterType = "all" | "automatic" | "manual" | "scheduled" | "sent" | "failed" | "draft";

interface NotificationHistoryProps {
  refreshKey: number;
}

const statusColors: Record<string, string> = {
  sent: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  draft: "bg-muted text-muted-foreground border-border",
  failed: "bg-destructive/20 text-destructive border-destructive/30",
};

const channelIcons: Record<string, React.ReactNode> = {
  push: <Smartphone className="w-4 h-4" />,
  in_app: <Bell className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  sms: <MessageSquare className="w-4 h-4" />,
};

const filters: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
  { value: "draft", label: "Draft" },
  { value: "failed", label: "Failed" },
];

const NotificationHistory = ({ refreshKey }: NotificationHistoryProps) => {
  const [notifications, setNotifications] = useState<HistoryNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { toast } = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setNotifications(data as any as HistoryNotification[]);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, [refreshKey]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast({ title: "Notification deleted" });
    }
  };

  // Apply filter
  const filtered = notifications.filter((n) => {
    switch (activeFilter) {
      case "automatic": return n.source_type === "automatic";
      case "manual": return n.source_type === "manual";
      case "scheduled": return n.status === "scheduled";
      case "sent": return n.status === "sent";
      case "draft": return n.status === "draft";
      case "failed": return n.status === "failed";
      default: return true;
    }
  });

  // Stats
  const totalSent = notifications.filter((n) => n.status === "sent").length;
  const totalScheduled = notifications.filter((n) => n.status === "scheduled").length;
  const totalAutomatic = notifications.filter((n) => n.source_type === "automatic").length;
  const totalManual = notifications.filter((n) => n.source_type === "manual").length;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Sent", value: totalSent, color: "text-emerald-400" },
          { label: "Scheduled", value: totalScheduled, color: "text-blue-400" },
          { label: "Automatic", value: totalAutomatic, color: "text-gold" },
          { label: "Manual", value: totalManual, color: "text-purple-400" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={activeFilter === f.value ? "default" : "outline"}
            className={activeFilter === f.value ? "bg-gold text-primary-foreground hover:bg-gold/80" : "border-border"}
            onClick={() => setActiveFilter(f.value)}
          >
            {f.label}
            {activeFilter === f.value && (
              <Badge className="ml-2 bg-primary-foreground/20 text-primary-foreground text-xs px-1.5">
                {f.value === "all" ? notifications.length : filtered.length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* History table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Channel</TableHead>
              <TableHead className="text-muted-foreground">Notification</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Category</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Trigger</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Audience</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Recipients</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Open Rate</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Created At</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Sent At</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No notifications found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((n) => (
                <TableRow key={n.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <div className="text-gold">
                      {channelIcons[n.delivery_channel] || channelIcons[n.type] || <Bell className="w-4 h-4" />}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground text-sm">{n.title}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{n.body}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge
                      className={`text-xs border ${
                        n.source_type === "automatic"
                          ? "bg-gold/20 text-gold border-gold/30"
                          : "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      }`}
                    >
                      {n.source_type === "automatic" ? (
                        <><Zap className="w-3 h-3 mr-1" /> Auto</>
                      ) : (
                        <><User className="w-3 h-3 mr-1" /> Manual</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground capitalize">
                    {(n.trigger_type || "—").replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground capitalize">{n.target}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {(n.recipient_count || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-gold">
                    {n.open_rate || 0}%
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {format(new Date(n.created_at), "dd-MMM-yy HH:mm")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {n.sent_at ? format(new Date(n.sent_at), "dd-MMM-yy HH:mm") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[n.status] || ""} border text-xs`}>{n.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(n.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default NotificationHistory;
