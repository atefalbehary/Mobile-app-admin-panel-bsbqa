import { useState } from "react";
import { api, uploadFile } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface ProjectForm {
  name: string;
  name_ar: string;
  location: string;
  location_ar: string;
  link_360: string;
  country: string;
  end_date: string;
  status: string;
  is_recommended: boolean;
  suggested_apartments: string;
  description: string;
  description_ar: string;
}

interface ProjectImage {
  file: File | null;
  type: string;
}

const defaultForm: ProjectForm = {
  name: "",
  name_ar: "",
  location: "",
  location_ar: "",
  link_360: "",
  country: "",
  end_date: "",
  status: "active",
  is_recommended: false,
  suggested_apartments: "",
  description: "",
  description_ar: "",
};

const countries = [
  "Qatar", "UAE", "Saudi Arabia", "Bahrain", "Kuwait", "Oman",
  "Egypt", "Jordan", "Lebanon", "Turkey", "UK", "USA",
];

const imageTypes = ["Gallery", "Floor Plan", "Master Plan", "Exterior", "Interior", "Amenity"];

const AddProjectForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [form, setForm] = useState<ProjectForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [appImageFile, setAppImageFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(null);
  const [projectImages, setProjectImages] = useState<ProjectImage[]>([{ file: null, type: "" }]);

  const set = (key: keyof ProjectForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const doUpload = async (file: File, folder: string): Promise<string | null> => {
    try {
      return await uploadFile(file, folder);
    } catch {
      toast.error("Upload failed");
      return null;
    }
  };

  const addImageRow = () => {
    setProjectImages((prev) => [...prev, { file: null, type: "" }]);
  };

  const removeImageRow = (index: number) => {
    setProjectImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateImageRow = (index: number, field: "file" | "type", value: any) => {
    setProjectImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, [field]: value } : img))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setSaving(true);

    try {
      // Upload files
      let image_url: string | null = null;
      let app_image_url: string | null = null;
      let banner_url: string | null = null;
      let video_url: string | null = null;
      let video_thumbnail_url: string | null = null;

      if (imageFile) image_url = await doUpload(imageFile, "project-images");
      if (appImageFile) app_image_url = await doUpload(appImageFile, "project-images");
      if (bannerFile) banner_url = await doUpload(bannerFile, "project-banners");
      if (videoFile) video_url = await doUpload(videoFile, "project-videos");
      if (videoThumbnailFile) video_thumbnail_url = await doUpload(videoThumbnailFile, "project-thumbnails");

      const gallery: { image_url: string; image_type: string }[] = [];
      const validImages = projectImages.filter((img) => img.file && img.type);
      for (const img of validImages) {
        if (img.file) {
          const url = await doUpload(img.file, "project-gallery");
          if (url) gallery.push({ image_url: url, image_type: img.type });
        }
      }

      await api("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          name_ar: form.name_ar || null,
          location: form.location || null,
          location_ar: form.location_ar || null,
          link_360: form.link_360 || null,
          country: 0,
          end_date: form.end_date || null,
          suggested_apartments: form.suggested_apartments || null,
          description: form.description || null,
          description_ar: form.description_ar || null,
          image_url,
          app_image_url,
          banner_url,
          video_url,
          video_thumbnail_url,
          gallery,
        }),
      });

      toast.success("Project added successfully!");
      setForm(defaultForm);
      setImageFile(null);
      setAppImageFile(null);
      setBannerFile(null);
      setVideoFile(null);
      setVideoThumbnailFile(null);
      setProjectImages([{ file: null, type: "" }]);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to add project");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Add Project</h3>
        <div className="h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-xs">Name</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="bg-secondary border-border" required />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Name Ar</Label>
          <Input value={form.name_ar} onChange={(e) => set("name_ar", e.target.value)} className="bg-secondary border-border" dir="rtl" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Location</Label>
          <Input value={form.location} onChange={(e) => set("location", e.target.value)} className="bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Location Ar</Label>
          <Input value={form.location_ar} onChange={(e) => set("location_ar", e.target.value)} className="bg-secondary border-border" dir="rtl" />
        </div>
      </div>

      {/* File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-xs">Image</Label>
          <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">App Image</Label>
          <Input type="file" accept="image/*" onChange={(e) => setAppImageFile(e.target.files?.[0] || null)} className="bg-secondary border-border" />
        </div>
      </div>

      <div>
        <Label className="text-muted-foreground text-xs">Banner</Label>
        <Input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="bg-secondary border-border md:w-1/2" />
      </div>

      {/* 360 Link & Country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-xs">360 Link</Label>
          <Input value={form.link_360} onChange={(e) => set("link_360", e.target.value)} className="bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Country</Label>
          <Select value={form.country} onValueChange={(v) => set("country", v)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* End Date & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-xs">Project End Date</Label>
          <Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} className="bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Status</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Is Recommended */}
      <div className="flex items-center gap-2">
        <Checkbox checked={form.is_recommended} onCheckedChange={(v) => set("is_recommended", !!v)} />
        <Label className="text-muted-foreground text-xs">
          Is Recommended <span className="text-[10px]">To Show In Home Page</span>
        </Label>
      </div>

      {/* Suggested Apartments */}
      <div>
        <Label className="text-muted-foreground text-xs">Suggested Apartments</Label>
        <Input value={form.suggested_apartments} onChange={(e) => set("suggested_apartments", e.target.value)} className="bg-secondary border-border" />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Description</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-xs">Description</Label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="bg-secondary border-border min-h-[160px]" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Description Ar</Label>
          <Textarea value={form.description_ar} onChange={(e) => set("description_ar", e.target.value)} className="bg-secondary border-border min-h-[160px]" dir="rtl" />
        </div>
      </div>

      {/* Video */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Video</h3>
        <div className="h-px bg-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-xs">Video</Label>
          <Input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} className="bg-secondary border-border" />
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">Video Thumbnail</Label>
          <Input type="file" accept="image/*" onChange={(e) => setVideoThumbnailFile(e.target.files?.[0] || null)} className="bg-secondary border-border" />
        </div>
      </div>

      {/* Images Section */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">Images</h3>
        <div className="h-px bg-border" />
      </div>

      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 text-xs font-medium text-muted-foreground">
          <span>Image</span>
          <span>Type</span>
          <span>Action</span>
        </div>

        {projectImages.map((img, index) => (
          <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => updateImageRow(index, "file", e.target.files?.[0] || null)}
              className="bg-secondary border-border"
            />
            <Select value={img.type} onValueChange={(v) => updateImageRow(index, "type", v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {imageTypes.map((t) => (
                  <SelectItem key={t} value={t.toLowerCase().replace(" ", "_")}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {index === projectImages.length - 1 ? (
                <Button type="button" size="icon" className="bg-gold text-primary-foreground hover:bg-gold-dark h-9 w-9" onClick={addImageRow}>
                  <Plus className="w-4 h-4" />
                </Button>
              ) : (
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => removeImageRow(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={saving} className="bg-gold text-primary-foreground hover:bg-gold-dark">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
            </>
          ) : (
            "Submit"
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onSuccess}>
          Back
        </Button>
      </div>
    </form>
  );
};

export default AddProjectForm;
