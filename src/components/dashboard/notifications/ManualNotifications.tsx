import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Send, CalendarClock, Save, Rocket } from "lucide-react";

interface ManualNotificationsProps {
  onSent: () => void;
}

type SubTab = "send_now" | "schedule";

const ManualNotifications = ({ onSent }: ManualNotificationsProps) => {
  const { toast } = useToast();
  const [subTab, setSubTab] = useState<SubTab>("send_now");
  const [form, setForm] = useState({
    title: "",
    title_ar: "",
    body: "",
    body_ar: "",
    type: "push",
    target: "all",
    specific_emails: "",
    deep_link: "",
    scheduled_date: "",
    scheduled_time: "",
  });
  const [sending, setSending] = useState(false);

  const parseSpecificEmails = (value: string) =>
    value
      .split(/[,\n]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
  const isEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const parsedSpecificEmails = parseSpecificEmails(form.specific_emails);
  const hasValidSpecificEmails =
    parsedSpecificEmails.length > 0 && parsedSpecificEmails.every((email) => isEmail(email));

  const isValid =
    form.title.trim().length > 0 &&
    (form.target !== "specific_email" || hasValidSpecificEmails);
  const isScheduleValid = isValid && form.scheduled_date && form.scheduled_time;

  const resetForm = () => {
    setForm({ title: "", title_ar: "", body: "", body_ar: "", type: "push", target: "all", specific_emails: "", deep_link: "", scheduled_date: "", scheduled_time: "" });
  };

  const handleSendNow = async () => {
    if (!isValid) {
      toast({ title: "Please complete required fields", description: "Enter title and valid target emails.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await api("/api/push-campaigns", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          title_ar: form.title_ar || null,
          body: form.body || null,
          body_ar: form.body_ar || null,
          type: form.type,
          target: form.target,
          specific_emails: form.target === "specific_email" ? parsedSpecificEmails : [],
          status: "sent",
          source_type: "manual",
          trigger_type: "manual_campaign",
          delivery_channel: form.type,
          deep_link: form.deep_link || null,
          sent_at: new Date().toISOString(),
          recipient_count: 0,
          send_email_also: true,
        }),
      });
      toast({ title: "Notification sent!" });
      resetForm();
      onSent();
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
    setSending(false);
  };

  const handleSchedule = async () => {
    if (!isScheduleValid) {
      toast({ title: "Title, date and time are required", variant: "destructive" });
      return;
    }
    setSending(true);
    const scheduledAt = new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString();
    try {
      await api("/api/push-campaigns", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          title_ar: form.title_ar || null,
          body: form.body || null,
          body_ar: form.body_ar || null,
          type: form.type,
          target: form.target,
          specific_emails: form.target === "specific_email" ? parsedSpecificEmails : [],
          status: "scheduled",
          source_type: "manual",
          trigger_type: "manual_campaign",
          delivery_channel: form.type,
          deep_link: form.deep_link || null,
          scheduled_at: scheduledAt,
          recipient_count: 0,
          send_email_also: true,
        }),
      });
      toast({ title: "Notification scheduled!" });
      resetForm();
      onSent();
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
    setSending(false);
  };

  const handleSaveDraft = async () => {
    setSending(true);
    try {
      await api("/api/push-campaigns", {
        method: "POST",
        body: JSON.stringify({
          title: form.title || "Untitled Draft",
          title_ar: form.title_ar || null,
          body: form.body || null,
          body_ar: form.body_ar || null,
          type: form.type,
          target: form.target,
          specific_emails: form.target === "specific_email" ? parsedSpecificEmails : [],
          status: "draft",
          source_type: "manual",
          trigger_type: "manual_campaign",
          delivery_channel: form.type,
          deep_link: form.deep_link || null,
          recipient_count: 0,
        }),
      });
      toast({ title: "Saved as draft" });
      resetForm();
      onSent();
    } catch (err: unknown) {
      toast({ title: "Failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-foreground">Create Manual Notification</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Send instantly or schedule for later. Supports bilingual content (EN/AR).
        </p>
      </div>

      {/* Sub-tabs: Send Now / Schedule */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          size="sm"
          variant={subTab === "send_now" ? "default" : "outline"}
          className={subTab === "send_now" ? "bg-gold text-primary-foreground hover:bg-gold/80" : "border-border"}
          onClick={() => setSubTab("send_now")}
        >
          <Rocket className="w-4 h-4 mr-1.5" />
          Send Now
        </Button>
        <Button
          size="sm"
          variant={subTab === "schedule" ? "default" : "outline"}
          className={subTab === "schedule" ? "bg-gold text-primary-foreground hover:bg-gold/80" : "border-border"}
          onClick={() => setSubTab("schedule")}
        >
          <CalendarClock className="w-4 h-4 mr-1.5" />
          Schedule
        </Button>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Title fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Title (EN) <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Enter notification title..."
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Title (AR)</Label>
            <Input
              value={form.title_ar}
              onChange={(e) => setForm({ ...form, title_ar: e.target.value })}
              placeholder="أدخل عنوان الإشعار..."
              className="bg-secondary border-border text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Body fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Body (EN)</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Enter notification body..."
              className="bg-secondary border-border"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Body (AR)</Label>
            <Textarea
              value={form.body_ar}
              onChange={(e) => setForm({ ...form, body_ar: e.target.value })}
              placeholder="أدخل نص الإشعار..."
              className="bg-secondary border-border text-right"
              dir="rtl"
              rows={4}
            />
          </div>
        </div>

        {/* Channel & Audience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Notification Channel</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="push">Push Notification</SelectItem>
                <SelectItem value="in_app">In-App</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">Send To (Audience)</Label>
            <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="agents">Agents Only</SelectItem>
                <SelectItem value="agencies">Agencies Only</SelectItem>
                <SelectItem value="approved">Approved Users</SelectItem>
                <SelectItem value="specific_email">Specific Email(s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.target === "specific_email" && (
          <div className="space-y-2">
            <Label className="text-muted-foreground text-sm">
              Recipient Email(s) <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={form.specific_emails}
              onChange={(e) => setForm({ ...form, specific_emails: e.target.value })}
              placeholder="Enter one or more emails, separated by comma or new line"
              className="bg-secondary border-border"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Example: user1@example.com, user2@example.com
            </p>
          </div>
        )}

        {/* Deep Link */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-sm">Deep Link / URL (optional)</Label>
          <Input
            value={form.deep_link}
            onChange={(e) => setForm({ ...form, deep_link: e.target.value })}
            placeholder="e.g. /properties/123 or https://example.com/page"
            className="bg-secondary border-border"
          />
          <p className="text-xs text-muted-foreground">
            Tapping the notification in the app will navigate to this URL or screen.
          </p>
        </div>

        {/* Schedule fields — only on Schedule tab */}
        {subTab === "schedule" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Schedule Date <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Schedule Time <span className="text-destructive">*</span></Label>
                <Input
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            {form.scheduled_date && form.scheduled_time && (
              <div className="flex items-center gap-2 text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
                <CalendarClock className="w-4 h-4" />
                <span>Will be sent on {form.scheduled_date} at {form.scheduled_time}</span>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {subTab === "send_now" ? (
            <Button
              onClick={handleSendNow}
              disabled={sending || !isValid}
              className="flex-1 bg-gold text-primary-foreground hover:bg-gold/80"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Now
            </Button>
          ) : (
            <Button
              onClick={handleSchedule}
              disabled={sending || !isScheduleValid}
              className="flex-1 bg-gold text-primary-foreground hover:bg-gold/80"
            >
              <CalendarClock className="w-4 h-4 mr-2" />
              Schedule Notification
            </Button>
          )}
          <Button
            onClick={handleSaveDraft}
            disabled={sending}
            variant="outline"
            className="border-border"
          >
            <Save className="w-4 h-4 mr-2" /> Save as Draft
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManualNotifications;
