import { Bell, UserPlus, Calendar, BookOpen, Users, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useAdminNotifications, AdminNotification } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, React.ReactNode> = {
  new_user: <UserPlus className="w-4 h-4 text-emerald-500" />,
  new_booking: <BookOpen className="w-4 h-4 text-blue-500" />,
  new_visit: <Calendar className="w-4 h-4 text-amber-500" />,
  new_client: <Users className="w-4 h-4 text-purple-500" />,
  info: <Bell className="w-4 h-4 text-muted-foreground" />,
};

const NotificationItem = ({
  notif,
  onRead,
}: {
  notif: AdminNotification;
  onRead: (id: string) => void;
}) => (
  <button
    onClick={() => !notif.is_read && onRead(notif.id)}
    className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0 ${
      !notif.is_read ? "bg-gold/5" : ""
    }`}
  >
    <div className="mt-0.5 shrink-0">
      {typeIcons[notif.type] || typeIcons.info}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-foreground leading-tight">{notif.title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
      <p className="text-[10px] text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
      </p>
    </div>
    {!notif.is_read && (
      <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-1.5" />
    )}
  </button>
);

const NotificationBell = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useAdminNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative text-foreground hover:text-gold transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-primary-foreground text-[10px] flex items-center justify-center font-bold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0 border-border bg-card shadow-xl"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-gold hover:text-gold/80 h-auto py-1 px-2"
              onClick={markAllAsRead}
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem key={n.id} notif={n} onRead={markAsRead} />
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
