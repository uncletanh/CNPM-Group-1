import { ArrowRight, Bot, FolderKanban, Plus, Settings2, Trash2 } from "lucide-react";

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

const WorkspaceManagement = ({
  workspaces,
  loading,
  searchQuery,
  onCreate,
  onDelete,
  onOpenKnowledge,
  onOpenBotConfig,
}: WorkspaceManagementProps) => {
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
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspaceManagement;
