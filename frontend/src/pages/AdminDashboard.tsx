import { useCallback, useEffect, useState } from "react";
import { KeyRound, Plus, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

interface LicenseKeyRow {
  id: number;
  key: string;
  status: "AVAILABLE" | "USED" | "REVOKED";
  used_by_user_id: number | null;
  used_by_email: string | null;
  used_at: string | null;
  created_at: string;
}

interface AdminUserRow {
  id: number;
  email: string;
  role: string;
  plan: "FREE" | "PRO";
  is_active: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/10 text-emerald-400",
  USED: "bg-indigo-500/10 text-indigo-400",
  REVOKED: "bg-red-500/10 text-red-400",
};

const AdminDashboard = () => {
  const [subTab, setSubTab] = useState<"license" | "users" | "staff">("license");

  const [keys, setKeys] = useState<LicenseKeyRow[]>([]);
  const [keyCount, setKeyCount] = useState(1);
  const [generating, setGenerating] = useState(false);

  const [users, setUsers] = useState<AdminUserRow[]>([]);

  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [creatingStaff, setCreatingStaff] = useState(false);

  const loadKeys = useCallback(async () => {
    try {
      const response = await api.get("/admin/license-keys");
      setKeys(response.data);
    } catch {
      toast.error("Không thể tải danh sách License Key.");
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data);
    } catch {
      toast.error("Không thể tải danh sách người dùng.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadKeys();
      void loadUsers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadKeys, loadUsers]);

  const generateKeys = async () => {
    setGenerating(true);
    try {
      const response = await api.post("/admin/license-keys", { count: keyCount });
      setKeys((current) => [...response.data, ...current]);
      toast.success(`Đã tạo ${response.data.length} License Key.`);
    } catch {
      toast.error("Không thể tạo License Key.");
    } finally {
      setGenerating(false);
    }
  };

  const revokeKey = async (id: number) => {
    try {
      const response = await api.post(`/admin/license-keys/${id}/revoke`);
      setKeys((current) => current.map((row) => (row.id === id ? response.data : row)));
      toast.success("Đã hủy License Key.");
    } catch {
      toast.error("Không thể hủy License Key.");
    }
  };

  const updatePlan = async (userId: number, plan: "FREE" | "PRO") => {
    try {
      const response = await api.put(`/admin/users/${userId}/plan`, { plan });
      setUsers((current) => current.map((row) => (row.id === userId ? response.data : row)));
      toast.success("Đã cập nhật gói người dùng.");
    } catch {
      toast.error("Không thể cập nhật gói.");
    }
  };

  const createStaff = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!staffEmail.trim() || staffPassword.length < 8) {
      toast.error("Cần email hợp lệ và mật khẩu tối thiểu 8 ký tự.");
      return;
    }
    setCreatingStaff(true);
    try {
      await api.post("/admin/staff", { email: staffEmail.trim(), password: staffPassword });
      toast.success("Đã tạo tài khoản Staff.");
      setStaffEmail("");
      setStaffPassword("");
      void loadUsers();
    } catch {
      toast.error("Không thể tạo tài khoản Staff (email có thể đã tồn tại).");
    } finally {
      setCreatingStaff(false);
    }
  };

  const subTabs: { id: "license" | "users" | "staff"; label: string; icon: typeof KeyRound }[] = [
    { id: "license", label: "License Keys", icon: KeyRound },
    { id: "users", label: "Users", icon: Users },
    { id: "staff", label: "Staff", icon: UserCog },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-white">
          <ShieldCheck className="h-7 w-7 text-indigo-400" />
          <span>Quản trị hệ thống</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          License Key, phân quyền và tài khoản Staff. Chỉ ADMIN mới truy cập được khu vực này.
        </p>
      </div>

      <div className="flex gap-2 border-b border-white/5 pb-1">
        {subTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              subTab === id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {subTab === "license" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/5 bg-slate-900/40 p-4">
            <label className="text-sm text-slate-400">Số lượng key</label>
            <input
              type="number"
              min={1}
              max={100}
              value={keyCount}
              onChange={(event) => setKeyCount(Math.min(100, Math.max(1, Number(event.target.value) || 1)))}
              className="w-24 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => void generateKeys()}
              disabled={generating}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {generating ? "Đang tạo..." : "Generate Keys"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-white/5">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Người dùng</th>
                  <th className="px-4 py-3">Thời điểm dùng</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((row) => (
                  <tr key={row.id} className="text-slate-300">
                    <td className="px-4 py-3 font-mono text-xs">{row.key}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${STATUS_STYLE[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.used_by_email || "—"}</td>
                    <td className="px-4 py-3">{row.used_at ? new Date(row.used_at).toLocaleString("vi-VN") : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "AVAILABLE" && (
                        <button
                          onClick={() => void revokeKey(row.id)}
                          title="Hủy key"
                          className="cursor-pointer rounded-md p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      Chưa có License Key nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === "users" && (
        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/60 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Vai trò</th>
                <th className="px-4 py-3">Gói</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((row) => (
                <tr key={row.id} className="text-slate-300">
                  <td className="px-4 py-3">{row.email}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                        row.plan === "PRO" ? "bg-violet-500/10 text-violet-400" : "bg-slate-500/10 text-slate-400"
                      }`}
                    >
                      {row.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => void updatePlan(row.id, row.plan === "PRO" ? "FREE" : "PRO")}
                      className="cursor-pointer rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
                    >
                      Đổi sang {row.plan === "PRO" ? "FREE" : "PRO"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                    Chưa có người dùng.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === "staff" && (
        <div className="max-w-md space-y-4 rounded-lg border border-white/5 bg-slate-900/40 p-5">
          <p className="text-sm text-slate-400">
            Tạo tài khoản nội bộ với vai trò STAFF để hỗ trợ khách hàng. Tài khoản mới sẽ hiện trong tab Users.
          </p>
          <form onSubmit={createStaff} className="space-y-3">
            <input
              type="email"
              required
              placeholder="staff@novachat.ai"
              value={staffEmail}
              onChange={(event) => setStaffEmail(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
            <input
              type="password"
              required
              placeholder="Mật khẩu (tối thiểu 8 ký tự)"
              value={staffPassword}
              onChange={(event) => setStaffPassword(event.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
            />
            <button
              disabled={creatingStaff}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              <UserCog className="h-4 w-4" />
              {creatingStaff ? "Đang tạo..." : "Tạo tài khoản Staff"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
