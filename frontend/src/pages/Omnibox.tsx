import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AxiosError } from "axios";
import {
  Bot,
  Bell,
  CheckCircle2,
  Hand,
  Inbox,
  MessagesSquare,
  RefreshCw,
  Send,
  User,
  UserCog,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

interface Workspace {
  id: number;
  name: string;
}

interface ChatSession {
  id: number;
  session_key: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number;
  sender: string; // 'user' | 'bot' | 'agent'
  content: string;
  created_at: string;
}

interface OmniboxProps {
  workspaces: Workspace[];
}

interface ApiErrorBody {
  detail?: string;
}

const getApiErrorDetail = (error: unknown) => {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.detail;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  bot_handling: { label: "Bot phụ trách", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  waiting_human: { label: "Đang chờ Agent", className: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  human_handling: { label: "Nhân viên", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  resolved: { label: "Đã xử lý", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

const SESSION_POLL_MS = 5000;
const MESSAGE_POLL_MS = 3000;

const formatTime = (iso: string) => {
  const d = new Date(iso + (iso.endsWith("Z") ? "" : "Z"));
  return d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
};

const Omnibox: React.FC<OmniboxProps> = ({ workspaces }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | "">(
    workspaces.length > 0 ? workspaces[0].id : ""
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) || null;

  useEffect(() => {
    if (selectedWorkspaceId !== "" || workspaces.length === 0) return;
    const timer = window.setTimeout(() => setSelectedWorkspaceId(workspaces[0].id), 0);
    return () => window.clearTimeout(timer);
  }, [selectedWorkspaceId, workspaces]);

  const fetchSessions = useCallback(async () => {
    if (selectedWorkspaceId === "") return;
    try {
      const res = await api.get(`/chat/${selectedWorkspaceId}/sessions`);
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedWorkspaceId]);

  const fetchMessages = useCallback(async () => {
    if (selectedWorkspaceId === "" || selectedSessionId === null) return;
    try {
      const res = await api.get(`/chat/${selectedWorkspaceId}/sessions/${selectedSessionId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [selectedWorkspaceId, selectedSessionId]);

  const enableNotifications = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    audioContextRef.current ??= new AudioContext();
    await audioContextRef.current.resume();
    setNotificationsEnabled(true);
    toast.success("Đã bật thông báo hội thoại mới.");
  };

  const notifyHandoff = useCallback(() => {
    if (!notificationsEnabled) return;
    const audio = audioContextRef.current;
    if (audio) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.frequency.value = 760;
      gain.gain.setValueAtTime(0.12, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.35);
    }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("NovaChat: khách cần hỗ trợ", {
        body: "Có hội thoại mới đang chờ Agent tiếp nhận.",
      });
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    if (selectedWorkspaceId === "") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
    const wsBase = apiBase.replace(/^http/, "ws");
    const params = new URLSearchParams({ role: "agent", token });
    const socket = new WebSocket(`${wsBase}/chat/${selectedWorkspaceId}/ws?${params}`);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { type?: string; session_id?: number };
      void fetchSessions();
      if (payload.session_id === selectedSessionId) void fetchMessages();
      if (payload.type === "handoff_requested") notifyHandoff();
    };
    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send("ping");
    }, 25000);
    return () => {
      window.clearInterval(heartbeat);
      socket.close();
    };
  }, [selectedWorkspaceId, selectedSessionId, fetchSessions, fetchMessages, notifyHandoff]);

  // Tải + tự làm mới danh sách hội thoại
  useEffect(() => {
    if (selectedWorkspaceId === "") return;
    const initialTimer = window.setTimeout(() => {
      setLoadingSessions(true);
      void fetchSessions().finally(() => setLoadingSessions(false));
    }, 0);
    const timer = window.setInterval(() => void fetchSessions(), SESSION_POLL_MS);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [selectedWorkspaceId, fetchSessions]);

  // Tự làm mới tin nhắn của hội thoại đang mở
  useEffect(() => {
    if (selectedSessionId === null) return;
    const initialTimer = window.setTimeout(() => void fetchMessages(), 0);
    const timer = window.setInterval(() => void fetchMessages(), MESSAGE_POLL_MS);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [selectedSessionId, fetchMessages]);

  // Chi tu keo xuong cuoi khi dang gan day (hoac vua mo hoi thoai) - truoc day
  // effect nay chay vo dieu kien theo [messages], ma messages doi reference moi
  // sau MOI lan poll (3s) du noi dung khong doi, nen keo giat khung ve cuoi lien
  // tuc dù Agent dang cuon len doc tin cu.
  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [selectedSessionId]);

  const handleMessageListScroll = () => {
    const el = messageListRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 80;
  };

  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleTakeover = async () => {
    if (!selectedSession) return;
    try {
      await api.post(`/chat/${selectedWorkspaceId}/sessions/${selectedSession.id}/takeover`);
      toast.success("Bạn đã tiếp quản hội thoại này.");
      await fetchSessions();
      await fetchMessages();
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Không thể tiếp quản hội thoại.");
    }
  };

  const handleResolve = async () => {
    if (!selectedSession) return;
    try {
      await api.post(`/chat/${selectedWorkspaceId}/sessions/${selectedSession.id}/resolve`);
      toast.success("Đã đánh dấu hội thoại là đã xử lý.");
      await fetchSessions();
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Không thể đóng hội thoại.");
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession || isSendingReply) return;
    setIsSendingReply(true);
    try {
      await api.post(`/chat/${selectedWorkspaceId}/sessions/${selectedSession.id}/reply`, {
        content: replyText.trim(),
      });
      setReplyText("");
      await fetchMessages();
      await fetchSessions();
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Không thể gửi phản hồi.");
    } finally {
      setIsSendingReply(false);
    }
  };

  const isHuman = selectedSession?.status === "human_handling";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center space-x-2">
            <MessagesSquare className="h-7 w-7 text-indigo-400" />
            <span>Hộp thoại (Omnibox)</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Theo dõi các cuộc hội thoại của khách hàng và tiếp quản khi cần hỗ trợ trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void enableNotifications()}
            className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
              notificationsEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-white/10 bg-slate-900 text-slate-400 hover:text-indigo-400"
            }`}
            title="Bật âm thanh và thông báo"
          >
            <Bell className="h-4 w-4" />
          </button>
          <select
            value={selectedWorkspaceId}
            onChange={(e) => {
              setSelectedWorkspaceId(e.target.value === "" ? "" : Number(e.target.value));
              setSelectedSessionId(null);
              setMessages([]);
              setSessions([]);
            }}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 cursor-pointer"
          >
            {workspaces.length === 0 && <option value="">Chưa có workspace</option>}
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => void fetchSessions()}
            className="p-2.5 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-260px)] min-h-[520px]">
        {/* Session list */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm font-bold text-white">Hội thoại</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-1 rounded-full font-semibold">
              {sessions.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingSessions && sessions.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">Đang tải...</div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2 px-4 text-center">
                <Inbox className="h-8 w-8 opacity-50" />
                <span>Chưa có cuộc hội thoại nào.</span>
              </div>
            ) : (
              sessions.map((session) => {
                const meta = STATUS_META[session.status] || STATUS_META.bot_handling;
                const active = session.id === selectedSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors cursor-pointer ${
                      active ? "bg-indigo-500/10 border-l-2 border-l-indigo-500" : "hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-white">Khách #{session.id}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${meta.className}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{session.session_key.slice(0, 16)}…</div>
                    <div className="text-[10px] text-slate-500 mt-1">{formatTime(session.updated_at)}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="lg:col-span-2 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md overflow-hidden flex flex-col">
          {!selectedSession ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
              <MessagesSquare className="h-12 w-12 opacity-40" />
              <span className="text-sm">Chọn một cuộc hội thoại để xem chi tiết.</span>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-white">Khách #{selectedSession.id}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedSession.session_key}</div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSession.status !== "human_handling" ? (
                    <button
                      onClick={handleTakeover}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/20 transition-all active:scale-[0.97] cursor-pointer"
                    >
                      <Hand className="h-3.5 w-3.5" />
                      <span>Tiếp quản</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleResolve}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs border border-emerald-500/20 transition-all active:scale-[0.97] cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Đã xử lý</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div
                ref={messageListRef}
                onScroll={handleMessageListScroll}
                className="flex-1 overflow-y-auto p-5 space-y-4"
              >
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  const isAgent = msg.sender === "agent";
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
                      <div className={`flex items-end max-w-[75%] gap-2 ${isUser ? "" : "flex-row-reverse"}`}>
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            isUser
                              ? "bg-slate-700 text-slate-300"
                              : isAgent
                                ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                                : "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                          }`}
                        >
                          {isUser ? <User className="h-4 w-4" /> : isAgent ? <UserCog className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div>
                          <div
                            className={`p-3 rounded-2xl text-sm ${
                              isUser
                                ? "bg-slate-800 text-slate-200 rounded-bl-none"
                                : isAgent
                                  ? "bg-amber-500/15 text-amber-100 border border-amber-500/20 rounded-br-none"
                                  : "bg-indigo-600 text-white rounded-br-none"
                            }`}
                          >
                            {isUser || isAgent ? msg.content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
                          </div>
                          <div className={`text-[9px] text-slate-500 mt-1 ${isUser ? "text-left" : "text-right"}`}>
                            {isAgent ? "Nhân viên" : isUser ? "Khách" : "Bot"} · {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="p-4 border-t border-white/5">
                {isHuman ? (
                  <form onSubmit={handleSendReply} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Nhập phản hồi gửi khách hàng..."
                      className="flex-1 rounded-xl bg-slate-950 border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSendingReply}
                      className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                ) : (
                  <div className="text-center text-xs text-slate-500 py-2">
                    Nhấn <span className="text-amber-400 font-semibold">Tiếp quản</span> để trả lời khách hàng trực tiếp.
                    {selectedSession.status === "waiting_human" && " Khách đang chờ nhân viên hỗ trợ."}
                    {selectedSession.status === "bot_handling" && " Hiện Bot đang tự động phụ trách."}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Omnibox;
