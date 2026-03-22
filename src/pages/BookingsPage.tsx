import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, Clock, Calendar } from "lucide-react";
import StatsGrid from "@/components/dashboard/StatsGrid";
import { useToast } from "@/hooks/use-toast";

interface Booking {
  id: string;
  property_id: string | null;
  property_title: string | null;
  user_id: string | null;
  user_name: string | null;
  date: string;
  time: string | null;
  status: string;
  type: string;
  notes: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-gold/20 text-gold border-gold/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bookings").select("*").order("date", { ascending: false });
    if (data) setBookings(data);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = bookings.filter((b) => filterStatus === "all" || b.status === filterStatus);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (!error) {
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
      toast({ title: `Booking ${status}` });
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const stats = [
    { label: "Pending", value: bookings.filter((b) => b.status === "pending").length, icon: Clock, color: "text-gold" },
    { label: "Confirmed", value: bookings.filter((b) => b.status === "confirmed").length, icon: CheckCircle, color: "text-emerald-400" },
    { label: "Completed", value: bookings.filter((b) => b.status === "completed").length, icon: CheckCircle, color: "text-blue-400" },
    { label: "Today", value: bookings.filter((b) => b.date === today).length, icon: Calendar, color: "text-foreground" },
  ];

  return (
    <div className="space-y-4">
      <StatsGrid stats={stats} />

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-foreground">Bookings & Visits</h2>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px] bg-secondary border-border"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Property</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Client</TableHead>
              <TableHead className="text-muted-foreground">Date & Time</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Type</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bookings found</TableCell></TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-medium text-foreground text-sm">{b.property_title || "—"}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{b.user_name || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.date} {b.time || ""}</TableCell>
                  <TableCell className="hidden md:table-cell"><Badge className="bg-secondary text-muted-foreground border-border border text-xs capitalize">{b.type}</Badge></TableCell>
                  <TableCell><Badge className={`${statusColors[b.status] || ""} border text-xs`}>{b.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status === "pending" && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400" onClick={() => handleStatusChange(b.id, "confirmed")}><CheckCircle className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleStatusChange(b.id, "cancelled")}><XCircle className="w-4 h-4" /></Button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400" onClick={() => handleStatusChange(b.id, "completed")}><CheckCircle className="w-4 h-4" /></Button>
                      )}
                    </div>
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

export default BookingsPage;
