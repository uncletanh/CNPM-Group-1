import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import api from "../services/api";
import { Toaster } from "react-hot-toast";
import KnowledgeBase from "./KnowledgeBase";
import Omnibox from "./Omnibox";
import BotConfig from "./BotConfig";
import Analytics from "./Analytics";
import SystemSettings from "./SystemSettings";
import WorkspaceManagement from "./WorkspaceManagement";
import {
  LayoutDashboard,
  FolderKanban,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Search,
  Calendar,
  ArrowRight,
  Trash2,
  Sparkles,
  Database,
  Activity,
  Shield,
  ShieldAlert,
  MessagesSquare,
  Menu,
  X
} from "lucide-react";

interface Workspace {
  id: number;
  name: string;
  system_prompt?: string;
  widget_token?: string;
  allowed_origin?: string | null;
  owner_id: number;
}

interface ApiErrorBody {
  detail?: string;
}

const getApiErrorDetail = (error: unknown) => {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.detail;
};

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Các state mở rộng phục vụ giao diện cao cấp
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [userEmail] = useState(() => localStorage.getItem("email") || "admin@novachat.com");
  const [selectedKnowledgeWorkspaceId, setSelectedKnowledgeWorkspaceId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const navigate = useNavigate();

  const fetchWorkspaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/workspaces");
      setWorkspaces(response.data);
    } catch (err: unknown) {
      console.error(err);
      const axiosError = err as AxiosError;
      if (axiosError.response && (axiosError.response.status === 401 || axiosError.response.status === 403)) {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        navigate("/login");
      } else {
        setError("Không thể tải danh sách Không gian làm việc. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const timer = window.setTimeout(() => {
      void fetchWorkspaces();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchWorkspaces, navigate]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      setCreateLoading(true);
      await api.post("/workspaces", { name: newWorkspaceName });
      setNewWorkspaceName("");
      setIsModalOpen(false);
      void fetchWorkspaces();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorDetail(err) || "Đã xảy ra lỗi khi tạo workspace.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteWorkspace = async (id: number) => {
    try {
      setError(null);
      await api.delete(`/workspaces/${id}`);
      setDeleteConfirmId(null);
      void fetchWorkspaces();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorDetail(err) || "Đã xảy ra lỗi khi xóa workspace.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    navigate("/login");
  };

  const selectTab = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  // Lấy lời chào theo thời gian trong ngày
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  // Định dạng ngày hiện tại
  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    return new Date().toLocaleDateString("vi-VN", options);
  };

  // Lọc danh sách workspace theo ô tìm kiếm
  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="novachat-light flex min-h-screen overflow-hidden bg-[#f6f7f9] font-sans text-slate-900">
      <Toaster position="top-right" />

      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
        />
      )}

      {/* 1. Sidebar bên trái (Đóng vai trò điều hướng cao cấp) */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col justify-between border-r border-slate-200 bg-white p-4 shadow-xl transition-transform lg:static lg:translate-x-0 lg:shadow-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div>
          {/* Logo brand */}
          <div className="mb-8 flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="NovaChat Logo" className="h-10 w-10 object-contain" />
            <div>
              <h2 className="text-base font-bold text-slate-900">NovaChat AI</h2>
              <span className="text-[10px] font-bold uppercase text-indigo-600">Workspace Hub</span>
            </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} aria-label="Đóng menu" className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><X className="h-4 w-4" /></button>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <button
              onClick={() => selectTab("dashboard")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Tổng quan</span>
            </button>

            <button
              onClick={() => selectTab("workspaces")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "workspaces"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FolderKanban className="h-4 w-4" />
              <span>Không gian làm việc</span>
            </button>

            <button
              onClick={() => selectTab("bot")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "bot"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>Cấu hình Bot AI</span>
            </button>

            <button
              onClick={() => {
                setSelectedKnowledgeWorkspaceId(null);
                selectTab("knowledge");
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "knowledge"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Quản lý Tri thức</span>
            </button>

            <button
              onClick={() => selectTab("omnibox")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "omnibox"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <MessagesSquare className="h-4 w-4" />
              <span>Hộp thoại</span>
            </button>

            <button
              onClick={() => selectTab("analytics")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "analytics"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Thống kê & Báo cáo</span>
            </button>

            <button
              onClick={() => selectTab("settings")}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                activeTab === "settings"
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Cài đặt hệ thống</span>
            </button>
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold uppercase text-white">
              {userEmail.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-slate-800">{userEmail}</p>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <Shield className="h-3 w-3 text-indigo-600" />
                <span className="text-[10px] font-bold uppercase text-slate-500">Quản trị viên</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center justify-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-y-auto">
        {/* Header bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} aria-label="Mở menu" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"><Menu className="h-4 w-4" /></button>
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
            <Calendar className="h-4 w-4 text-indigo-600" />
            <span>{getFormattedDate()}</span>
          </div>
          </div>

          {/* Search bar */}
          <div className="relative hidden w-72 sm:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm workspace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Inner Content Container */}
        <div className="flex-1 space-y-8 p-4 sm:p-6 lg:p-8">
          {activeTab === 'knowledge' ? (
            <KnowledgeBase
              key={selectedKnowledgeWorkspaceId ?? "manual"}
              workspaces={workspaces}
              initialWorkspaceId={selectedKnowledgeWorkspaceId}
              onWorkspacesChanged={fetchWorkspaces}
            />
          ) : activeTab === 'omnibox' ? (
            <Omnibox workspaces={workspaces} />
          ) : activeTab === 'bot' ? (
            <BotConfig workspaces={workspaces} onWorkspacesChanged={fetchWorkspaces} />
          ) : activeTab === 'analytics' ? (
            <Analytics workspaces={workspaces} />
          ) : activeTab === 'settings' ? (
            <SystemSettings />
          ) : activeTab === 'workspaces' ? (
            <WorkspaceManagement
              workspaces={workspaces}
              loading={loading}
              searchQuery={searchQuery}
              onCreate={() => setIsModalOpen(true)}
              onDelete={setDeleteConfirmId}
              onOpenBotConfig={() => setActiveTab("bot")}
              onOpenKnowledge={(workspaceId) => {
                setSelectedKnowledgeWorkspaceId(workspaceId);
                setActiveTab("knowledge");
              }}
            />
          ) : (
            <>
              {/* Welcome section & create CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center space-x-2">
                <span>{getGreeting()}</span>
                <span className="animate-wave origin-bottom-right">👋</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Quản lý các không gian chatbot của bạn và theo dõi tài nguyên dữ liệu huấn luyện.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-3.5 rounded-xl hover:from-indigo-400 hover:to-violet-500 font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tạo Workspace mới</span>
            </button>
          </div>

          {/* Alert error */}
          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center space-x-2">
              <span className="font-bold">⚠️ Lỗi:</span>
              <span>{error}</span>
            </div>
          )}

          {/* 3. Stats Dashboard Blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Stat Card 1 */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-5 backdrop-blur-md shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tổng Workspace</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FolderKanban className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">{workspaces.length}</div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Đang hoạt động ổn định</p>
            </div>

            {/* Stat Card 2 */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-5 backdrop-blur-md shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trạng thái Bot</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center space-x-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Bot className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">Đang chạy</div>
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">Kết nối API: 100%</p>
            </div>

            {/* Stat Card 3 */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-5 backdrop-blur-md shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Thời gian hoạt động</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">99.98%</div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Hệ thống tối ưu hóa</p>
            </div>

            {/* Stat Card 4 */}
            <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-5 backdrop-blur-md shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cơ sở dữ liệu</span>
                <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
                  <Database className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-white">Kết nối tốt</div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">SQL DB: Đã đồng bộ</p>
            </div>
          </div>

          {/* 4. Workspaces Grid / Content */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FolderKanban className="h-5 w-5 text-indigo-400" />
                <span>Danh sách Không gian làm việc</span>
              </h3>
              <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-3 py-1.5 rounded-full border border-white/5">
                Đang hiển thị {filteredWorkspaces.length} workspace
              </span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-white/5 bg-slate-900/10 backdrop-blur-md">
                <div className="relative flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                  <Bot className="absolute h-5 w-5 text-indigo-400" />
                </div>
                <span className="text-slate-400 text-sm font-medium mt-4">Đang tải dữ liệu workspace...</span>
              </div>
            ) : filteredWorkspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 rounded-2xl border border-dashed border-slate-800 p-8 text-center bg-slate-900/10 backdrop-blur-sm">
                <div className="h-16 w-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-5">
                  <FolderKanban className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Không tìm thấy Workspace nào</h3>
                <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
                  {searchQuery
                    ? "Không tìm thấy workspace phù hợp với từ khóa của bạn. Vui lòng kiểm tra lại."
                    : "Bạn chưa có không gian làm việc nào. Tạo mới ngay để bắt đầu cấu hình chatbot AI của riêng mình!"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tạo Workspace đầu tiên</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="bg-slate-900/30 border border-white/5 rounded-2xl p-6 hover:border-indigo-500/40 hover:bg-slate-900/50 hover:shadow-xl hover:shadow-indigo-500/2 transition-all duration-300 group flex flex-col justify-between min-h-[200px] h-full relative overflow-hidden"
                  >
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/0 group-hover:via-indigo-500/40 transition-all duration-500"></div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-violet-500/10 text-indigo-400 flex items-center justify-center font-bold">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-white/5">
                          ID: #{ws.id}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1">
                        {ws.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Chủ sở hữu: User #{ws.owner_id}
                      </p>
                    </div>

                    {/* Actions panel */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                      <div className="flex items-center space-x-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400"></div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Bot active</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setDeleteConfirmId(ws.id)}
                          className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 transition-colors border border-red-500/5 cursor-pointer"
                          title="Xóa Workspace"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedKnowledgeWorkspaceId(ws.id);
                            setActiveTab("knowledge");
                          }}
                          className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.97] cursor-pointer"
                        >
                          <span>Quản lý</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </main>

      {/* 5. Modal Tạo Workspace */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Tạo Không gian làm việc mới</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Đặt tên mô tả cho không gian làm việc này. Tên giúp bạn dễ phân loại chatbot bán hàng hoặc chăm sóc khách hàng.
            </p>

            <form onSubmit={handleCreateWorkspace} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Tên Workspace
                </label>
                <div className="relative rounded-xl border border-white/10 bg-slate-950 px-4 py-3.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                  <input
                    type="text"
                    placeholder="Ví dụ: Chatbot CSKH"
                    className="w-full bg-transparent text-white placeholder-slate-500 outline-none text-sm"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewWorkspaceName("");
                  }}
                  className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3.5 font-semibold text-sm text-slate-300 transition-all cursor-pointer border border-white/5"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 font-semibold text-sm text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? "Đang tạo..." : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal Xác nhận xóa Workspace (Kính mờ, chuẩn chỉ) */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-slate-900 border border-red-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            {/* Top red warning line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

            <h3 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <span>Xác nhận xóa Workspace?</span>
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Hành động này sẽ xóa vĩnh viễn không gian làm việc này cùng toàn bộ cấu hình chatbot liên quan. Bạn có chắc chắn muốn tiếp tục không?
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 font-semibold text-sm text-slate-300 transition-all cursor-pointer border border-white/5"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => handleDeleteWorkspace(deleteConfirmId)}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-3 font-semibold text-sm text-white shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


