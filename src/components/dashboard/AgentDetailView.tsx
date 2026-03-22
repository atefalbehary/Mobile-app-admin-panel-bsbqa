import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, CheckCircle, Clock, DollarSign, ArrowLeft,
  UserCircle, Download, Search, Plus, Pencil, Trash2
} from "lucide-react";

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

interface RegisteredClient {
  id: string;
  client_name: string;
  email: string;
  phone: string;
  project: string;
  nationality: string;
  apt_details: string;
  created_at: string;
}

interface VisitSchedule {
  id: string;
  agent_name: string;
  project_name: string;
  unit_type: string;
  phone_number: string;
  visit_date: string;
}

interface AgentDetailViewProps {
  agent: Agent;
  onBack: () => void;
}

const AgentDetailView = ({ agent, onBack }: AgentDetailViewProps) => {
  const { toast } = useToast();
  const [detailTab, setDetailTab] = useState<"reservations" | "schedule" | "clients">("clients");
  const [clients, setClients] = useState<RegisteredClient[]>([]);
  const [visits, setVisits] = useState<VisitSchedule[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<RegisteredClient | null>(null);
  const [clientForm, setClientForm] = useState({ client_name: "", email: "", phone: "", project: "", nationality: "", apt_details: "" });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: agent.name,
    designation: "",
    email: agent.email,
    phone: agent.phone || "",
    address: "",
    about: "",
    facebook: "",
    twitter: "",
    linkedin: "",
    instagram: "",
  });
  const [isActive, setIsActive] = useState(agent.is_active);
  const [isSuperAgent, setIsSuperAgent] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchVisits();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("registered_clients" as any)
      .select("*")
      .eq("agent_id", agent.user_id)
      .order("created_at", { ascending: false });
    if (data) setClients(data as any);
  };

  const fetchVisits = async () => {
    const { data } = await supabase
      .from("visit_schedules" as any)
      .select("*")
      .eq("agent_id", agent.user_id)
      .order("visit_date", { ascending: false });
    if (data) setVisits(data as any);
  };

  const saveProfile = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || null,
        is_active: isActive,
      })
      .eq("user_id", agent.user_id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully" });
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const filteredClients = clients.filter((c) =>
    c.client_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.phone.includes(clientSearch)
  );

  const exportClients = () => {
    const csv = ["Client Name,Email,Phone,Project,Nationality,Apt. Details,Registered At"]
      .concat(filteredClients.map((c) => `"${c.client_name}","${c.email}","${c.phone}","${c.project}","${c.nationality}","${c.apt_details}","${formatDate(c.created_at)}"`))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `registered_clients_${agent.name.replace(/\s+/g, "_")}.csv`;
    link.click();
    toast({ title: "Clients exported" });
  };

  const openAddClient = () => {
    setEditingClient(null);
    setClientForm({ client_name: "", email: "", phone: "", project: "", nationality: "", apt_details: "" });
    setClientDialogOpen(true);
  };

  const openEditClient = (c: RegisteredClient) => {
    setEditingClient(c);
    setClientForm({ client_name: c.client_name, email: c.email, phone: c.phone, project: c.project, nationality: c.nationality, apt_details: c.apt_details });
    setClientDialogOpen(true);
  };

  const saveClient = async () => {
    if (!clientForm.client_name.trim() || !clientForm.email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    if (editingClient) {
      const { error } = await supabase.from("registered_clients" as any).update(clientForm as any).eq("id", editingClient.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Client updated" });
    } else {
      const { error } = await supabase.from("registered_clients" as any).insert({ ...clientForm, agent_id: agent.user_id } as any);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Client added" });
    }
    setClientDialogOpen(false);
    fetchClients();
  };

  const deleteClient = async (id: string) => {
    const { error } = await supabase.from("registered_clients" as any).delete().eq("id", id);
    if (!error) { setClients((prev) => prev.filter((c) => c.id !== id)); toast({ title: "Client deleted" }); }
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Agents
      </Button>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Building2 className="w-5 h-5 text-white" />, value: "0", label: "Total Property", bg: "bg-indigo-500" },
          { icon: <Clock className="w-5 h-5 text-white" />, value: "0", label: "Pending Property", bg: "bg-pink-500" },
          { icon: <CheckCircle className="w-5 h-5 text-white" />, value: "0", label: "Active Property", bg: "bg-amber-500" },
          { icon: <DollarSign className="w-5 h-5 text-white" />, value: "N0.00", label: "Total Purchase", bg: "bg-purple-500" },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/80">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Profile card + Edit form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Profile summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Joined at</p>
                <p className="text-xs text-muted-foreground">{formatDate(agent.created_at)}</p>
                <p className="font-bold text-foreground">Total Purchase</p>
                <p className="text-sm text-muted-foreground">N0.00</p>
              </div>
            </div>
            <div className="divide-y divide-border">
              <div className="flex justify-between py-3">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium text-foreground">{agent.name}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium text-foreground truncate ml-4">{agent.email}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="text-sm font-medium text-foreground">{agent.phone || "N/A"}</span>
              </div>
              <div className="flex justify-between py-3 items-center">
                <span className="text-sm text-muted-foreground">Agent Status</span>
                <Badge className={agent.is_active ? "bg-emerald-500 text-white" : "bg-destructive text-white"}>
                  {agent.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Agent Actions */}
          <div className="rounded-xl border border-border p-6 space-y-3">
            <h3 className="font-bold text-foreground">Agent Action</h3>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">Go to Agent Front Page</Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Property Reviews</Button>
            <Button className="w-full bg-gold hover:bg-gold/80 text-primary-foreground">Send Email</Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Purchase History</Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">View Uploaded Documents</Button>
            <Button className="w-full bg-destructive hover:bg-destructive/80 text-white">Delete Agent</Button>
          </div>
        </div>

        {/* Right: Edit Profile */}
        <div className="rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-bold text-primary text-lg">Edit Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name *</label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Designation *</label>
              <Input value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone *</label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="bg-secondary border-border" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Address *</label>
            <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">About *</label>
            <Textarea value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} className="bg-secondary border-border min-h-[80px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Facebook</label>
              <Input value={editForm.facebook} onChange={(e) => setEditForm({ ...editForm, facebook: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Twitter</label>
              <Input value={editForm.twitter} onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Linkedin</label>
              <Input value={editForm.linkedin} onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Instagram</label>
              <Input value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} className="bg-secondary border-border" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-emerald-500" />
              <span className="text-sm text-foreground">Active Account</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isSuperAgent} onCheckedChange={setIsSuperAgent} />
              <span className="text-sm text-foreground">Super Agent ✅</span>
            </div>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={saveProfile}>Save Changes</Button>
        </div>
      </div>

      {/* Bottom tabs: Reservations, Visit Schedule, Registered Clients */}
      <div className="flex gap-2">
        {([
          { key: "reservations", label: "RESERVATIONS", color: "bg-blue-600" },
          { key: "schedule", label: "VISIT SCHEDULE", color: "bg-emerald-600" },
          { key: "clients", label: "REGISTERED CLIENTS", color: "bg-destructive" },
        ] as const).map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={detailTab === t.key ? "default" : "outline"}
            className={detailTab === t.key ? `${t.color} text-white hover:opacity-90` : ""}
            onClick={() => setDetailTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Registered Clients Tab */}
      {detailTab === "clients" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search By Name | Email | Phone Number"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="bg-secondary border-border pl-10"
              />
            </div>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={exportClients}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" className="bg-gold hover:bg-gold/80 text-primary-foreground" onClick={openAddClient}>
              <Plus className="w-4 h-4 mr-1" /> Add Client
            </Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Client Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Phone</TableHead>
                  <TableHead className="text-muted-foreground">Project</TableHead>
                  <TableHead className="text-muted-foreground">Nationality</TableHead>
                  <TableHead className="text-muted-foreground">Apt. Details</TableHead>
                  <TableHead className="text-muted-foreground">Registered At</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No clients registered by this agent.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((c) => (
                    <TableRow key={c.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="font-medium text-sm text-foreground">{c.client_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-sm text-primary font-medium">{c.phone}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.project}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.nationality}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.apt_details}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(c.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gold hover:bg-gold/20" onClick={() => openEditClient(c)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/20" onClick={() => deleteClient(c.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Add/Edit Client Dialog */}
          <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingClient ? "Edit Client" : "Add New Client"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Client Name *</label>
                  <Input value={clientForm.client_name} onChange={(e) => setClientForm({ ...clientForm, client_name: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                  <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                  <Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="+974 XXXX XXXX" className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Project</label>
                  <Input value={clientForm.project} onChange={(e) => setClientForm({ ...clientForm, project: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nationality</label>
                  <Input value={clientForm.nationality} onChange={(e) => setClientForm({ ...clientForm, nationality: e.target.value })} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Apt. Details</label>
                  <Input value={clientForm.apt_details} onChange={(e) => setClientForm({ ...clientForm, apt_details: e.target.value })} placeholder="e.g. 2BR - Floor 12" className="bg-secondary border-border" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setClientDialogOpen(false)}>Cancel</Button>
                <Button className="bg-gold hover:bg-gold/80 text-primary-foreground" onClick={saveClient}>
                  {editingClient ? "Save Changes" : "Add Client"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Visit Schedule Tab */}
      {detailTab === "schedule" && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Agent Name</TableHead>
                <TableHead className="text-muted-foreground">Project Name</TableHead>
                <TableHead className="text-muted-foreground">Unit Type</TableHead>
                <TableHead className="text-muted-foreground">Phone Number</TableHead>
                <TableHead className="text-muted-foreground">Date Of Visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No visit schedules found for this agent.</TableCell>
                </TableRow>
              ) : (
                visits.map((v) => (
                  <TableRow key={v.id} className="border-border hover:bg-secondary/50">
                    <TableCell className="text-sm font-medium text-foreground">{v.agent_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.project_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{v.unit_type}</TableCell>
                    <TableCell className="text-sm text-primary font-medium">{v.phone_number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(v.visit_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reservations Tab */}
      {detailTab === "reservations" && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Property</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No reservations found for this agent.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AgentDetailView;
