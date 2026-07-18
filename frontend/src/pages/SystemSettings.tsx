import { useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { KeyRound, Rocket, Save, Settings, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

interface CurrentUser {
  id: number;
  email: string;
  role: string;
  plan: "FREE" | "PRO";
  is_active: boolean;
}

interface ApiErrorBody { detail?: string; }

const SystemSettings = () => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    api.get("/users/me").then((response) => setUser(response.data)).catch(() => toast.error("Không thể tải thông tin tài khoản."));
  }, []);

  const activateLicense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!licenseKey.trim()) return;
    setActivating(true);
    try {
      const response = await api.put("/users/me/upgrade", { key: licenseKey.trim() });
      setUser(response.data);
      setLicenseKey("");
      toast.success("Kích hoạt thành công! Tài khoản của bạn đã lên gói PRO.");
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorBody>;
      const detail = axiosError.response?.data?.detail;
      if (axiosError.response?.status === 429) {
        toast.error(detail || "Bạn thử quá nhanh, vui lòng đợi 1 phút.");
      } else {
        toast.error(detail || "License Key không hợp lệ hoặc đã được sử dụng.");
      }
    } finally {
      setActivating(false);
    }
  };

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
            <div className="flex justify-between border-b border-white/5 pb-3">
              <dt className="text-slate-500">Gói</dt>
              <dd className={`font-bold ${user?.plan === "PRO" ? "text-violet-400" : "text-slate-300"}`}>{user?.plan || "-"}</dd>
            </div>
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

      {user && user.plan !== "PRO" && (
        <section className="max-w-xl rounded-lg border border-violet-500/20 bg-violet-500/5 p-6">
          <h2 className="flex items-center gap-2 font-bold text-white"><Rocket className="h-5 w-5 text-violet-400" />Nâng cấp lên PRO</h2>
          <p className="mt-2 text-sm text-slate-400">
            Nhập License Key để bỏ watermark và giới hạn 50 tin nhắn/tháng trên widget của bạn.
          </p>
          <form onSubmit={activateLicense} className="mt-4 flex gap-3">
            <input
              required
              placeholder="NOVA-XXXX-XXXX-XXXX-XXXX"
              value={licenseKey}
              onChange={(event) => setLicenseKey(event.target.value)}
              className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
            />
            <button disabled={activating} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50">
              {activating ? "Đang kích hoạt..." : "Kích hoạt"}
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default SystemSettings;
