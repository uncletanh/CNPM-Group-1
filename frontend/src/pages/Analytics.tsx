import { useEffect, useState } from "react";
import { BarChart3, Bot, MessageSquare, Users, UserRoundCheck } from "lucide-react";
import api from "../services/api";

interface Workspace {
  id: number;
  name: string;
}

interface WorkspaceStats {
  total_sessions: number;
  sessions_by_status: Record<string, number>;
  total_messages: number;
  messages_by_sender: Record<string, number>;
}

interface AnalyticsProps {
  workspaces: Workspace[];
}

const EMPTY_STATS: WorkspaceStats = {
  total_sessions: 0,
  sessions_by_status: {},
  total_messages: 0,
  messages_by_sender: {},
};

const Analytics = ({ workspaces }: AnalyticsProps) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | "">(workspaces[0]?.id ?? "");
  const [stats, setStats] = useState<WorkspaceStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveWorkspaceId = selectedWorkspaceId || workspaces[0]?.id || "";

  useEffect(() => {
    if (effectiveWorkspaceId === "") return;
    let active = true;
    api.get(`/chat/${effectiveWorkspaceId}/stats`)
      .then((response) => active && setStats(response.data))
      .catch(() => active && setError("Không thể tải số liệu của workspace này."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [effectiveWorkspaceId]);

  const botMessages = stats.messages_by_sender.bot || 0;
  const agentMessages = stats.messages_by_sender.agent || 0;
  const userMessages = stats.messages_by_sender.user || 0;
  const resolved = stats.sessions_by_status.resolved || 0;
  const resolvedRate = stats.total_sessions ? Math.round((resolved / stats.total_sessions) * 100) : 0;

  const cards = [
    { label: "Tổng hội thoại", value: stats.total_sessions, icon: Users, color: "text-indigo-400 bg-indigo-500/10" },
    { label: "Tổng tin nhắn", value: stats.total_messages, icon: MessageSquare, color: "text-cyan-400 bg-cyan-500/10" },
    { label: "Bot đã trả lời", value: botMessages, icon: Bot, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "Tỷ lệ đã xử lý", value: `${resolvedRate}%`, icon: UserRoundCheck, color: "text-amber-400 bg-amber-500/10" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold text-white">
            <BarChart3 className="h-7 w-7 text-indigo-400" />
            <span>Thống kê & Báo cáo</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">Theo dõi hoạt động hội thoại theo từng workspace.</p>
        </div>
        <select
          value={effectiveWorkspaceId}
          onChange={(event) => {
            setSelectedWorkspaceId(event.target.value ? Number(event.target.value) : "");
            setLoading(true);
            setError("");
          }}
          className="cursor-pointer rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500"
        >
          {workspaces.length === 0 && <option value="">Chưa có workspace</option>}
          {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
        </select>
      </div>

      {error && <div className="border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
      <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-lg border border-white/5 bg-slate-900/40 p-5">
            <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
            <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="border-t border-white/10 pt-5">
          <h2 className="font-bold text-white">Trạng thái hội thoại</h2>
          <div className="mt-4 space-y-3">
            {[
              ["Bot đang xử lý", stats.sessions_by_status.bot_handling || 0, "bg-emerald-400"],
              ["Nhân viên đang xử lý", stats.sessions_by_status.human_handling || 0, "bg-amber-400"],
              ["Đã hoàn tất", resolved, "bg-indigo-400"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-300"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
                <strong className="text-white">{value}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="border-t border-white/10 pt-5">
          <h2 className="font-bold text-white">Tin nhắn theo người gửi</h2>
          <div className="mt-4 space-y-3">
            {[["Khách hàng", userMessages], ["Bot AI", botMessages], ["Nhân viên", agentMessages]].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between rounded-lg bg-slate-900/40 px-4 py-3">
                <span className="text-sm text-slate-300">{label}</span><strong className="text-white">{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Analytics;
