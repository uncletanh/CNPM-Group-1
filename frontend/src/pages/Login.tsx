import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      } else {
        // Gọi API Đăng nhập
        const response = await api.post("/auth/login", { email, password });
        localStorage.setItem("token", response.data.access_token);
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-indigo-900 via-slate-900 to-violet-800 px-4">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl"></div>

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-8 backdrop-blur-md shadow-2xl">
        <h2 className="mb-2 text-center text-3xl font-extrabold text-white">
          {isRegister ? "Đăng ký tài khoản" : "Chào mừng trở lại"}
        </h2>
        <p className="mb-6 text-center text-sm text-slate-300">
          {isRegister ? "Tạo tài khoản admin để quản lý NovaChat AI" : "Đăng nhập để quản lý chatbot của bạn"}
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 border border-red-500/30 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="ten@congty.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Mật khẩu</label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/20"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-indigo-400 hover:underline"
          >
            {isRegister ? "Đã có tài khoản? Đăng nhập ngay" : "Chưa có tài khoản? Đăng ký ngay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

