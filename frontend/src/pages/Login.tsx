import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Mail, Lock, Eye, EyeOff, Bot, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

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
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Đã xảy ra lỗi. Vui lòng kiểm tra lại kết nối.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Background radial glow blobs */}
      <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full grid lg:grid-cols-12 min-h-screen relative z-10">
        {/* Left Side - Branding & Visuals (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-12 relative overflow-hidden border-r border-slate-900 bg-slate-950/40 backdrop-blur-sm">
          {/* Decorative geometric patterns */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/5 border border-indigo-500/10"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-violet-500/5 border border-violet-500/10"></div>

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/favicon.png" alt="NovaChat Logo" className="h-12 w-12 object-contain drop-shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform" />
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
              NovaChat AI
            </span>
          </div>

          {/* Center Showcase */}
          <div className="max-w-md my-auto space-y-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>Hệ thống Quản lý Bot AI Tương lai</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
                Tạo dựng và quản trị{" "}
                <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Chatbot thông minh
                </span>{" "}
                chỉ trong vài phút.
              </h1>
              <p className="text-slate-400 text-base leading-relaxed">
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
                  <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300 font-medium">{text}</span>
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
        <div className="col-span-12 lg:col-span-5 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Branding for Mobile */}
            <div className="flex lg:hidden items-center justify-center space-x-3 mb-6">
                <img src="/favicon.png" alt="NovaChat Logo" className="h-10 w-10 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
              <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-white via-indigo-200 to-violet-300 bg-clip-text text-transparent">
                NovaChat AI
              </span>
            </div>

            {/* Card Form */}
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Top glow decoration in card */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
              
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                  {isRegister ? "Đăng ký tài khoản" : "Chào mừng trở lại"}
                </h2>
                <p className="text-sm text-slate-400">
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
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Địa chỉ Email
                  </label>
                  <div className="relative rounded-xl border border-white/10 bg-white/5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Mail className="h-5 w-5" />
                    </span>
                    <input
                      type="email"
                      className="w-full bg-transparent pl-12 pr-4 py-3.5 text-white placeholder-slate-500 outline-none"
                      placeholder="admin@novachat.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Mật khẩu
                  </label>
                  <div className="relative rounded-xl border border-white/10 bg-white/5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                      <Lock className="h-5 w-5" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full bg-transparent pl-12 pr-12 py-3.5 text-white placeholder-slate-500 outline-none"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="relative group w-full mt-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-px font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-500/40 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                >
                  <div className="w-full rounded-xl bg-slate-950/20 py-3.5 px-4 transition-all group-hover:bg-transparent flex items-center justify-center space-x-2">
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


