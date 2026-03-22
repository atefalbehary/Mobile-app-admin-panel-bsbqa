import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddProjectForm from "@/components/dashboard/AddProjectForm";

interface Property {
  id: string;
  name: string;
  name_ar: string | null;
  property_type: string | null;
  status: string | null;
  price: number | null;
  currency: string | null;
  bedroom_count: number | null;
  bathroom_count: number | null;
  gross_area: number | null;
  location: string | null;
  is_featured: boolean | null;
  created_at: string;
}

type SubTab = "list" | "add-project";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  draft: "bg-muted text-muted-foreground border-border",
  sold: "bg-gold/20 text-gold border-gold/30",
  rented: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  inactive: "bg-muted text-muted-foreground border-border",
};

const typeLabels: Record<string, string> = {
  apartment: "Apartment", villa: "Villa", office: "Office", land: "Land",
  penthouse: "Penthouse", townhouse: "Townhouse", studio: "Studio",
};

const PropertiesPage = () => {
  const [subTab, setSubTab] = useState<SubTab>("list");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const fetchProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, name_ar, property_type, status, price, currency, bedroom_count, bathroom_count, gross_area, location, is_featured, created_at")
      .order("created_at", { ascending: false });
    if (data) setProperties(data);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const filtered = properties.filter((p) => {
    const matchSearch = (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.location || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.property_type === filterType;
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (!error) { setProperties((prev) => prev.filter((p) => p.id !== id)); toast({ title: "Property deleted" }); }
    else toast({ title: "Delete failed", description: error.message, variant: "destructive" });
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    const { error } = await supabase.from("properties").update({ is_featured: !current }).eq("id", id);
    if (!error) setProperties((prev) => prev.map((p) => p.id === id ? { ...p, is_featured: !current } : p));
  };

  if (subTab === "add-project") {
    return (
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <AddProjectForm onSuccess={() => setSubTab("list")} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Properties</h2>
          <p className="text-sm text-muted-foreground">{properties.length} total properties</p>
        </div>
        <Button onClick={() => setSubTab("add-project")} className="bg-gold text-primary-foreground hover:bg-gold-dark">
          <Plus className="w-4 h-4 mr-2" /> Add Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search properties..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] bg-secondary border-border"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] bg-secondary border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Property</TableHead>
              <TableHead className="text-muted-foreground hidden md:table-cell">Type</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground hidden lg:table-cell">Location</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No properties found</TableCell></TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {p.is_featured && <Star className="w-4 h-4 text-gold fill-gold" />}
                      <div>
                        <p className="font-medium text-foreground text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.bedroom_count || 0} BD · {p.bathroom_count || 0} BA · {p.gross_area || 0}m²</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{typeLabels[p.property_type || ""] || p.property_type}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground">{(p.price || 0).toLocaleString()} {p.currency || "QAR"}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{p.location || "—"}</TableCell>
                  <TableCell><Badge className={`${statusColors[p.status || ""] || ""} border text-xs`}>{p.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-gold" onClick={() => handleToggleFeatured(p.id, !!p.is_featured)}>
                        <Star className={`w-4 h-4 ${p.is_featured ? "fill-gold text-gold" : ""}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
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

export default PropertiesPage;
