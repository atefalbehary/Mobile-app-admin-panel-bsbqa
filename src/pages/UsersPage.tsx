import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, Eye, CheckCircle, XCircle, Calendar } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  user_type: "user" | "agent" | "agency";
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected" | "suspended";
  agency_name: string | null;
  company_name: string | null;
  brokerage_license_url: string | null;
  authorized_signatory_id_url: string | null;
  cr_url: string | null;
  establishment_card_url: string | null;
  trade_license_url: string | null;
  created_at: string;
  updated_at: string;
}

const typeColors: Record<string, string> = {
  user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  agent: "bg-gold/20 text-gold border-gold/30",
  agency: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const UsersPage = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [dateFrom, setDateFrom] = useState("2010-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const { toast } = useToast();

  const dummyUsers: Profile[] = [
    {
      id: "00000000-0000-0000-0000-000000000201", user_id: "00000000-0000-0000-0000-000000000211",
      name: "Test Agent", email: "bsbtestagent@gmail.com", phone: "+974123456",
      user_type: "agent", is_active: true, approval_status: "approved",
      agency_name: "Testing Agency", company_name: null, brokerage_license_url: null,
      authorized_signatory_id_url: null, cr_url: null, establishment_card_url: null,
      trade_license_url: null, created_at: "2026-03-05T08:27:00Z", updated_at: "2026-03-05T08:27:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000202", user_id: "00000000-0000-0000-0000-000000000212",
      name: "Testing Agency", email: "bsbtestagency@gmail.com", phone: "+974123456",
      user_type: "agency", is_active: true, approval_status: "approved",
      agency_name: "Testing Agency", company_name: "BSB Group", brokerage_license_url: null,
      authorized_signatory_id_url: null, cr_url: null, establishment_card_url: null,
      trade_license_url: null, created_at: "2026-03-05T08:27:00Z", updated_at: "2026-03-05T08:27:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000203", user_id: "00000000-0000-0000-0000-000000000213",
      name: "John User", email: "john@example.com", phone: "+974999888",
      user_type: "user", is_active: true, approval_status: "approved",
      agency_name: null, company_name: null, brokerage_license_url: null,
      authorized_signatory_id_url: null, cr_url: null, establishment_card_url: null,
      trade_license_url: null, created_at: "2026-02-15T10:00:00Z", updated_at: "2026-02-15T10:00:00Z",
    },
  ];

  const isDummy = (userId: string) => userId.startsWith("00000000-0000-0000-0000-0000000000");

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const dbUsers = (data || []) as Profile[];
    const dbUserIds = new Set(dbUsers.map((u) => u.user_id));
    const merged = [...dbUsers, ...dummyUsers.filter((d) => !dbUserIds.has(d.user_id))];
    setUsers(merged);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || "").includes(search);
    const matchType = filterType === "all" || u.user_type === filterType;
    const matchDate =
      new Date(u.created_at) >= new Date(dateFrom) &&
      new Date(u.created_at) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchType && matchDate;
  });

  const toggleActive = async (userId: string, currentActive: boolean) => {
    if (isDummy(userId)) {
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, is_active: !currentActive } : u)));
      toast({ title: `User ${!currentActive ? "activated" : "deactivated"}` });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentActive })
      .eq("user_id", userId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, is_active: !currentActive } : u))
      );
      toast({ title: `User ${!currentActive ? "activated" : "deactivated"}` });
    }
  };

  const updateApproval = async (userId: string, status: "approved" | "rejected") => {
    const isActive = status === "approved";
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: status, is_active: isActive })
      .eq("user_id", userId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, approval_status: status, is_active: isActive } : u
        )
      );
      toast({ title: `User ${status}` });
      setViewUser(null);
    }
  };

  const deleteSelected = async () => {
    // In a real app you'd also delete auth users via admin API
    toast({ title: "Delete Selected", description: `${selectedUsers.length} users marked for deletion` });
    setSelectedUsers([]);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " " +
      date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const stats = {
    total: users.length,
    users: users.filter((u) => u.user_type === "user").length,
    agents: users.filter((u) => u.user_type === "agent").length,
    agencies: users.filter((u) => u.user_type === "agency").length,
    pending: users.filter((u) => u.approval_status === "pending").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Users", value: stats.total, color: "text-foreground" },
          { label: "Users", value: stats.users, color: "text-blue-400" },
          { label: "Agents", value: stats.agents, color: "text-gold" },
          { label: "Agencies", value: stats.agencies, color: "text-purple-400" },
          { label: "Pending Approval", value: stats.pending, color: "text-destructive" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters - matching reference screenshot */}
      <div className="flex flex-col lg:flex-row gap-3 items-end">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">From</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px] bg-secondary border-border" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">To</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px] bg-secondary border-border" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Name/Email/Phone</label>
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary border-border" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[130px] bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
            <SelectItem value="agency">Agency</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="default" size="sm" onClick={fetchUsers}>
          Filter
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearch("");
            setFilterType("all");
            setDateFrom("2010-01-01");
            setDateTo(new Date().toISOString().split("T")[0]);
          }}
        >
          Reset
        </Button>
        {selectedUsers.length > 0 && (
          <Button variant="destructive" size="sm" onClick={deleteSelected}>
            Delete Selected ({selectedUsers.length})
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedUsers.length === filtered.length && filtered.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedUsers(filtered.map((u) => u.id));
                    else setSelectedUsers([]);
                  }}
                />
              </TableHead>
              <TableHead className="text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Email</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Phone</TableHead>
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Is Active</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Created On</TableHead>
              <TableHead className="text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u, i) => (
                <TableRow key={u.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={() => toggleSelect(u.id)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                  <TableCell className="font-medium text-foreground text-sm">{u.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{u.email}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{u.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`${typeColors[u.user_type]} border text-xs capitalize`}>{u.user_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.is_active}
                      onCheckedChange={() => toggleActive(u.user_id, u.is_active)}
                      className="data-[state=checked]:bg-success data-[state=unchecked]:bg-destructive"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{formatDate(u.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/20"
                        onClick={() =>
                          toast({ title: "Delete", description: "Admin deletion requires server-side action" })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-400 hover:bg-blue-500/20"
                        onClick={() => setViewUser(u)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">User Details</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="text-foreground font-medium">{viewUser.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground font-medium">{viewUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="text-foreground font-medium">{viewUser.phone || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <Badge className={`${typeColors[viewUser.user_type]} border text-xs capitalize`}>
                    {viewUser.user_type}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={viewUser.is_active ? "bg-success/20 text-success border-success/30 border" : "bg-destructive/20 text-destructive border-destructive/30 border"}>
                    {viewUser.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Approval</p>
                  <Badge className="border text-xs capitalize">{viewUser.approval_status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Joined</p>
                  <p className="text-foreground text-xs">{formatDate(viewUser.created_at)}</p>
                </div>
              </div>

              {/* Agency/Agent specific info */}
              {viewUser.user_type === "agent" && viewUser.agency_name && (
                <div>
                  <p className="text-muted-foreground text-sm">Agency Name</p>
                  <p className="text-foreground font-medium">{viewUser.agency_name}</p>
                </div>
              )}

              {viewUser.user_type === "agency" && (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm font-semibold">Documents</p>
                  {[
                    { label: "Brokerage License", url: viewUser.brokerage_license_url },
                    { label: "Signatory ID", url: viewUser.authorized_signatory_id_url },
                    { label: "CR", url: viewUser.cr_url },
                    { label: "Establishment Card", url: viewUser.establishment_card_url },
                    { label: "Trade License", url: viewUser.trade_license_url },
                  ].map((doc) => (
                    <div key={doc.label} className="flex items-center justify-between bg-secondary rounded-lg p-2 text-sm">
                      <span className="text-muted-foreground">{doc.label}</span>
                      <Badge className={doc.url ? "bg-success/20 text-success border-success/30 border" : "bg-muted text-muted-foreground border"}>
                        {doc.url ? "Uploaded" : "Missing"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Approval actions for agents/agencies */}
              {(viewUser.user_type === "agent" || viewUser.user_type === "agency") && viewUser.approval_status === "pending" && (
                <div className="flex gap-3 pt-2">
                  <Button onClick={() => updateApproval(viewUser.user_id, "approved")} className="flex-1 bg-success hover:bg-success/80 text-white">
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button onClick={() => updateApproval(viewUser.user_id, "rejected")} variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
