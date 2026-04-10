import { useState, useEffect } from "react";
import { api, uploadFile } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

const PropertyTypeSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api<{ id: string; name: string; is_active: boolean }[]>("/api/property-types")
      .then((data) => {
        const active = (data || []).filter((t) => t.is_active);
        if (active.length > 0) setTypes(active.map((t) => ({ id: t.id, name: t.name })));
        else
          setTypes([
            { id: "apartment", name: "Apartment" }, { id: "villa", name: "Villa" },
            { id: "office", name: "Office" }, { id: "land", name: "Land" },
            { id: "penthouse", name: "Penthouse" }, { id: "townhouse", name: "Townhouse" },
            { id: "studio", name: "Studio" },
          ]);
      })
      .catch(() =>
        setTypes([
          { id: "apartment", name: "Apartment" }, { id: "villa", name: "Villa" },
          { id: "office", name: "Office" }, { id: "land", name: "Land" },
          { id: "penthouse", name: "Penthouse" }, { id: "townhouse", name: "Townhouse" },
          { id: "studio", name: "Studio" },
        ])
      );
  }, []);
  return (
    <div>
      <Label className="text-muted-foreground text-xs">Property Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
        <SelectContent className="bg-card border-border">
          {types.map(t => <SelectItem key={t.id} value={t.name.toLowerCase()}>{t.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
};

interface PropertyForm {
  name: string;
  name_ar: string;
  location: string;
  location_ar: string;
  price: number;
  project: string;
  bedroom_count: number;
  bathroom_count: number;
  gross_area: number;
  balcony_size: number;
  net_area: number;
  location_google_map_embed_link: string;
  sale_type: string;
  property_type: string;
  status: string;
  unit_number: string;
  floor_number: string;
  is_recommended: boolean;
  is_featured: boolean;
  mark_as_sold: boolean;
  similar_properties: string;
  display_order: number;
  description: string;
  description_ar: string;
  amenities: string;
  video_youtube_embed_link: string;
  link_360: string;
  meta_title: string;
  meta_title_ar: string;
  meta_description: string;
  meta_description_ar: string;
  currency: string;
  whatsapp_number: string;
}

const defaultForm: PropertyForm = {
  name: "", name_ar: "", location: "", location_ar: "",
  price: 0, project: "", bedroom_count: 0, bathroom_count: 0,
  gross_area: 0, balcony_size: 0, net_area: 0,
  location_google_map_embed_link: "", sale_type: "sale",
  property_type: "apartment", status: "active",
  unit_number: "", floor_number: "",
  is_recommended: false, is_featured: false, mark_as_sold: false,
  similar_properties: "", display_order: 0,
  description: "", description_ar: "", amenities: "",
  video_youtube_embed_link: "", link_360: "",
  meta_title: "", meta_title_ar: "",
  meta_description: "", meta_description_ar: "", currency: "QAR",
  whatsapp_number: "",
};

const AddPropertyForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState<PropertyForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    unit_layout: null, brochure: null, floor_plan: null, images: null,
  });
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  const set = (key: keyof PropertyForm, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const doUpload = async (file: File, folder: string): Promise<string | null> => {
    try {
      return await uploadFile(file, folder);
    } catch {
      toast.error("Upload failed");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Property name is required"); return; }
    setSaving(true);

    try {
      // Upload file assets
      let unit_layout_url: string | null = null;
      let brochure_url: string | null = null;
      let floor_plan_url: string | null = null;

      if (files.unit_layout) unit_layout_url = await doUpload(files.unit_layout, "unit-layouts");
      if (files.brochure) brochure_url = await doUpload(files.brochure, "brochures");
      if (files.floor_plan) floor_plan_url = await doUpload(files.floor_plan, "floor-plans");

      const image_urls: string[] = [];
      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          const url = await doUpload(imageFiles[i], "property-images");
          if (url) image_urls.push(url);
        }
      }

      await api("/api/properties", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          name_ar: form.name_ar || null,
          location: form.location || null,
          location_ar: form.location_ar || null,
          price: form.price,
          project: form.project || null,
          bedroom_count: form.bedroom_count,
          bathroom_count: form.bathroom_count,
          gross_area: form.gross_area,
          balcony_size: form.balcony_size,
          net_area: form.net_area,
          location_google_map_embed_link: form.location_google_map_embed_link || null,
          sale_type: form.sale_type,
          property_type: form.property_type,
          status: form.status,
          unit_number: form.unit_number || null,
          floor_number: form.floor_number || null,
          is_recommended: form.is_recommended,
          is_featured: form.is_featured,
          mark_as_sold: form.mark_as_sold,
          similar_properties: form.similar_properties || null,
          display_order: form.display_order,
          description: form.description || null,
          description_ar: form.description_ar || null,
          amenities: form.amenities || null,
          unit_layout_url,
          brochure_url,
          floor_plan_url,
          video_youtube_embed_link: form.video_youtube_embed_link || null,
          link_360: form.link_360 || null,
          meta_title: form.meta_title || null,
          meta_title_ar: form.meta_title_ar || null,
          meta_description: form.meta_description || null,
          meta_description_ar: form.meta_description_ar || null,
          currency: form.currency,
          whatsapp_number: form.whatsapp_number || null,
          image_urls,
        }),
      });

      toast.success("Property added successfully!");
      setForm(defaultForm);
      setFiles({ unit_layout: null, brochure: null, floor_plan: null, images: null });
      setImageFiles(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to add property");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-muted-foreground text-xs">Name</Label><Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-secondary border-border" required /></div>
        <div><Label className="text-muted-foreground text-xs">Name Ar</Label><Input value={form.name_ar} onChange={e => set("name_ar", e.target.value)} className="bg-secondary border-border" dir="rtl" /></div>
        <div><Label className="text-muted-foreground text-xs">Location</Label><Input value={form.location} onChange={e => set("location", e.target.value)} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Location Ar</Label><Input value={form.location_ar} onChange={e => set("location_ar", e.target.value)} className="bg-secondary border-border" dir="rtl" /></div>
        <div><Label className="text-muted-foreground text-xs">WhatsApp Number</Label><Input value={form.whatsapp_number} onChange={e => set("whatsapp_number", e.target.value)} className="bg-secondary border-border" placeholder="+974 XXXX XXXX" /></div>
        <div><Label className="text-muted-foreground text-xs">Price</Label><Input type="number" value={form.price} onChange={e => set("price", Number(e.target.value))} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Project</Label>
          <Select value={form.project} onValueChange={v => set("project", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="none">None</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Dimensions & Layout</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div><Label className="text-muted-foreground text-xs">Bedroom Count</Label><Input type="number" value={form.bedroom_count} onChange={e => set("bedroom_count", Number(e.target.value))} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Bathroom Count</Label><Input type="number" value={form.bathroom_count} onChange={e => set("bathroom_count", Number(e.target.value))} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Gross Area</Label><Input type="number" value={form.gross_area} onChange={e => set("gross_area", Number(e.target.value))} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Balcony Size</Label><Input type="number" value={form.balcony_size} onChange={e => set("balcony_size", Number(e.target.value))} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Net Area</Label><Input type="number" value={form.net_area} onChange={e => set("net_area", Number(e.target.value))} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Unit Number</Label><Input value={form.unit_number} onChange={e => set("unit_number", e.target.value)} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Floor Number</Label><Input value={form.floor_number} onChange={e => set("floor_number", e.target.value)} className="bg-secondary border-border" /></div>
      </div>

      {/* Map & Type */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Classification</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-muted-foreground text-xs">Location Google Map Embed Link</Label><Input value={form.location_google_map_embed_link} onChange={e => set("location_google_map_embed_link", e.target.value)} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Sale Type</Label>
          <Select value={form.sale_type} onValueChange={v => set("sale_type", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="sale">Sale</SelectItem><SelectItem value="rent">Rent</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent>
          </Select>
        </div>
        <PropertyTypeSelect value={form.property_type} onChange={v => set("property_type", v)} />
        <div><Label className="text-muted-foreground text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set("status", v)}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border"><SelectItem value="active">Active</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="sold">Sold</SelectItem><SelectItem value="rented">Rented</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      {/* Flags */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <Checkbox checked={form.is_recommended} onCheckedChange={v => set("is_recommended", !!v)} />
          <Label className="text-muted-foreground text-xs">Is Recommended <span className="text-[10px] block">To Show In Home Page</span></Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={form.mark_as_sold} onCheckedChange={v => set("mark_as_sold", !!v)} />
          <Label className="text-muted-foreground text-xs">Mark as Sold</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={form.is_featured} onCheckedChange={v => set("is_featured", !!v)} />
          <Label className="text-muted-foreground text-xs">Is Featured <span className="text-[10px] block">To Highlight in Listings</span></Label>
        </div>
        <div><Label className="text-muted-foreground text-xs">Display Order</Label><Input type="number" value={form.display_order} onChange={e => set("display_order", Number(e.target.value))} className="bg-secondary border-border" /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-muted-foreground text-xs">Similar Properties</Label><Input value={form.similar_properties} onChange={e => set("similar_properties", e.target.value)} placeholder="Select properties that are similar to this one" className="bg-secondary border-border" /></div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Description</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-muted-foreground text-xs">Description</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} className="bg-secondary border-border min-h-[120px]" /></div>
        <div><Label className="text-muted-foreground text-xs">Description Ar</Label><Textarea value={form.description_ar} onChange={e => set("description_ar", e.target.value)} className="bg-secondary border-border min-h-[120px]" dir="rtl" /></div>
      </div>

      {/* Media & Files */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Media & Files</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-muted-foreground text-xs">Amenities</Label><Input value={form.amenities} onChange={e => set("amenities", e.target.value)} className="bg-secondary border-border" /></div>
        <div>
          <Label className="text-muted-foreground text-xs">Brochure</Label>
          <div className="relative">
            <Input type="file" accept=".pdf,.doc,.docx" onChange={e => setFiles(f => ({ ...f, brochure: e.target.files?.[0] || null }))} className="bg-secondary border-border" />
          </div>
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Unit Layout</Label>
          <Input type="file" accept="image/*,.pdf" onChange={e => setFiles(f => ({ ...f, unit_layout: e.target.files?.[0] || null }))} className="bg-secondary border-border" />
        </div>
        <div><Label className="text-muted-foreground text-xs">Video Youtube Embed Link</Label><Input value={form.video_youtube_embed_link} onChange={e => set("video_youtube_embed_link", e.target.value)} className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">360 Link</Label><Input value={form.link_360} onChange={e => set("link_360", e.target.value)} className="bg-secondary border-border" /></div>
        <div>
          <Label className="text-muted-foreground text-xs">Floor Plan</Label>
          <Input type="file" accept="image/*,.pdf" onChange={e => setFiles(f => ({ ...f, floor_plan: e.target.files?.[0] || null }))} className="bg-secondary border-border" />
        </div>
      </div>

      {/* SEO */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">SEO / Meta</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label className="text-muted-foreground text-xs">Meta Title</Label><Input value={form.meta_title} onChange={e => set("meta_title", e.target.value)} placeholder="Meta Title" className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Meta Title Ar</Label><Input value={form.meta_title_ar} onChange={e => set("meta_title_ar", e.target.value)} placeholder="Meta Title Arabic" className="bg-secondary border-border" dir="rtl" /></div>
        <div><Label className="text-muted-foreground text-xs">Meta Description</Label><Textarea value={form.meta_description} onChange={e => set("meta_description", e.target.value)} placeholder="Meta Description" className="bg-secondary border-border" /></div>
        <div><Label className="text-muted-foreground text-xs">Meta Description Ar</Label><Textarea value={form.meta_description_ar} onChange={e => set("meta_description_ar", e.target.value)} placeholder="Meta Description Arabic" className="bg-secondary border-border" dir="rtl" /></div>
      </div>

      {/* Property Images */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Property Images</h3>
        <div className="h-px bg-border" />
      </div>
      <div>
        <Label className="text-muted-foreground text-xs">Property Images (gif, jpg, png, jpeg)</Label>
        <Input type="file" accept=".gif,.jpg,.png,.jpeg" multiple onChange={e => setImageFiles(e.target.files)} className="bg-secondary border-border" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving} className="bg-gold text-primary-foreground hover:bg-gold-dark">
          {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Submit"}
        </Button>
        <Button type="button" variant="secondary" onClick={onSuccess}>Back</Button>
      </div>
    </form>
  );
};

export default AddPropertyForm;
