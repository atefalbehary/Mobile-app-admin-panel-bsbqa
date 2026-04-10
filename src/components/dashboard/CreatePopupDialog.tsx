import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, uploadFile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface CreatePopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePopupDialog = ({ open, onOpenChange }: CreatePopupDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "popup",
    status: "active",
    link: "",
    cta_text: "Register Now",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      type: "popup",
      status: "active",
      link: "",
      cta_text: "Register Now",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
    });
    setImagePreview(null);
    setImageUrl(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const url = await uploadFile(file, "content-images");
      setImageUrl(url);
      toast({ title: "Image uploaded" });
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
    setUploading(false);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await api("/api/content-items", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          status: form.status,
          link: form.link || null,
          image_url: imageUrl || null,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
        }),
      });
      toast({ title: "Pop-up created successfully!" });
      resetForm();
      onOpenChange(false);
    } catch (err: unknown) {
      toast({
        title: "Failed to create pop-up",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create Pop-up</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload */}
          <div>
            <Label className="text-muted-foreground">Pop-up Image</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            {imagePreview ? (
              <div className="relative mt-2 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-background/80 rounded-full p-1 hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
                {uploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 w-full h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-gold/50 transition-colors text-muted-foreground hover:text-gold"
              >
                <Upload className="w-8 h-8" />
                <span className="text-sm">Click to upload image</span>
                <span className="text-xs">JPG, PNG, WebP supported</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <Label className="text-muted-foreground">Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-secondary border-border"
              placeholder="e.g. Bin Al Sheikh Skyline Towers Exclusive EOI"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-secondary border-border"
              placeholder="e.g. Join us for our exclusive EOI Skyline event..."
              rows={3}
            />
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="popup">Pop-up</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CTA Text */}
          <div>
            <Label className="text-muted-foreground">Button Text (CTA)</Label>
            <Input
              value={form.cta_text}
              onChange={(e) => setForm({ ...form, cta_text: e.target.value })}
              className="bg-secondary border-border"
              placeholder="Register Now"
            />
          </div>

          {/* Link */}
          <div>
            <Label className="text-muted-foreground">Link (optional)</Label>
            <Input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              className="bg-secondary border-border"
              placeholder="https://..."
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div>
              <Label className="text-muted-foreground">End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="bg-secondary border-border" />
            </div>
          </div>

          {/* Preview */}
          {(imagePreview || form.title) && (
            <div>
              <Label className="text-muted-foreground mb-2 block">Mobile Preview</Label>
              <div className="relative w-48 mx-auto rounded-2xl overflow-hidden border border-border bg-black shadow-lg">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-72 object-cover" />
                ) : (
                  <div className="w-full h-72 bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-16">
                  <p className="text-white text-sm font-bold leading-tight">{form.title || "Pop-up Title"}</p>
                  {form.description && <p className="text-white/70 text-[10px] mt-1 line-clamp-2">{form.description}</p>}
                  <div className="mt-2 bg-gold/90 text-center py-1.5 rounded-md text-xs font-semibold text-primary-foreground">
                    {form.cta_text || "Register Now"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full bg-gold text-primary-foreground hover:bg-gold/80"
          >
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Pop-up"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePopupDialog;
