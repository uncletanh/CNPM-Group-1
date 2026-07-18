import React, { useState } from "react";
import type { AxiosError } from "axios";
import { Bot, Check, Copy, Globe, KeyRound, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

interface Workspace {
  id: number;
  name: string;
  system_prompt?: string;
  widget_token?: string;
  allowed_origin?: string | null;
  widget_primary_color?: string;
  bot_name?: string;
  bot_greeting?: string;
  bot_avatar_url?: string | null;
  widget_position?: "left" | "right";
}

interface BotConfigProps {
  workspaces: Workspace[];
  onWorkspacesChanged?: () => Promise<void> | void;
}

interface ApiErrorBody {
  detail?: string;
}

const DEFAULT_SYSTEM_PROMPT =
  "Bạn là trợ lý ảo của công ty. Chỉ trả lời dựa trên ngữ cảnh được cung cấp. Nếu ngữ cảnh không có thông tin phù hợp, hãy đề nghị khách hàng gặp nhân viên hỗ trợ.";

const getApiErrorDetail = (error: unknown) => {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.detail;
};

const BotConfig: React.FC<BotConfigProps> = ({ workspaces, onWorkspacesChanged }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | "">(
    workspaces.length > 0 ? workspaces[0].id : ""
  );
  const selectedWorkspace =
    selectedWorkspaceId === ""
      ? undefined
      : workspaces.find((workspace) => workspace.id === selectedWorkspaceId);

  const [systemPrompt, setSystemPrompt] = useState(
    selectedWorkspace?.system_prompt || (selectedWorkspace ? DEFAULT_SYSTEM_PROMPT : "")
  );
  const [allowedOrigin, setAllowedOrigin] = useState(selectedWorkspace?.allowed_origin || "");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isSavingOrigin, setIsSavingOrigin] = useState(false);
  const [copied, setCopied] = useState<"token" | "embed" | null>(null);
  const [primaryColor, setPrimaryColor] = useState(selectedWorkspace?.widget_primary_color || "#4f46e5");
  const [botName, setBotName] = useState(selectedWorkspace?.bot_name || "NovaChat AI");
  const [greeting, setGreeting] = useState(selectedWorkspace?.bot_greeting || "Xin chào! Mình có thể giúp gì cho bạn?");
  const [avatarUrl, setAvatarUrl] = useState(selectedWorkspace?.bot_avatar_url || "");
  const [widgetPosition, setWidgetPosition] = useState<"left" | "right">(selectedWorkspace?.widget_position || "right");
  const [isSavingWidget, setIsSavingWidget] = useState(false);

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value === "" ? "" : Number(e.target.value);
    setSelectedWorkspaceId(nextId);
    const workspace = nextId === "" ? undefined : workspaces.find((item) => item.id === nextId);
    setSystemPrompt(workspace?.system_prompt || (workspace ? DEFAULT_SYSTEM_PROMPT : ""));
    setAllowedOrigin(workspace?.allowed_origin || "");
    setPrimaryColor(workspace?.widget_primary_color || "#4f46e5");
    setBotName(workspace?.bot_name || "NovaChat AI");
    setGreeting(workspace?.bot_greeting || "Xin chào! Mình có thể giúp gì cho bạn?");
    setAvatarUrl(workspace?.bot_avatar_url || "");
    setWidgetPosition(workspace?.widget_position || "right");
  };

  const handleSavePrompt = async () => {
    if (!selectedWorkspaceId) return;
    const trimmed = systemPrompt.trim();
    if (trimmed.length < 20) {
      toast.error("System prompt cần ít nhất 20 ký tự.");
      return;
    }
    setIsSavingPrompt(true);
    try {
      await api.put(`/workspaces/${selectedWorkspaceId}/prompt`, { system_prompt: trimmed });
      await onWorkspacesChanged?.();
      toast.success("Đã cập nhật System Prompt.");
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Cập nhật System Prompt thất bại.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleSaveOrigin = async () => {
    if (!selectedWorkspaceId) return;
    setIsSavingOrigin(true);
    try {
      await api.put(`/workspaces/${selectedWorkspaceId}/widget-domain`, {
        allowed_origin: allowedOrigin.trim() || null,
      });
      await onWorkspacesChanged?.();
      toast.success(
        allowedOrigin.trim()
          ? "Đã khóa widget vào domain này."
          : "Đã gỡ khóa domain — widget dùng được ở mọi origin."
      );
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Cập nhật domain thất bại.");
    } finally {
      setIsSavingOrigin(false);
    }
  };

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
  const embedSnippet = selectedWorkspace
    ? `<script src="https://cdn.novachat.ai/script.umd.js"\n        data-workspace-id="${selectedWorkspace.id}"\n        data-widget-token="${selectedWorkspace.widget_token || ""}"\n        data-api-url="${apiBase}"></script>`
    : "";

  const saveWidgetSettings = async () => {
    if (!selectedWorkspaceId) return;
    setIsSavingWidget(true);
    try {
      await api.put(`/workspaces/${selectedWorkspaceId}/widget-settings`, {
        primary_color: primaryColor,
        bot_name: botName,
        greeting,
        avatar_url: avatarUrl.trim() || null,
        position: widgetPosition,
      });
      await onWorkspacesChanged?.();
      toast.success("Đã lưu giao diện Widget.");
    } catch (error) {
      toast.error(getApiErrorDetail(error) || "Không thể lưu giao diện Widget.");
    } finally {
      setIsSavingWidget(false);
    }
  };

  const copyToClipboard = async (text: string, kind: "token" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success("Đã sao chép vào clipboard.");
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Không thể sao chép. Vui lòng copy thủ công.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="flex items-center space-x-2 text-2xl font-bold text-white">
          <Bot className="h-6 w-6 text-indigo-400" />
          <span>Cấu hình Bot AI</span>
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Tùy chỉnh tính cách bot (System Prompt), khóa bảo mật widget và mã nhúng cho website khách hàng.
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
        <label className="mb-2 block text-sm font-semibold text-slate-300">Chọn Workspace</label>
        <select
          className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition-all focus:border-indigo-500 md:w-1/2"
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
        >
          <option value="">-- Vui lòng chọn Workspace --</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name} (ID: #{workspace.id})
            </option>
          ))}
        </select>
      </div>

      {selectedWorkspace && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* System Prompt */}
          <div className="flex flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <span>System Prompt (Tính cách Bot)</span>
            </h3>
            <textarea
              className="min-h-[220px] w-full flex-1 resize-none rounded-xl border border-white/10 bg-slate-950 p-4 text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500"
              placeholder="Nhập system prompt..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Workspace: {selectedWorkspace.name}</span>
              <span>{systemPrompt.trim().length}/4000</span>
            </div>
            <button
              onClick={handleSavePrompt}
              disabled={isSavingPrompt}
              className="mt-4 w-full cursor-pointer rounded-xl bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingPrompt ? "Đang lưu..." : "Lưu System Prompt"}
            </button>
          </div>

          <div className="space-y-8">
            {/* Widget token */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
              <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
                <KeyRound className="h-5 w-5 text-indigo-400" />
                <span>Widget Token</span>
              </h3>
              <p className="mb-3 text-xs text-slate-400">
                Khóa công khai để widget nhúng trên web khách hàng gọi được API chat của workspace này.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-indigo-300">
                  {selectedWorkspace.widget_token}
                </code>
                <button
                  onClick={() => copyToClipboard(selectedWorkspace.widget_token || "", "token")}
                  className="cursor-pointer rounded-xl border border-white/10 bg-slate-800 p-3 text-slate-300 transition-colors hover:bg-slate-700"
                  title="Sao chép token"
                >
                  {copied === "token" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Domain lock */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
              <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
                <span>Khóa Domain (tùy chọn)</span>
              </h3>
              <p className="mb-3 text-xs text-slate-400">
                Nếu điền, widget chỉ hoạt động trên đúng domain này. Để trống = cho phép mọi domain.
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="https://example.com"
                    value={allowedOrigin}
                    onChange={(e) => setAllowedOrigin(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={handleSaveOrigin}
                  disabled={isSavingOrigin}
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSavingOrigin ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>

            {/* Embed code */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center space-x-2 text-lg font-bold text-white">
                  <Copy className="h-5 w-5 text-indigo-400" />
                  <span>Mã nhúng Widget</span>
                </h3>
                <button
                  onClick={() => copyToClipboard(embedSnippet, "embed")}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700"
                >
                  {copied === "embed" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Sao chép</span>
                </button>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300">
                {embedSnippet}
              </pre>
            </div>
          </div>

          <section className="grid gap-6 rounded-lg border border-white/5 bg-slate-900/40 p-6 lg:col-span-2 lg:grid-cols-[1fr_360px]">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-white"><Palette className="h-5 w-5 text-indigo-400" /> Tùy chỉnh Widget</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-400">Tên bot
                  <input value={botName} onChange={(event) => setBotName(event.target.value)} className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
                </label>
                <label className="text-xs font-semibold text-slate-400">Màu chủ đạo
                  <div className="mt-2 flex gap-2">
                    <input type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-10 w-12 cursor-pointer rounded border-0 bg-transparent" />
                    <input value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="min-w-0 flex-1 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />
                  </div>
                </label>
                <label className="text-xs font-semibold text-slate-400 sm:col-span-2">Lời chào
                  <textarea value={greeting} onChange={(event) => setGreeting(event.target.value)} className="mt-2 min-h-20 w-full resize-y rounded-md border border-white/10 bg-slate-950 p-3 text-sm text-white outline-none focus:border-indigo-500" />
                </label>
                <label className="text-xs font-semibold text-slate-400 sm:col-span-2">URL avatar
                  <input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://example.com/avatar.png" className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500" />
                </label>
                <div className="sm:col-span-2">
                  <span className="text-xs font-semibold text-slate-400">Vị trí hiển thị</span>
                  <div className="mt-2 inline-flex rounded-md border border-white/10 bg-slate-950 p-1">
                    {(["left", "right"] as const).map((position) => (
                      <button key={position} onClick={() => setWidgetPosition(position)} className={`rounded px-4 py-2 text-xs font-semibold ${widgetPosition === position ? "bg-indigo-600 text-white" : "text-slate-400"}`}>{position === "left" ? "Bên trái" : "Bên phải"}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={() => void saveWidgetSettings()} disabled={isSavingWidget} className="mt-5 rounded-md bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{isSavingWidget ? "Đang lưu..." : "Lưu giao diện Widget"}</button>
            </div>

            <div className="flex min-h-96 items-end bg-slate-100 p-4" style={{ justifyContent: widgetPosition === "left" ? "flex-start" : "flex-end" }}>
              <div className="w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-lg">
                <div className="flex items-center gap-3 p-4 text-white" style={{ backgroundColor: primaryColor }}>
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"><Bot className="h-5 w-5" /></div>}
                  <div><div className="text-sm font-bold">{botName || "Tên bot"}</div><div className="text-[10px] opacity-80">Trợ lý trực tuyến</div></div>
                </div>
                <div className="min-h-52 bg-slate-50 p-4">
                  <div className="max-w-[85%] rounded-lg bg-white p-3 text-xs leading-5 text-slate-700 shadow-sm">{greeting || "Lời chào của bot"}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default BotConfig;
