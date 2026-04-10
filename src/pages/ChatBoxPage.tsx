import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Send, Plus, Search, MessageSquare, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: string;
  receiver_id: string | null;
  message: string;
  created_at: string;
}

interface ConversationSummary {
  user_id: string;
  user_name: string;
  user_type: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  user_type: string;
  agency_name: string | null;
}

const ChatBoxPage = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState<{ name: string; type: string } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: adminUser } = useAuth();
  const adminUserId = adminUser?.id ?? null;
  const [activeTab, setActiveTab] = useState<string>("conversations");
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchConversations = useCallback(async () => {
    let allMessages: ChatMessage[] = [];
    try {
      allMessages = await api<ChatMessage[]>("/api/chat/messages");
      allMessages = [...allMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (e) {
      console.error("Error fetching messages:", e);
      setLoading(false);
      return;
    }
    const userMap = new Map<string, ConversationSummary>();

    allMessages.forEach((msg) => {
      let userId: string;
      let userName: string;
      let userType: string;

      if (msg.sender_type !== "admin") {
        userId = msg.sender_id;
        userName = msg.sender_name;
        userType = msg.sender_type;
      } else if (msg.receiver_id) {
        userId = msg.receiver_id;
        const existing = userMap.get(msg.receiver_id);
        userName = existing?.user_name || "User";
        userType = existing?.user_type || "user";
      } else {
        return;
      }

      if (!userMap.has(userId)) {
        userMap.set(userId, {
          user_id: userId,
          user_name: userName,
          user_type: userType,
          last_message: msg.message,
          last_message_time: msg.created_at,
          unread_count: msg.sender_type !== "admin" ? 1 : 0,
        });
      } else {
        const existing = userMap.get(userId)!;
        if (msg.sender_type !== "admin" && existing.user_name === "User") {
          existing.user_name = userName;
          existing.user_type = userType;
        }
      }
    });

    const convList = Array.from(userMap.values());
    convList.sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime());

    setConversations(convList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch all users for "New Chat" tab
  const fetchAllUsers = useCallback(async () => {
    if (allUsers.length > 0) return; // already loaded
    setUsersLoading(true);
    try {
      const data = await api<UserProfile[]>("/api/profiles/all-users");
      setAllUsers((data || []).filter((u) => u.user_id !== adminUserId));
    } catch {
      setAllUsers([]);
    }
    setUsersLoading(false);
  }, [adminUserId, allUsers.length]);

  useEffect(() => {
    if (activeTab === "users" && adminUserId) {
      fetchAllUsers();
    }
  }, [activeTab, adminUserId, fetchAllUsers]);

  const fetchMessages = useCallback(async (userId: string) => {
    try {
      const all = await api<ChatMessage[]>("/api/chat/messages");
      const thread = (all || [])
        .filter(
          (m) =>
            m.sender_id === userId ||
            m.receiver_id === userId ||
            (m.sender_type === "admin" && m.receiver_id === userId)
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(thread);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId) fetchMessages(selectedUserId);
  }, [selectedUserId, fetchMessages]);

  useEffect(() => {
    const id = window.setInterval(() => {
      fetchConversations();
      if (selectedUserId) fetchMessages(selectedUserId);
    }, 4000);
    return () => window.clearInterval(id);
  }, [selectedUserId, fetchConversations, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || !adminUserId) return;

    try {
      await api("/api/chat/messages", {
        method: "POST",
        body: JSON.stringify({
          sender_id: adminUserId,
          sender_name: "Admin Support",
          sender_type: "admin",
          receiver_id: selectedUserId,
          message: newMessage.trim(),
        }),
      });
      setNewMessage("");
      fetchMessages(selectedUserId);
      fetchConversations();
    } catch (err: unknown) {
      toast({ title: "Failed to send", description: err instanceof Error ? err.message : "", variant: "destructive" });
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUserId(user.user_id);
    setSelectedUserInfo({ name: user.name, type: user.user_type });
    setActiveTab("conversations");
  };

  const handleSelectConversation = (conv: ConversationSummary) => {
    setSelectedUserId(conv.user_id);
    setSelectedUserInfo({ name: conv.user_name, type: conv.user_type });
  };

  const selectedConv = conversations.find((c) => c.user_id === selectedUserId);
  const displayName = selectedUserInfo?.name || (selectedConv?.user_name !== "User" ? selectedConv?.user_name : null) || selectedConv?.user_name || "User";
  const displayType = selectedUserInfo?.type || selectedConv?.user_type || "user";
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Filter users by search
  const filteredUsers = allUsers.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.agency_name && u.agency_name.toLowerCase().includes(userSearch.toLowerCase()))
  );

  // Group users by type
  const usersByType = {
    user: filteredUsers.filter(u => u.user_type === "user"),
    agent: filteredUsers.filter(u => u.user_type === "agent"),
    agency: filteredUsers.filter(u => u.user_type === "agency"),
  };

  const getUserTypeBadgeColor = (type: string) => {
    switch (type) {
      case "agent": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "agency": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          {selectedUserId ? "Chat" : "Chat Box"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {selectedUserId ? `Conversation with ${displayName}` : "Manage conversations and messages"}
        </p>
      </div>
      <div className="bg-card border border-border rounded-xl p-4">
        {selectedUserId ? (
          <div className="flex flex-col h-[calc(100vh-220px)] lg:h-[calc(100vh-200px)]">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => { setSelectedUserId(null); setSelectedUserInfo(null); }}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9 bg-gold/20 border border-gold/30">
                <AvatarFallback className="bg-gold/20 text-gold font-semibold text-sm">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{displayName}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{displayType}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Send the first message!</p>
              )}
              {messages.map((msg) => {
                const isAdmin = msg.sender_type === "admin";
                return (
                  <div key={msg.id} className={cn("flex", isAdmin ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-xl px-4 py-2.5",
                      isAdmin
                        ? "bg-gold text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-foreground rounded-bl-sm"
                    )}>
                      <p className="text-sm">{msg.message}</p>
                      <p className={cn("text-[10px] mt-1", isAdmin ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {format(new Date(msg.created_at), "hh:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-border">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button size="icon" className="bg-gold hover:bg-gold/90 shrink-0" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Tabs: Conversations / All Users */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="conversations" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Conversations
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  New Chat
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {activeTab === "conversations" ? (
              <div className="space-y-1">
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading conversations...</p>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 space-y-3">
                    <p className="text-muted-foreground">No conversations yet.</p>
                    <Button variant="outline" className="gap-2" onClick={() => setActiveTab("users")}>
                      <Plus className="h-4 w-4" />
                      Start a new chat
                    </Button>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user_id}
                      onClick={() => handleSelectConversation(conv)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className="relative">
                        <Avatar className="h-11 w-11 bg-gold/20 border border-gold/30">
                          <AvatarFallback className="bg-gold/20 text-gold font-semibold text-sm">
                            {getInitials(conv.user_name)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.unread_count > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-destructive border-background border-2">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-foreground">{conv.user_name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {format(new Date(conv.last_message_time), "hh:mm a")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users by name, email, or agency..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {usersLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                ) : (
                  <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto">
                    {/* Agents */}
                    {usersByType.agent.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Agents ({usersByType.agent.length})</p>
                        <div className="space-y-1">
                          {usersByType.agent.map((user) => (
                            <button
                              key={user.user_id}
                              onClick={() => handleSelectUser(user)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                            >
                              <Avatar className="h-10 w-10 bg-blue-500/10 border border-blue-500/20">
                                <AvatarFallback className="bg-blue-500/10 text-blue-400 font-semibold text-sm">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-foreground">{user.name}</span>
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", getUserTypeBadgeColor(user.user_type))}>
                                    {user.user_type}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                {user.agency_name && (
                                  <p className="text-[11px] text-muted-foreground/70 truncate">{user.agency_name}</p>
                                )}
                              </div>
                              <Send className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agencies */}
                    {usersByType.agency.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Agencies ({usersByType.agency.length})</p>
                        <div className="space-y-1">
                          {usersByType.agency.map((user) => (
                            <button
                              key={user.user_id}
                              onClick={() => handleSelectUser(user)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                            >
                              <Avatar className="h-10 w-10 bg-purple-500/10 border border-purple-500/20">
                                <AvatarFallback className="bg-purple-500/10 text-purple-400 font-semibold text-sm">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-foreground">{user.name}</span>
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", getUserTypeBadgeColor(user.user_type))}>
                                    {user.user_type}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                              <Send className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Users */}
                    {usersByType.user.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Users ({usersByType.user.length})</p>
                        <div className="space-y-1">
                          {usersByType.user.map((user) => (
                            <button
                              key={user.user_id}
                              onClick={() => handleSelectUser(user)}
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                            >
                              <Avatar className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20">
                                <AvatarFallback className="bg-emerald-500/10 text-emerald-400 font-semibold text-sm">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-foreground">{user.name}</span>
                                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", getUserTypeBadgeColor(user.user_type))}>
                                    {user.user_type}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                              </div>
                              <Send className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBoxPage;
