import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X, ShieldAlert } from "lucide-react";
import api from "../services/api";
import { toast } from "react-hot-toast";

interface Workspace {
  id: number;
  name: string;
  system_prompt?: string;
}

interface KnowledgeBaseProps {
  workspaces: Workspace[];
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ workspaces }) => {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | "">("");
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Guardrails Prompt States
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wsId = e.target.value;
    setSelectedWorkspaceId(wsId === "" ? "" : Number(wsId));
    
    // Auto fill existing prompt if available
    if (wsId !== "") {
      const ws = workspaces.find((w) => w.id === Number(wsId));
      if (ws && ws.system_prompt) {
        setSystemPrompt(ws.system_prompt);
      } else {
        setSystemPrompt("Bạn là trợ lý ảo của công ty. Chỉ trả lời dựa trên context được cung cấp.");
      }
    } else {
      setSystemPrompt("");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt') {
      toast.error("Chỉ hỗ trợ file PDF và TXT!");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Vui lòng chọn Workspace trước!");
      return;
    }
    if (!file) {
      toast.error("Vui lòng chọn file để tải lên!");
      return;
    }

    setIsUploading(true);
    setProgress(0);

    // Giả lập Progress Bar chạy trong lúc chờ AI xử lý (vì API thực tế không trả về % realtime)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev; // Dừng ở 90% đợi API phản hồi
        return prev + 5;
      });
    }, 500);

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.post(`/workspaces/${selectedWorkspaceId}/knowledge`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      clearInterval(interval);
      setProgress(100);
      toast.success("Nạp tri thức thành công!");
      
      // Reset file sau 1 giây
      setTimeout(() => {
        setFile(null);
        setProgress(0);
      }, 1000);

    } catch (err: any) {
      clearInterval(interval);
      setProgress(0);
      toast.error(err.response?.data?.detail || "Lỗi khi nạp tri thức!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Vui lòng chọn Workspace trước!");
      return;
    }
    
    setIsSavingPrompt(true);
    try {
      await api.put(`/workspaces/${selectedWorkspaceId}/prompt`, {
        system_prompt: systemPrompt
      });
      toast.success("Cập nhật tính cách Bot thành công!");
    } catch (err: any) {
      toast.error("Cập nhật thất bại!");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="h-6 w-6 text-indigo-400" />
            <span>Quản lý Tri thức & Tính cách Bot</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Nạp tài liệu (PDF/TXT) vào Vector DB và cấu hình Guardrails cho Chatbot.
          </p>
        </div>
      </div>

      {/* Select Workspace */}
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md">
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          1. Chọn Không gian làm việc (Workspace)
        </label>
        <select
          className="w-full md:w-1/2 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all appearance-none"
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
        >
          <option value="">-- Vui lòng chọn Workspace --</option>
          {workspaces.map((ws) => (
            <option key={ws.id} value={ws.id}>
              {ws.name} (ID: #{ws.id})
            </option>
          ))}
        </select>
      </div>

      {selectedWorkspaceId !== "" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cấu hình Prompt */}
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <ShieldAlert className="h-5 w-5 text-indigo-400" />
              <span>2. Cấu hình Tính cách (System Prompt)</span>
            </h3>
            <textarea
              className="w-full flex-1 min-h-[200px] rounded-xl border border-white/10 bg-slate-950 p-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all resize-none"
              placeholder="Nhập system prompt ở đây..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <button
              onClick={handleSavePrompt}
              disabled={isSavingPrompt}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingPrompt ? "Đang lưu..." : "Lưu Cấu hình Guardrails"}
            </button>
          </div>

          {/* Upload File */}
          <div className="bg-slate-900/40 border border-white/5 p-6 rounded-2xl backdrop-blur-md flex flex-col">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-indigo-400" />
              <span>3. Nạp tài liệu (Knowledge Base)</span>
            </h3>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 min-h-[200px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-700 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-900"
              } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".txt,.pdf"
                onChange={handleFileInput}
              />
              
              {!file ? (
                <>
                  <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <UploadCloud className="h-7 w-7 text-indigo-400" />
                  </div>
                  <p className="text-white font-semibold">Kéo thả file vào đây hoặc Click để chọn</p>
                  <p className="text-slate-500 text-xs mt-2">Hỗ trợ: PDF, TXT (Tối đa 50MB)</p>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-14 w-14 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 relative">
                    <FileText className="h-7 w-7 text-indigo-400" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="absolute -top-1 -right-1 bg-slate-800 text-slate-300 rounded-full p-1 hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-indigo-300 font-semibold truncate max-w-[200px]">{file.name}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Đang xử lý (Cắt chunk & Embedding)...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Đang xử lý..." : "Tải lên & Nạp vào ChromaDB"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
