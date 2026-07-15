import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import api from "../services/api";
import { Mail, Lock, Eye, EyeOff, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

interface ApiErrorBody {
  detail?: string;
}

const getApiErrorDetail = (error: unknown) => {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.detail;
};

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Gọi API Đăng ký
        await api.post("/auth/register", { email, password });
        alert("Đăng ký thành công! Hãy đăng nhập bằng tài khoản này.");
        setIsRegister(false);
        setPassword("");
        setShowPassword(false);
      } else {
        // Gọi API Đăng nhập
        const response = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("email", email);
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      console.error(err);
      setError(getApiErrorDetail(err) || "Đã xảy ra lỗi. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="novachat-light flex min-h-screen overflow-hidden bg-[#f6f7f9] font-sans text-slate-900">
      <div className="relative z-10 grid min-h-screen w-full lg:grid-cols-12">
        {/* Left Side - Branding & Visuals (Desktop only) */}
        <div className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-12 lg:col-span-7 lg:flex">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/favicon.png" alt="NovaChat Logo" className="h-12 w-12 object-contain" />
            <span className="text-xl font-bold text-slate-900">
              NovaChat AI
            </span>
          </div>

          {/* Center Showcase */}
          <div className="max-w-md my-auto space-y-8">
            <div className="inline-flex items-center space-x-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3 w-3" />
              <span>Nền tảng quản lý Bot AI</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold leading-tight text-slate-900">
                Tạo dựng và quản trị{" "}
                <span className="text-indigo-600">
                  Chatbot thông minh
                </span>{" "}
                chỉ trong vài phút.
              </h1>
              <p className="text-base leading-relaxed text-slate-600">
                Nền tảng giúp bạn quản lý nhiều không gian làm việc khác nhau, huấn luyện dữ liệu tùy chỉnh và tích hợp trực tiếp các trợ lý ảo AI tốt nhất vào doanh nghiệp của bạn.
              </p>
            </div>

            {/* Feature List */}
            <ul className="space-y-4">
              {[
                "Quản lý nhiều Không gian làm việc riêng biệt",
                "Kết nối và đồng bộ dữ liệu nhanh chóng",
                "Giao diện quản lý trực quan và dễ sử dụng",
                "Phân quyền quản trị thông tin bảo mật tuyệt đối",
              ].map((text, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Info */}
          <div className="text-xs text-slate-500 font-medium">
            © 2026 NovaChat AI. Dự án môn học Kiến trúc Phần mềm - Nhóm 1.
          </div>
        </div>

        {/* Right Side - Authentication Form */}
        <div className="col-span-12 flex items-center justify-center bg-slate-50 p-6 sm:p-12 lg:col-span-5">
          <div className="w-full max-w-md space-y-8">
            {/* Branding for Mobile */}
            <div className="flex lg:hidden items-center justify-center space-x-3 mb-6">
                <img src="/favicon.png" alt="NovaChat Logo" className="h-10 w-10 object-contain" />
              <span className="text-2xl font-bold text-slate-900">
                NovaChat AI
              </span>
            </div>

            {/* Card Form */}
            <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8 text-center">
                <h2 className="mb-2 text-3xl font-extrabold text-slate-900">
                  {isRegister ? "Đăng ký tài khoản" : "Chào mừng trở lại"}
                </h2>
                <p className="text-sm text-slate-600">
                  {isRegister
                    ? "Tạo tài khoản quản trị để trải nghiệm hệ thống"
                    : "Đăng nhập để quản lý chatbot của bạn"}
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-start space-x-2">
                  <span className="font-bold">⚠️ Lỗi:</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Địa chỉ Email
                  </label>
                  <div className="relative rounded-lg border border-slate-200 bg-slate-50 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail className="h-5 w-5" />
                    </span>
                    <input
                      type="email"
                      className="w-full bg-transparent py-3.5 pl-12 pr-4 text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="admin@novachat.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mật khẩu
                  </label>
                  <div className="relative rounded-lg border border-slate-200 bg-slate-50 transition-all focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/10">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-transparent py-3.5 pl-12 pr-12 text-slate-900 outline-none placeholder:text-slate-400"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 w-full cursor-pointer overflow-hidden rounded-lg bg-indigo-600 font-semibold text-white transition-colors hover:bg-indigo-500 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
                >
                  <div className="flex w-full items-center justify-center space-x-2 px-4 py-3.5">
                    <span>{loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}</span>
                    {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                  </div>
                </button>
              </form>

              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                    setPassword("");
                  }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors cursor-pointer"
                >
                  {isRegister
                    ? "Đã có tài khoản quản trị? Đăng nhập ngay"
                    : "Chưa có tài khoản? Tạo tài khoản mới"}
                </button>
              </div>
            </div>

            {/* Footer for Mobile */}
            <div className="block lg:hidden text-center text-xs text-slate-500 font-medium mt-4">
              © 2026 NovaChat AI. Dự án môn học Kiến trúc Phần mềm - Nhóm 1.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


