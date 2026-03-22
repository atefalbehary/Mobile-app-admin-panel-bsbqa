import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Upload, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PropertyType {
  id: string;
  name: string;
  name_ar: string | null;
  image_url: string | null;
  unit_count: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const PropertyTypesPage = () => {
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PropertyType | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [unitCount, setUnitCount] = useState(0);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("property_types" as any)
      .select("*")
      .order("display_order", { ascending: true });
    if (error) toast.error(error.message);
    else setTypes((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchTypes(); }, []);

  const resetForm = () => {
    setName(""); setNameAr(""); setUnitCount(0); setDisplayOrder(0);
    setIsActive(true); setImageFile(null); setImagePreview(null); setEditing(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (t: PropertyType) => {
    setEditing(t); setName(t.name); setNameAr(t.name_ar || "");
    setUnitCount(t.unit_count); setDisplayOrder(t.display_order);
    setIsActive(t.is_active); setImagePreview(t.image_url); setImageFile(null);
    setDialogOpen(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `property-types/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("content-images").upload(path, file);
    if (error) { toast.error(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from("content-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      let image_url = editing?.image_url || null;
      if (imageFile) {
        image_url = await uploadImage(imageFile);
        if (!image_url && imageFile) { setSaving(false); return; }
      }

      const payload = { name, name_ar: nameAr || null, image_url, unit_count: unitCount, display_order: displayOrder, is_active: isActive };

      if (editing) {
        const { error } = await (supabase.from("property_types" as any) as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Property type updated!");
      } else {
        const { error } = await (supabase.from("property_types" as any) as any).insert(payload);
        if (error) throw error;
        toast.success("Property type created!");
      }
      setDialogOpen(false);
      resetForm();
      fetchTypes();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this property type?")) return;
    const { error } = await (supabase.from("property_types" as any) as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchTypes(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Property Types</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage property categories for "Units That Fit Your Vibe" slider</p>
        </div>
        <Button onClick={openCreate} className="bg-gold text-primary-foreground hover:bg-gold/90">
          <Plus className="w-4 h-4 mr-2" /> Add Type
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : types.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p>No property types yet. Click "Add Type" to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {types.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-xl overflow-hidden group">
              <div className="relative aspect-[4/3] bg-secondary">
                {t.image_url ? (
                  <img src={t.image_url} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Upload className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="font-semibold text-lg">{t.name}</p>
                  <p className="text-sm text-white/80">{t.unit_count} units</p>
                </div>
                {!t.is_active && (
                  <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded">Inactive</span>
                )}
              </div>
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GripVertical className="w-3 h-3" /> Order: {t.display_order}
                  {t.name_ar && <span className="ml-2">| {t.name_ar}</span>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Property Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground text-xs">Image</Label>
              <div
                className="mt-1 border-2 border-dashed border-border rounded-xl aspect-video flex items-center justify-center cursor-pointer hover:border-gold/50 transition-colors overflow-hidden relative"
                onClick={() => document.getElementById("pt-image-input")?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Upload className="w-8 h-8 mx-auto mb-1" />
                    <p className="text-xs">Click to upload image</p>
                  </div>
                )}
              </div>
              <input id="pt-image-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Name (EN)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" required />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Name (AR)</Label>
                <Input value={nameAr} onChange={e => setNameAr(e.target.value)} className="bg-secondary border-border" dir="rtl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Unit Count</Label>
                <Input type="number" value={unitCount} onChange={e => setUnitCount(Number(e.target.value))} className="bg-secondary border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Display Order</Label>
                <Input type="number" value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-sm">Active</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gold text-primary-foreground hover:bg-gold/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editing ? "Update" : "Create"} Property Type
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyTypesPage;
