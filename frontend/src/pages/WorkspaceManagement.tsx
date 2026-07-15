import { useState } from "react";
import { ArrowRight, Bot, Copy, FolderKanban, Plus, Settings2, Trash2, UserPlus, Users, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

interface Workspace {
  id: number;
  name: string;
  owner_id: number;
}

interface WorkspaceManagementProps {
  workspaces: Workspace[];
  loading: boolean;
  searchQuery: string;
  onCreate: () => void;
  onDelete: (id: number) => void;
  onOpenKnowledge: (id: number) => void;
  onOpenBotConfig: () => void;
}

interface WorkspaceMember {
  user_id: number;
  email: string;
  role: "admin" | "agent";
  is_owner: boolean;
}

interface WorkspaceInvitation {
  id: number;
  email: string;
  role: "admin" | "agent";
  token: string;
  status: string;
}

const WorkspaceManagement = ({
  workspaces,
  loading,
  searchQuery,
  onCreate,
  onDelete,
  onOpenKnowledge,
  onOpenBotConfig,
}: WorkspaceManagementProps) => {
  const [memberWorkspace, setMemberWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "agent">("agent");
  const [isInviting, setIsInviting] = useState(false);

  const loadMembers = async (workspace: Workspace) => {
    try {
      const [membersResponse, invitationsResponse] = await Promise.all([
        api.get(`/workspaces/${workspace.id}/members`),
        api.get(`/workspaces/${workspace.id}/invitations`),
      ]);
      setMembers(membersResponse.data);
      setInvitations(invitationsResponse.data);
      setMemberWorkspace(workspace);
    } catch {
      toast.error("Bạn cần quyền Admin để quản lý thành viên workspace.");
    }
  };

  const inviteMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!memberWorkspace || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      const response = await api.post(`/workspaces/${memberWorkspace.id}/invitations`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInvitations((current) => [response.data, ...current]);
      setInviteEmail("");
      toast.success("Đã tạo lời mời thành viên.");
    } catch {
      toast.error("Không thể tạo lời mời. Email có thể đã là thành viên.");
    } finally {
      setIsInviting(false);
    }
  };

  const copyInvitation = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/login?invite=${token}`);
    toast.success("Đã sao chép liên kết lời mời.");
  };

  const removeMember = async (userId: number) => {
    if (!memberWorkspace) return;
    await api.delete(`/workspaces/${memberWorkspace.id}/members/${userId}`);
    setMembers((current) => current.filter((member) => member.user_id !== userId));
    toast.success("Đã xóa thành viên khỏi workspace.");
  };
  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-extrabold text-white">
            <FolderKanban className="h-7 w-7 text-indigo-400" />
            <span>Không gian làm việc</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Tạo và quản lý từng chatbot, dữ liệu tri thức và cấu hình vận hành.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo workspace</span>
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <span className="text-sm font-semibold text-slate-300">Danh sách workspace</span>
        <span className="text-xs text-slate-500">{filteredWorkspaces.length} kết quả</span>
      </div>

      {loading ? (
        <div className="flex min-h-72 items-center justify-center text-sm text-slate-400">Đang tải dữ liệu...</div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-slate-800 px-6 text-center">
          <FolderKanban className="mb-4 h-10 w-10 text-slate-600" />
          <h2 className="font-bold text-white">Không tìm thấy workspace</h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {searchQuery ? "Hãy thử một từ khóa khác." : "Tạo workspace đầu tiên để bắt đầu cấu hình chatbot."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredWorkspaces.map((workspace) => (
            <article key={workspace.id} className="rounded-lg border border-white/5 bg-slate-900/40 p-5 transition-colors hover:border-indigo-500/30">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Bot className="h-5 w-5" />
                </div>
                <button
                  onClick={() => onDelete(workspace.id)}
                  title="Xóa workspace"
                  className="cursor-pointer rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h2 className="mt-4 truncate text-lg font-bold text-white">{workspace.name}</h2>
              <p className="mt-1 text-xs text-slate-500">Workspace #{workspace.id} · Chủ sở hữu #{workspace.owner_id}</p>
              <div className="mt-5 flex gap-2 border-t border-white/5 pt-4">
                <button
                  onClick={onOpenBotConfig}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Cấu hình Bot
                </button>
                <button
                  onClick={() => onOpenKnowledge(workspace.id)}
                  className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                >
                  Tri thức
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => void loadMembers(workspace)}
                  title="Quản lý thành viên"
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700"
                >
                  <Users className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {memberWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Thành viên workspace</h2>
                <p className="mt-1 text-sm text-slate-500">{memberWorkspace.name}</p>
              </div>
              <button onClick={() => setMemberWorkspace(null)} title="Đóng" className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={inviteMember} className="mt-6 grid gap-3 border-y border-slate-200 py-5 sm:grid-cols-[1fr_120px_auto]">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="agent@company.com"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as "admin" | "agent")} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
              <button disabled={isInviting} className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                <UserPlus className="h-4 w-4" />
                Mời
              </button>
            </form>

            <div className="mt-5 space-y-2">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between border-b border-slate-100 py-3">
                  <div>
                    <div className="text-sm font-semibold">{member.email}</div>
                    <div className="text-xs text-slate-500">{member.is_owner ? "Chủ sở hữu" : member.role === "admin" ? "Admin" : "Agent"}</div>
                  </div>
                  {!member.is_owner && (
                    <button onClick={() => void removeMember(member.user_id)} title="Xóa thành viên" className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {invitations.some((invitation) => invitation.status === "pending") && (
              <div className="mt-6">
                <h3 className="text-sm font-bold">Lời mời đang chờ</h3>
                {invitations.filter((invitation) => invitation.status === "pending").map((invitation) => (
                  <div key={invitation.id} className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <div className="text-xs text-slate-600">{invitation.email} · {invitation.role}</div>
                    <button onClick={() => void copyInvitation(invitation.token)} title="Sao chép liên kết" className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManagement;
