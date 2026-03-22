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
import { Trash2, Eye, ChevronDown, ChevronUp, X, Building2, Phone, Mail, FileText, Award, CreditCard, UserCheck } from "lucide-react";

interface Agency {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  agency_name: string | null;
  company_name: string | null;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected" | "suspended";
  trade_license_url: string | null;
  cr_url: string | null;
  brokerage_license_url: string | null;
  authorized_signatory_id_url: string | null;
  establishment_card_url: string | null;
  created_at: string;
}

const AgenciesPage = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("2010-01-01");
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const dummyAgencies: Agency[] = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      user_id: "00000000-0000-0000-0000-000000000011",
      name: "Testing Agency Admin",
      email: "bsbtestagency@gmail.com",
      phone: "+974123456",
      agency_name: "Testing Agency",
      company_name: "BSB Group",
      is_active: true,
      approval_status: "approved",
      trade_license_url: "https://example.com/trade-license.pdf",
      cr_url: "https://example.com/cr.pdf",
      brokerage_license_url: "https://example.com/brokerage.pdf",
      authorized_signatory_id_url: "https://example.com/signatory-id.pdf",
      establishment_card_url: null,
      created_at: "2026-03-05T08:27:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000002",
      user_id: "00000000-0000-0000-0000-000000000012",
      name: "XYZ Testing Admin",
      email: "xyz@testing.com",
      phone: "+974789012",
      agency_name: "XYZ Testing",
      company_name: "XYZ Corp",
      is_active: true,
      approval_status: "approved",
      trade_license_url: null,
      cr_url: null,
      brokerage_license_url: null,
      authorized_signatory_id_url: null,
      establishment_card_url: null,
      created_at: "2026-03-03T13:29:00Z",
    },
    {
      id: "00000000-0000-0000-0000-000000000003",
      user_id: "00000000-0000-0000-0000-000000000013",
      name: "Atef Company Admin",
      email: "atefcompany2@gmail.com",
      phone: "+974456789",
      agency_name: "atefcompany2",
      company_name: "Atef Holdings",
      is_active: true,
      approval_status: "approved",
      trade_license_url: null,
      cr_url: "https://example.com/atef-cr.pdf",
      brokerage_license_url: null,
      authorized_signatory_id_url: null,
      establishment_card_url: null,
      created_at: "2026-02-10T12:13:00Z",
    },
  ];

  const fetchAgencies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_type", "agency")
      .order("created_at", { ascending: false });
    const dbAgencies = (data || []) as Agency[];
    const dbUserIds = new Set(dbAgencies.map((a) => a.user_id));
    const merged = [...dbAgencies, ...dummyAgencies.filter((d) => !dbUserIds.has(d.user_id))];
    setAgencies(merged);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchAgencies(); }, []);

  const filtered = agencies.filter((a) => {
    const matchSearch =
      (a.agency_name || a.name || "").toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone || "").includes(search);
    const matchDate =
      new Date(a.created_at) >= new Date(dateFrom) &&
      new Date(a.created_at) <= new Date(dateTo + "T23:59:59");
    return matchSearch && matchDate;
  });

  const isDummy = (userId: string) => userId.startsWith("00000000-0000-0000-0000-0000000000");

  const toggleActive = async (userId: string, current: boolean) => {
    if (isDummy(userId)) {
      setAgencies((prev) => prev.map((a) => a.user_id === userId ? { ...a, is_active: !current } : a));
      toast({ title: `Agency ${!current ? "activated" : "deactivated"}` });
      return;
    }
    const { error } = await supabase.from("profiles").update({ is_active: !current }).eq("user_id", userId);
    if (!error) {
      setAgencies((prev) => prev.map((a) => a.user_id === userId ? { ...a, is_active: !current } : a));
      toast({ title: `Agency ${!current ? "activated" : "deactivated"}` });
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
      " " + date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const exportAgencies = () => {
    const csv = ["Agency Name,Email,Phone,Status,Created At"]
      .concat(filtered.map((a) => `"${a.agency_name || a.name}","${a.email}","${a.phone || ""}","${a.is_active ? "Active" : "Inactive"}","${formatDate(a.created_at)}"`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "agencies.csv";
    link.click();
    toast({ title: "Agencies exported" });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <Building2 className="w-5 h-5" /> Agencies
      </h2>

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
        <Button variant="default" size="sm" onClick={fetchAgencies}>Filter</Button>
        <Button variant="outline" size="sm" onClick={() => { setSearch(""); setDateFrom("2010-01-01"); setDateTo(new Date().toISOString().split("T")[0]); }}>Reset</Button>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={exportAgencies}>Export Agencies</Button>
        {selectedIds.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => { toast({ title: "Delete Selected", description: `${selectedIds.length} agencies marked for deletion` }); setSelectedIds([]); }}>
            Delete Selected
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox checked={selectedIds.length === filtered.length && filtered.length > 0} onCheckedChange={(c) => c ? setSelectedIds(filtered.map((a) => a.id)) : setSelectedIds([])} />
              </TableHead>
              <TableHead className="text-muted-foreground">#</TableHead>
              <TableHead className="text-muted-foreground">Agency Name</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Created At</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No agencies found</TableCell></TableRow>
            ) : (
              filtered.map((a, i) => (
                <>
                  <TableRow key={a.id} className="border-border hover:bg-secondary/50">
                    <TableCell><Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={() => toggleSelect(a.id)} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                    <TableCell>
                      <button onClick={() => setExpandedId(expandedId === a.id ? null : a.id)} className="flex items-center gap-1 text-gold hover:underline font-medium text-sm">
                        {a.agency_name || a.name}
                        {expandedId === a.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{formatDate(a.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={a.is_active ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border" : "bg-destructive/20 text-destructive border-destructive/30 border"}>
                          {a.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Switch checked={a.is_active} onCheckedChange={() => toggleActive(a.user_id, a.is_active)} className="data-[state=checked]:bg-emerald-500" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/20" onClick={() => toast({ title: "Delete requires server-side action" })}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:bg-blue-500/20" onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === a.id && (
                    <TableRow key={`${a.id}-info`} className="border-border bg-secondary/30">
                      <TableCell colSpan={6} className="p-0">
                        <div className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-foreground text-lg">AGENCY INFO</h3>
                            <button onClick={() => setExpandedId(null)} className="w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center hover:bg-destructive/30">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <InfoCard icon={<Building2 className="w-5 h-5" />} label="Agency Name" value={a.agency_name || a.name} />
                            <InfoCard icon={<Phone className="w-5 h-5" />} label="Agency Phone Number" value={a.phone || "N/A"} />
                            <InfoCard icon={<Mail className="w-5 h-5" />} label="Agency Email Address" value={a.email} />
                            <InfoCard icon={<Award className="w-5 h-5" />} label="Trade License" value={a.trade_license_url ? undefined : "N/A"} url={a.trade_license_url} />
                            <InfoCard icon={<FileText className="w-5 h-5" />} label="CR" value={a.cr_url ? undefined : "N/A"} url={a.cr_url} />
                            <InfoCard icon={<CreditCard className="w-5 h-5" />} label="Professional License" value={a.brokerage_license_url ? undefined : "N/A"} url={a.brokerage_license_url} />
                            <InfoCard icon={<UserCheck className="w-5 h-5" />} label="Authorized signatory ID Copy" value={a.authorized_signatory_id_url ? undefined : "N/A"} url={a.authorized_signatory_id_url} />
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
    </div>
  );
};

export default AgenciesPage;
