import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Eye, MousePointerClick, Trash2, Edit, Image, Megaphone, BookOpen, AlertCircle, Building2 } from "lucide-react";
import AddPropertyForm from "@/components/dashboard/AddPropertyForm";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  image_url: string | null;
  link: string | null;
  start_date: string | null;
  end_date: string | null;
  views: number | null;
  clicks: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactive: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const typeIcons: Record<string, React.ReactNode> = {
  popup: <AlertCircle className="w-5 h-5" />,
  banner: <Image className="w-5 h-5" />,
  story: <BookOpen className="w-5 h-5" />,
  announcement: <Megaphone className="w-5 h-5" />,
};

const ContentManagerPage = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const { toast } = useToast();

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("content_items").select("*").order("created_at", { ascending: false });
    if (data) setContent(data);
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchContent(); }, []);

  const handleSave = async (item: Partial<ContentItem>) => {
    if (editing) {
      const { error } = await supabase.from("content_items").update({
        title: item.title,
        type: item.type,
        status: item.status,
        link: item.link || null,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
      }).eq("id", editing.id);
      if (!error) { toast({ title: "Content updated" }); fetchContent(); }
    } else {
      const { error } = await supabase.from("content_items").insert({
        title: item.title || "",
        type: item.type || "popup",
        status: item.status || "inactive",
        link: item.link || null,
        start_date: item.start_date || null,
        end_date: item.end_date || null,
      });
      if (!error) { toast({ title: "Content created" }); fetchContent(); }
    }
    setIsDialogOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("content_items").delete().eq("id", id);
    if (!error) { setContent((prev) => prev.filter((c) => c.id !== id)); toast({ title: "Content deleted" }); }
  };

  const handleToggleStatus = async (item: ContentItem) => {
    const newStatus = item.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("content_items").update({ status: newStatus }).eq("id", item.id);
    if (!error) { setContent((prev) => prev.map((c) => c.id === item.id ? { ...c, status: newStatus } : c)); }
  };

  if (showAddProperty) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Add Property</h2>
          <p className="text-sm text-muted-foreground">Add a new property listing to the mobile app</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <AddPropertyForm onSuccess={() => setShowAddProperty(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Content Manager</h2>
          <p className="text-sm text-muted-foreground">Manage pop-ups, banners, stories & announcements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddProperty(true)} className="bg-gold text-primary-foreground hover:bg-gold/80">
            <Building2 className="w-4 h-4 mr-2" /> Add Property
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(v) => { setIsDialogOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-gold text-primary-foreground hover:bg-gold/80"><Plus className="w-4 h-4 mr-2" /> Add Content</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle className="text-foreground">{editing ? "Edit Content" : "New Content"}</DialogTitle></DialogHeader>
              <ContentForm item={editing} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : content.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No content items yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.map((item) => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-gold/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-gold">{typeIcons[item.type] || <AlertCircle className="w-5 h-5" />}</div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                  </div>
                </div>
                <Badge className={`${statusColors[item.status] || ""} border text-xs`}>{item.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{item.start_date || "—"} → {item.end_date || "—"}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm"><Eye className="w-4 h-4 text-muted-foreground" /><span className="text-foreground font-medium">{(item.views || 0).toLocaleString()}</span><span className="text-xs text-muted-foreground">views</span></div>
                <div className="flex items-center gap-1 text-sm"><MousePointerClick className="w-4 h-4 text-muted-foreground" /><span className="text-foreground font-medium">{(item.clicks || 0).toLocaleString()}</span><span className="text-xs text-muted-foreground">clicks</span></div>
                {(item.views || 0) > 0 && <span className="text-xs text-gold">{(((item.clicks || 0) / (item.views || 1)) * 100).toFixed(1)}% CTR</span>}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gold text-xs" onClick={() => handleToggleStatus(item)}>
                  {item.status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs" onClick={() => { setEditing(item); setIsDialogOpen(true); }}>
                  <Edit className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive text-xs ml-auto" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ContentForm = ({ item, onSave }: { item: ContentItem | null; onSave: (c: Partial<ContentItem>) => void }) => {
  const [form, setForm] = useState({
    title: item?.title || "",
    type: item?.type || "popup",
    status: item?.status || "inactive",
    link: item?.link || "",
    start_date: item?.start_date || new Date().toISOString().split("T")[0],
    end_date: item?.end_date || "",
  });

  return (
    <div className="space-y-4">
      <div><Label className="text-muted-foreground">Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-muted-foreground">Type</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="popup">Pop-up</SelectItem><SelectItem value="banner">Banner</SelectItem><SelectItem value="story">Story</SelectItem><SelectItem value="announcement">Announcement</SelectItem></SelectContent>
          </Select>
        </div>
        <div><Label className="text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem></SelectContent>
          </Select>
        </div>
      </div>
      <div><Label className="text-muted-foreground">Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="bg-secondary border-border" placeholder="/offers/..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-muted-foreground">Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground">End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-secondary border-border" /></div>
      </div>
      <Button onClick={() => onSave(form)} className="w-full bg-gold text-primary-foreground hover:bg-gold/80">{item ? "Update" : "Create"}</Button>
    </div>
  );
};

export default ContentManagerPage;
