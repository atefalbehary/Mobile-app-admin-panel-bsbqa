import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import InfoCard from "@/components/dashboard/InfoCard";
import AgentDetailView from "@/components/dashboard/AgentDetailView";
import { Trash2, Eye, ChevronDown, ChevronUp, X, Building2, Phone, Mail, Award, CreditCard, UserCircle, Download } from "lucide-react";

interface VisitSchedule {
  id: string;
  agent_name: string;
  project_name: string;
  unit_type: string;
  phone_number: string;
  visit_date: string;
  notes: string | null;
  created_at: string;
}

interface Agent {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  agency_name: string | null;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected" | "suspended";
  brokerage_license_url: string | null;
  authorized_signatory_id_url: string | null;
  created_at: string;
}

const AgentsPage = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("2010-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"info" | "reservations" | "schedule">("info");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { toast } = useToast();

  const [visits, setVisits] = useState<VisitSchedule[]>([]);
  const [visitSearch, setVisitSearch] = useState("");
  const [visitDateFrom, setVisitDateFrom] = useState("");
  const [visitDateTo, setVisitDateTo] = useState("");
  const [visitSelectedIds, setVisitSelectedIds] = useState<string[]>([]);

  const dummyAgents: Agent[] = [
    {
      id: "00000000-0000-0000-0000-000000000101",
      user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "Test Agent",
      email: "bsbtestagent@gmail.com",
      phone: "+974123456",
      agency_name: "Testing Agency",
      is_active: true,
      approval_status: "approved",
      brokerage_license_url: null,
      authorized_signatory_id_url: null,
      created_at: "2026-03-05T08:27:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000102",
      user_id: "00000000-0000-0000-0000-000000000022",
      name: "Ahmed Hassan",
      email: "ahmed.hassan@realty.com",
      phone: "+974555111",
      agency_name: "XYZ Testing",
      is_active: true,
      approval_status: "approved",
      brokerage_license_url: "https://example.com/license.pdf",
      authorized_signatory_id_url: null,
      created_at: "2026-02-20T10:15:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000103",
      user_id: "00000000-0000-0000-0000-000000000023",
      name: "Sara Al Mansouri",
      email: "sara.mansouri@homes.qa",
      phone: "+974555222",
      agency_name: "atefcompany2",
      is_active: false,
      approval_status: "pending",
      brokerage_license_url: null,
      authorized_signatory_id_url: "https://example.com/id.pdf",
      created_at: "2026-01-15T14:30:00Z",
    },
  ];

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "agent")
      .order("created_at", { ascending: false });
    const dbAgents = (data || []) as Agent[];
    // Merge DB agents with dummy, avoiding duplicates by user_id
    const dbUserIds = new Set(dbAgents.map((a) => a.user_id));
    const merged = [...dbAgents, ...dummyAgents.filter((d) => !dbUserIds.has(d.user_id))];
    setAgents(merged);
    if (error) console.error(error);
    setLoading(false);
  };

  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from("visit_schedules" as any)
      .select("*")
      .order("visit_date", { ascending: false });
    if (data) setVisits(data as any as VisitSchedule[]);
    if (error) console.error(error);
  };

  useEffect(() => { fetchAgents(); fetchVisits(); }, []);

  const filtered = agents.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone || "").includes(search) ||
      (a.agency_name || "").toLowerCase().includes(search.toLowerCase());
    const matchDate =
      new Date(a.created_at) >= new Date(dateFrom) &&
      new Date(a.created_at) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchDate;
  });

  const filteredVisits = visits.filter((v) => {
    const matchSearch =
      v.agent_name.toLowerCase().includes(visitSearch.toLowerCase()) ||
      v.project_name.toLowerCase().includes(visitSearch.toLowerCase()) ||
      v.phone_number.includes(visitSearch);
    const matchFrom = visitDateFrom ? new Date(v.visit_date) >= new Date(visitDateFrom) : true;
    const matchTo = visitDateTo ? new Date(v.visit_date) <= new Date(visitDateTo + "T23:59:59") : true;
    return matchSearch && matchFrom && matchTo;
  });

  const isDummy = (userId: string) => userId.startsWith("00000000-0000-0000-0000-0000000000");

  const toggleActive = async (userId: string, current: boolean) => {
    if (isDummy(userId)) {
      setAgents((prev) => prev.map((a) => a.user_id === userId ? { ...a, is_active: !current } : a));
      toast({ title: `Agent ${!current ? "activated" : "deactivated"}` });
      return;
    }
    const { error } = await supabase.from("profiles").update({ is_active: !current }).eq("user_id", userId);
    if (!error) {
      setAgents((prev) => prev.map((a) => a.user_id === userId ? { ...a, is_active: !current } : a));
      toast({ title: `Agent ${!current ? "activated" : "deactivated"}` });
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const toggleVisitSelect = (id: string) => {
    setVisitSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const exportAgents = () => {
    const csv = ["Agent Name,Agency,Email,Phone,Status,Created At"]
      .concat(filtered.map((a) => `"${a.name}","${a.agency_name || ""}","${a.email}","${a.phone || ""}","${a.is_active ? "Active" : "Inactive"}","${formatDate(a.created_at)}"`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agents.csv";
    link.click();
    toast({ title: "Agents exported" });
  };

  const exportVisitSchedule = () => {
    const csv = ["Agent Name,Project Name,Unit Type,Phone Number,Date Of Visit"]
      .concat(filteredVisits.map((v) => `"${v.agent_name}","${v.project_name}","${v.unit_type}","${v.phone_number}","${formatDate(v.visit_date)}"`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "visit_schedule.csv";
    link.click();
    toast({ title: "Visit schedule exported successfully" });
  };

  const deleteVisits = async () => {
    const { error } = await supabase.from("visit_schedules" as any).delete().in("id", visitSelectedIds);
    if (!error) {
      setVisits((prev) => prev.filter((v) => !visitSelectedIds.includes(v.id)));
      setVisitSelectedIds([]);
      toast({ title: `${visitSelectedIds.length} visit(s) deleted` });
    }
  };

  if (selectedAgent) {
    return <AgentDetailView agent={selectedAgent} onBack={() => { setSelectedAgent(null); fetchAgents(); }} />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <UserCircle className="w-5 h-5" /> AGENTS / AGENTS INFO
      </h2>

      {/* Search label */}
      <p className="text-sm text-muted-foreground">Search By Name | Email | Phone Number</p>

      {/* Filters */}
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
        <Button variant="default" size="sm" onClick={fetchAgents}>Filter</Button>
        <Button variant="outline" size="sm" onClick={() => { setSearch(""); setDateFrom("2010-01-01"); setDateTo(new Date().toISOString().split("T")[0]); }}>Reset</Button>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-2">
        {(["info", "reservations", "schedule"] as const).map((t) => (
          <Button key={t} size="sm" variant={subTab === t ? "default" : "outline"}
            className={subTab === t ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            onClick={() => setSubTab(t)}>
            {t === "info" ? "Agent Info" : t === "reservations" ? "Reservations" : "Visit Schedule"}
          </Button>
        ))}
      </div>

      {subTab === "schedule" ? (
        <>
          {/* Visit Schedule Filters */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <Input
              placeholder="Search By Name | Email | Phone Number"
              value={visitSearch}
              onChange={(e) => setVisitSearch(e.target.value)}
              className="bg-secondary border-border"
            />
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">From</label>
                <Input type="date" value={visitDateFrom} onChange={(e) => setVisitDateFrom(e.target.value)} className="w-[160px] bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">To</label>
                <Input type="date" value={visitDateTo} onChange={(e) => setVisitDateTo(e.target.value)} className="w-[160px] bg-secondary border-border" />
              </div>
              <div className="flex-1 flex items-center justify-end gap-2">
                <Badge variant="outline" className="text-xs">{visitSelectedIds.length} items selected</Badge>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={exportVisitSchedule}>
                  <Download className="w-4 h-4 mr-1" /> Export
                </Button>
                {visitSelectedIds.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={deleteVisits}>Delete</Button>
                )}
              </div>
            </div>
          </div>

          {/* Visit Schedule Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={visitSelectedIds.length === filteredVisits.length && filteredVisits.length > 0}
                      onCheckedChange={(c) => c ? setVisitSelectedIds(filteredVisits.map((v) => v.id)) : setVisitSelectedIds([])}
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground">Agent Name</TableHead>
                  <TableHead className="text-muted-foreground">Project Name</TableHead>
                  <TableHead className="text-muted-foreground">Unit Type</TableHead>
                  <TableHead className="text-muted-foreground">Phone Number</TableHead>
                  <TableHead className="text-muted-foreground">Date Of Visit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No visit schedules found</TableCell></TableRow>
                ) : (
                  filteredVisits.map((v) => (
                    <TableRow key={v.id} className="border-border hover:bg-secondary/50">
                      <TableCell>
                        <Checkbox checked={visitSelectedIds.includes(v.id)} onCheckedChange={() => toggleVisitSelect(v.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-sm text-foreground">{v.agent_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.project_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{v.unit_type}</TableCell>
                      <TableCell className="text-sm text-primary font-medium">{v.phone_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {formatDate(v.visit_date)}
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <>
          {/* Action bar */}
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="text-xs">{selectedIds.length} items selected</Badge>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={exportAgents}>Export</Button>
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={() => { toast({ title: "Delete Selected", description: `${selectedIds.length} agents marked` }); setSelectedIds([]); }}>Delete</Button>
            )}
          </div>

          {/* Agent Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={(c) => c ? setSelectedIds(filtered.map((a) => a.id)) : setSelectedIds([])} />
                  </TableHead>
                  <TableHead className="text-muted-foreground">#</TableHead>
                  <TableHead className="text-muted-foreground">AGENT NAME</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">AGENCY NAME</TableHead>
                  <TableHead className="text-muted-foreground hidden md:table-cell">CREATED ON</TableHead>
                  <TableHead className="text-muted-foreground">STATUS</TableHead>
                  <TableHead className="text-muted-foreground text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No agents found</TableCell></TableRow>
                ) : (
                  filtered.map((a, i) => (
                    <>
                      <TableRow key={a.id} className="border-border hover:bg-secondary/50">
                        <TableCell><Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={() => toggleSelect(a.id)} /></TableCell>
                        <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                              <UserCircle className="w-5 h-5 text-muted-foreground" />
                            </div>
                            <div className="relative">
                              <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500" />
                            </div>
                            <button onClick={() => { setExpandedId(expandedId === a.id ? null : a.id); setSubTab("info"); }} className="flex items-center gap-1 font-medium text-sm text-foreground hover:text-gold">
                              {a.name}
                              {expandedId === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{a.agency_name || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{formatDate(a.created_at)}</TableCell>
                        <TableCell>
                          <Badge className={a.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border" : "bg-gold/20 text-gold border-gold/30 border"}>
                            {a.is_active ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gold hover:bg-gold/20" onClick={() => setSelectedAgent(a)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.user_id, a.is_active)} className="data-[state=checked]:bg-emerald-500" />
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === a.id && (
                        <TableRow key={`${a.id}-info`} className="border-border bg-secondary/30">
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-6 space-y-4">
                              <div className="flex items-center justify-between">
                                <h3 className="font-bold text-foreground text-lg">AGENT INFO</h3>
                                <button onClick={() => setExpandedId(null)} className="w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <InfoCard icon={<Building2 className="w-5 h-5" />} label="Agency Name" value={a.agency_name || "N/A"} />
                                <InfoCard icon={<Phone className="w-5 h-5" />} label="Agent Phone Number" value={a.phone || "N/A"} />
                                <InfoCard icon={<Mail className="w-5 h-5" />} label="Agent Email Address" value={a.email} />
                                <InfoCard icon={<Award className="w-5 h-5" />} label="Professional License" value={a.brokerage_license_url ? undefined : "N/A"} url={a.brokerage_license_url} />
                                <InfoCard icon={<CreditCard className="w-5 h-5" />} label="ID Card" value={a.authorized_signatory_id_url ? undefined : "N/A"} url={a.authorized_signatory_id_url} />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentsPage;
