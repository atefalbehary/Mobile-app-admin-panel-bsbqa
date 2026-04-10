import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Edit, ListFilter, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AddPropertyForm from "@/components/dashboard/AddPropertyForm";
import { format } from "date-fns";

interface Property {
  id: string;
  name: string;
  unit_number: string | null;
  project: string | null;
  sale_type: string | null;
  status: string | null;
  created_at: string;
}

const PropertiesListPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSaleType, setFilterSaleType] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddProperty, setShowAddProperty] = useState(false);
  const { toast } = useToast();

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await api<Property[]>("/api/properties");
      setProperties(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProperties(); }, []);

  const projects = [...new Set(properties.map(p => p.project).filter(Boolean))];

  const [filtered, setFiltered] = useState<Property[]>([]);

  useEffect(() => {
    let result = properties;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        (p.name || "").toLowerCase().includes(s) ||
        (p.unit_number || "").toLowerCase().includes(s)
      );
    }
    if (filterSaleType !== "all") {
      result = result.filter(p => p.sale_type === filterSaleType);
    }
    if (filterProject !== "all") {
      result = result.filter(p => p.project === filterProject);
    }
    setFiltered(result);
  }, [properties, search, filterSaleType, filterProject]);

  const handleDelete = async (id: string) => {
    try {
      await api("/api/properties/" + id, { method: "DELETE" });
      setProperties((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      toast({ title: "Property deleted" });
    } catch (err: unknown) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      await api("/api/properties/delete-batch", { method: "POST", body: JSON.stringify({ ids }) });
      setProperties((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      toast({ title: `${ids.length} properties deleted` });
    } catch (err: unknown) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const handleReset = () => {
    setSearch("");
    setFilterSaleType("all");
    setFilterProject("all");
  };

  if (showAddProperty) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Create Property</h2>
          <p className="text-sm text-muted-foreground">Add a new property listing</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <AddPropertyForm onSuccess={() => { setShowAddProperty(false); fetchProperties(); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ListFilter className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Property List</h2>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground mb-1 block">Name/Unit Number</label>
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
        <div className="w-[160px]">
          <label className="text-sm text-muted-foreground mb-1 block">Sale Type</label>
          <Select value={filterSaleType} onValueChange={setFilterSaleType}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="sale">Buy</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[200px]">
          <label className="text-sm text-muted-foreground mb-1 block">Project</label>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All</SelectItem>
              {projects.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button className="bg-gold text-primary-foreground hover:bg-gold/80">
            <ListFilter className="w-4 h-4 mr-1" /> Filter
          </Button>
          <Button variant="outline" onClick={handleReset} className="border-border">
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Button onClick={() => setShowAddProperty(true)} className="bg-gold text-primary-foreground hover:bg-gold/80">
          <Plus className="w-4 h-4 mr-2" /> Create Property
        </Button>
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={handleDeleteSelected}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Selected ({selectedIds.size})
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
                  checked={filtered.length > 0 && selectedIds.size === filtered.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-muted-foreground w-12">#</TableHead>
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Unit Number</TableHead>
              <TableHead className="text-muted-foreground">Project</TableHead>
              <TableHead className="text-muted-foreground">Sale Type</TableHead>
              <TableHead className="text-muted-foreground">Is Active</TableHead>
              <TableHead className="text-muted-foreground">Created Date</TableHead>
              <TableHead className="text-muted-foreground text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No properties found</TableCell></TableRow>
            ) : (
              filtered.map((p, idx) => (
                <TableRow key={p.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="text-sm font-medium text-foreground max-w-[300px]">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.unit_number || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.project || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">
                    {p.sale_type === "sale" ? "Buy" : p.sale_type === "rent" ? "Rent" : p.sale_type || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs border ${p.status === "active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-destructive/20 text-destructive border-destructive/30"}`}>
                      {p.status === "active" ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(p.created_at), "dd-MMM-yyyy hh:mm a")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit className="w-4 h-4" />
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

export default PropertiesListPage;
