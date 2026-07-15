import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { KeyRound, Save, Settings, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

interface CurrentUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
}

interface ApiErrorBody { detail?: string; }

const SystemSettings = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/users/me").then((response) => setUser(response.data)).catch(() => toast.error("Không thể tải thông tin tài khoản."));
  }, []);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) return toast.error("Mật khẩu mới cần ít nhất 8 ký tự.");
    if (newPassword !== confirmPassword) return toast.error("Mật khẩu xác nhận chưa khớp.");
    setSaving(true);
    try {
      await api.put("/users/me/password", { current_password: currentPassword, new_password: newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      toast.success("Đã thay đổi mật khẩu.");
    } catch (error) {
      const detail = (error as AxiosError<ApiErrorBody>).response?.data?.detail;
      toast.error(detail || "Không thể thay đổi mật khẩu.");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-7">
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-white"><Settings className="h-7 w-7 text-indigo-400" /><span>Cài đặt hệ thống</span></h1>
        <p className="mt-2 text-sm text-slate-400">Quản lý tài khoản và bảo mật đăng nhập.</p>
      </div>
      <div className="grid grid-cols-1 gap-7 xl:grid-cols-2">
        <section className="rounded-lg border border-white/5 bg-slate-900/40 p-6">
          <h2 className="flex items-center gap-2 font-bold text-white"><UserRound className="h-5 w-5 text-indigo-400" />Thông tin tài khoản</h2>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-3"><dt className="text-slate-500">Email</dt><dd className="font-medium text-white">{user?.email || "Đang tải..."}</dd></div>
            <div className="flex justify-between border-b border-white/5 pb-3"><dt className="text-slate-500">Vai trò</dt><dd className="font-medium capitalize text-white">{user?.role || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Trạng thái</dt><dd className="flex items-center gap-2 font-medium text-emerald-400"><ShieldCheck className="h-4 w-4" />{user?.is_active ? "Đang hoạt động" : "Chưa kích hoạt"}</dd></div>
          </dl>
        </section>
        <section className="rounded-lg border border-white/5 bg-slate-900/40 p-6">
          <h2 className="flex items-center gap-2 font-bold text-white"><KeyRound className="h-5 w-5 text-amber-400" />Đổi mật khẩu</h2>
          <form onSubmit={changePassword} className="mt-6 space-y-4">
            {[
              ["Mật khẩu hiện tại", currentPassword, setCurrentPassword],
              ["Mật khẩu mới", newPassword, setNewPassword],
              ["Xác nhận mật khẩu mới", confirmPassword, setConfirmPassword],
            ].map(([label, value, setter]) => (
              <label key={String(label)} className="block text-sm font-medium text-slate-300">{label as string}
                <input required type="password" value={value as string} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500" />
              </label>
            ))}
            <button disabled={saving} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
              <Save className="h-4 w-4" />{saving ? "Đang lưu..." : "Lưu mật khẩu mới"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SystemSettings;
