import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/workspaces");
      setWorkspaces(response.data);
    } catch (err: any) {
      console.error(err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError("Không thể tải danh sách Không gian làm việc.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchWorkspaces();
  }, [navigate]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreateLoading(true);
      await api.post("/workspaces", { name: newWorkspaceName });
      setNewWorkspaceName("");
      setIsModalOpen(false);
      fetchWorkspaces();
    } catch (err: any) {
      console.error(err);
      alert("Đã xảy ra lỗi khi tạo Workspace.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-6">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/30">
              N
            </div>
            <h2 className="text-xl font-bold tracking-wider text-white">NovaChat AI</h2>
          </div>
          
          <nav className="space-y-2">
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-indigo-600/10 text-indigo-400 font-medium">
              <span>🏠</span>
              <span>Dashboard</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer">
              <span>📂</span>
              <span>Workspaces</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all cursor-pointer">
              <span>🤖</span>
              <span>Bot Config</span>
            </div>
          </nav>
        </div>

        {/* User / Logout */}
        <div className="border-t border-slate-800 pt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium transition-all"
          >
            <span>🚪</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Không gian làm việc
            </h1>
            <p className="text-slate-400 text-sm">
              Quản lý các Workspace và cấu hình chatbot của bạn
            </p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-500 font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
          >
            <span>➕</span>
            <span>Tạo Workspace</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            Đang tải dữ liệu...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/30">
            <span className="text-4xl mb-4">📂</span>
            <h3 className="text-lg font-semibold text-white mb-2">Không có Workspace nào</h3>
            <p className="text-slate-400 max-w-sm mb-6">
              Bạn chưa tạo không gian làm việc nào. Tạo mới ngay để bắt đầu thiết lập chatbot AI!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-500 font-semibold transition-all"
            >
              Tạo Workspace đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-lg bg-indigo-600/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
                    📁
                  </div>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full font-medium">
                    ID: {ws.id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors mb-2">
                  {ws.name}
                </h3>
                <p className="text-slate-400 text-sm">
                  Chủ sở hữu: User #{ws.owner_id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tạo Workspace */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2">Tạo Workspace mới</h3>
            <p className="text-slate-400 text-sm mb-6">
              Nhập tên không gian làm việc mới. Tên này giúp bạn phân biệt các bot chăm sóc khách hàng.
            </p>
            
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Tên Workspace
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: NovaChat Bán Hàng"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewWorkspaceName("");
                  }}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 font-semibold text-slate-300 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {createLoading ? "Đang tạo..." : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

