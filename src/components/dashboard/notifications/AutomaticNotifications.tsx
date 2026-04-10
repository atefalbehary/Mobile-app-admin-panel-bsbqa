import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Bell, CalendarCheck, UserCheck, DollarSign, BookOpen,
  XCircle, CreditCard, Building2, Rocket, Pencil, Clock, Plus,
} from "lucide-react";
import { format } from "date-fns";

// ==========================================
// Automatic Notifications - Rule management
// Shows all system notification rules with
// enable/disable toggles, template editing,
// and ability to create new custom rules
// ==========================================

interface NotificationRule {
  id: string;
  trigger_type: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  audience: string;
  delivery_channel: string;
  template_title: string | null;
  template_title_ar: string | null;
  template_body: string | null;
  template_body_ar: string | null;
  last_triggered_at: string | null;
  trigger_count: number;
  created_at: string;
}

// ==========================================
// Trigger type icons mapping
// ==========================================
const triggerIcons: Record<string, React.ReactNode> = {
  new_property: <Building2 className="w-5 h-5" />,
  visit_reminder: <CalendarCheck className="w-5 h-5" />,
  account_approved: <UserCheck className="w-5 h-5" />,
  price_update: <DollarSign className="w-5 h-5" />,
  booking_confirmed: <BookOpen className="w-5 h-5" />,
  booking_cancelled: <XCircle className="w-5 h-5" />,
  payment_due: <CreditCard className="w-5 h-5" />,
  property_status_changed: <Bell className="w-5 h-5" />,
  new_project_launch: <Rocket className="w-5 h-5" />,
  client_registered: <UserCheck className="w-5 h-5" />,
};

// ==========================================
// Available trigger types for new rules
// ==========================================
const triggerTypeOptions = [
  { value: "visit_reminder", label: "Visit Reminder" },
  { value: "new_property", label: "New Property Added" },
  { value: "account_approved", label: "Account Approved" },
  { value: "price_update", label: "Price Update" },
  { value: "booking_confirmed", label: "Booking Confirmed" },
  { value: "booking_cancelled", label: "Booking Cancelled" },
  { value: "payment_due", label: "Payment Due" },
  { value: "property_status_changed", label: "Property Status Changed" },
  { value: "new_project_launch", label: "New Project Launch" },
  { value: "client_registered", label: "Client Registered" },
];

// ==========================================
// Audience options with multi-select support
// ==========================================
const audienceOptions = [
  { value: "all", label: "All Users" },
  { value: "agents", label: "Agents" },
  { value: "agencies", label: "Agencies" },
  { value: "clients", label: "Clients / End Users" },
  { value: "agent_and_client", label: "Agent & Client" },
];

const deliveryChannelOptions = [
  { value: "push", label: "Push Notification" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "in_app", label: "In-App" },
];

// ==========================================
// Empty form state for creating new rules
// ==========================================
const emptyCreateForm = {
  name: "",
  trigger_type: "visit_reminder",
  description: "",
  audience: "agent_and_client",
  delivery_channel: "push",
  template_title: "",
  template_title_ar: "",
  template_body: "",
  template_body_ar: "",
  is_enabled: true,
};

const AutomaticNotifications = () => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit template dialog state
  const [editRule, setEditRule] = useState<NotificationRule | null>(null);
  const [editForm, setEditForm] = useState({
    template_title: "", template_title_ar: "",
    template_body: "", template_body_ar: "",
  });

  // Create new rule dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyCreateForm });
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  // ==========================================
  // Fetch all notification rules from DB
  // ==========================================
  const fetchRules = async () => {
    setLoading(true);
    try {
      const data = await api<NotificationRule[]>("/api/notification-rules");
      setRules(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  // ==========================================
  // Toggle rule enabled/disabled
  // ==========================================
  const toggleRule = async (rule: NotificationRule) => {
    try {
      await api("/api/notification-rules/" + rule.id, {
        method: "PATCH",
        body: JSON.stringify({ is_enabled: !rule.is_enabled }),
      });
      setRules((prev) => prev.map((r) => (r.id === rule.id ? { ...r, is_enabled: !r.is_enabled } : r)));
      toast({ title: `${rule.name} ${!rule.is_enabled ? "enabled" : "disabled"}` });
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  // ==========================================
  // Open edit template dialog
  // ==========================================
  const openEdit = (rule: NotificationRule) => {
    setEditRule(rule);
    setEditForm({
      template_title: rule.template_title || "",
      template_title_ar: rule.template_title_ar || "",
      template_body: rule.template_body || "",
      template_body_ar: rule.template_body_ar || "",
    });
  };

  // ==========================================
  // Save template changes
  // ==========================================
  const saveTemplate = async () => {
    if (!editRule) return;
    try {
      await api("/api/notification-rules/" + editRule.id, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });
      setRules((prev) => prev.map((r) => (r.id === editRule.id ? { ...r, ...editForm } : r)));
      toast({ title: "Template updated" });
      setEditRule(null);
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  // ==========================================
  // Create a new automatic notification rule
  // ==========================================
  const handleCreateRule = async () => {
    if (!createForm.name.trim()) {
      toast({ title: "Rule name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await api("/api/notification-rules", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name,
          trigger_type: createForm.trigger_type,
          description: createForm.description || null,
          audience: createForm.audience,
          delivery_channel: createForm.delivery_channel,
          template_title: createForm.template_title || null,
          template_title_ar: createForm.template_title_ar || null,
          template_body: createForm.template_body || null,
          template_body_ar: createForm.template_body_ar || null,
          is_enabled: createForm.is_enabled,
        }),
      });
      toast({ title: "Rule created successfully" });
      setShowCreate(false);
      setCreateForm({ ...emptyCreateForm });
      fetchRules();
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to create rule", variant: "destructive" });
    }
    setSaving(false);
  };

  // ==========================================
  // Delete a rule
  // ==========================================
  const deleteRule = async (rule: NotificationRule) => {
    try {
      await api("/api/notification-rules/" + rule.id, { method: "DELETE" });
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      toast({ title: `"${rule.name}" deleted` });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Zap className="w-5 h-5 text-gold" /> Automatic Notification Rules
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            System-generated notifications triggered by events. Enable/disable rules and customize templates.
          </p>
        </div>
        <Button
          onClick={() => { setCreateForm({ ...emptyCreateForm }); setShowCreate(true); }}
          className="bg-gold text-primary-foreground hover:bg-gold/80 shrink-0"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" /> New Rule
        </Button>
      </div>

      {/* Rules grid */}
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading rules...</p>
      ) : rules.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No rules yet. Create your first rule above.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={toggleRule}
              onEdit={openEdit}
              onDelete={deleteRule}
            />
          ))}
        </div>
      )}

      {/* ==========================================
          Create New Rule Dialog
          ========================================== */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-gold" /> Create Automatic Notification Rule
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Rule Name *</Label>
              <Input
                placeholder="e.g. Visit Reminder After Client Registration"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>

            {/* Trigger Type */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Trigger Type</Label>
              <Select
                value={createForm.trigger_type}
                onValueChange={(v) => setCreateForm({ ...createForm, trigger_type: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Description</Label>
              <Textarea
                placeholder="Describe when this rule triggers..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="bg-secondary border-border"
                rows={2}
              />
            </div>

            {/* Audience */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Send To (Audience)</Label>
              <Select
                value={createForm.audience}
                onValueChange={(v) => setCreateForm({ ...createForm, audience: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {audienceOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Channel */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Delivery Channel</Label>
              <Select
                value={createForm.delivery_channel}
                onValueChange={(v) => setCreateForm({ ...createForm, delivery_channel: v })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deliveryChannelOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enabled toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-sm">Enable immediately</Label>
              <Switch
                checked={createForm.is_enabled}
                onCheckedChange={(v) => setCreateForm({ ...createForm, is_enabled: v })}
                className="data-[state=checked]:bg-emerald-500"
              />
            </div>

            {/* Template fields */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">Notification Template</p>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Title (EN)</Label>
                <Input
                  placeholder="Visit Reminder"
                  value={createForm.template_title}
                  onChange={(e) => setCreateForm({ ...createForm, template_title: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Title (AR)</Label>
                <Input
                  placeholder="تذكير بالزيارة"
                  value={createForm.template_title_ar}
                  onChange={(e) => setCreateForm({ ...createForm, template_title_ar: e.target.value })}
                  className="bg-secondary border-border text-right" dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Body (EN)</Label>
                <Textarea
                  placeholder="You have a scheduled visit tomorrow for {{project_name}}..."
                  value={createForm.template_body}
                  onChange={(e) => setCreateForm({ ...createForm, template_body: e.target.value })}
                  className="bg-secondary border-border" rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Body (AR)</Label>
                <Textarea
                  placeholder="لديك زيارة مجدولة غداً لـ {{project_name}}..."
                  value={createForm.template_body_ar}
                  onChange={(e) => setCreateForm({ ...createForm, template_body_ar: e.target.value })}
                  className="bg-secondary border-border text-right" dir="rtl" rows={3}
                />
              </div>
            </div>

            <Button
              onClick={handleCreateRule}
              disabled={saving}
              className="w-full bg-gold text-primary-foreground hover:bg-gold/80"
            >
              {saving ? "Creating..." : "Create Rule"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==========================================
          Edit Template Dialog
          ========================================== */}
      <Dialog open={!!editRule} onOpenChange={(open) => !open && setEditRule(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Edit Template — {editRule?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Title (EN)</Label>
              <Input value={editForm.template_title} onChange={(e) => setEditForm({ ...editForm, template_title: e.target.value })} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Title (AR)</Label>
              <Input value={editForm.template_title_ar} onChange={(e) => setEditForm({ ...editForm, template_title_ar: e.target.value })} className="bg-secondary border-border text-right" dir="rtl" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Body (EN)</Label>
              <Textarea value={editForm.template_body} onChange={(e) => setEditForm({ ...editForm, template_body: e.target.value })} className="bg-secondary border-border" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Body (AR)</Label>
              <Textarea value={editForm.template_body_ar} onChange={(e) => setEditForm({ ...editForm, template_body_ar: e.target.value })} className="bg-secondary border-border text-right" dir="rtl" rows={3} />
            </div>
            <Button onClick={saveTemplate} className="w-full bg-gold text-primary-foreground hover:bg-gold/80">
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==========================================
// RuleCard - Individual rule display card
// ==========================================
interface RuleCardProps {
  rule: NotificationRule;
  onToggle: (rule: NotificationRule) => void;
  onEdit: (rule: NotificationRule) => void;
  onDelete: (rule: NotificationRule) => void;
}

const RuleCard = ({ rule, onToggle, onEdit, onDelete }: RuleCardProps) => (
  <div
    className={`bg-card border rounded-xl p-5 space-y-3 transition-all ${
      rule.is_enabled ? "border-gold/30" : "border-border opacity-60"
    }`}
  >
    {/* Top row: icon + name + toggle */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
          rule.is_enabled ? "bg-gold/20 text-gold" : "bg-muted text-muted-foreground"
        }`}>
          {triggerIcons[rule.trigger_type] || <Bell className="w-5 h-5" />}
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{rule.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rule.description}</p>
        </div>
      </div>
      <Switch
        checked={rule.is_enabled}
        onCheckedChange={() => onToggle(rule)}
        className="data-[state=checked]:bg-emerald-500 shrink-0"
      />
    </div>

    {/* Info badges */}
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="text-xs border-border">
        {rule.delivery_channel}
      </Badge>
      <Badge variant="outline" className="text-xs border-border capitalize">
        {rule.audience.replace(/_/g, " & ")}
      </Badge>
      <Badge
        className={`text-xs border ${
          rule.is_enabled
            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            : "bg-muted text-muted-foreground border-border"
        }`}
      >
        {rule.is_enabled ? "Enabled" : "Disabled"}
      </Badge>
    </div>

    {/* Stats */}
    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
      <div className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {rule.last_triggered_at
          ? format(new Date(rule.last_triggered_at), "dd MMM yyyy HH:mm")
          : "Never triggered"}
      </div>
      <span className="font-medium text-foreground">{rule.trigger_count} sent</span>
    </div>

    {/* Action buttons */}
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex-1 border-border text-sm"
        onClick={() => onEdit(rule)}
      >
        <Pencil className="w-3 h-3 mr-2" /> Edit Template
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="border-destructive/50 text-destructive hover:bg-destructive/10 text-sm"
        onClick={() => onDelete(rule)}
      >
        <XCircle className="w-3 h-3" />
      </Button>
    </div>
  </div>
);

export default AutomaticNotifications;
