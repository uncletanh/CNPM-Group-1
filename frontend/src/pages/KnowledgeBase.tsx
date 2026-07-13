import React, { useRef, useState } from "react";
import type { AxiosError } from "axios";
import { CheckCircle2, FileText, ShieldAlert, UploadCloud, X } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../services/api";

interface Workspace {
  id: number;
  name: string;
  system_prompt?: string;
}

interface KnowledgeUploadResult {
  detail: string;
  filename: string;
  file_size: number;
  chunks: number;
  collection_name: string;
}

interface KnowledgeBaseProps {
  workspaces: Workspace[];
  initialWorkspaceId?: number | null;
  onWorkspacesChanged?: () => Promise<void> | void;
}

interface ApiErrorBody {
  detail?: string;
}

const DEFAULT_SYSTEM_PROMPT =
  "Ban la tro ly ao cua cong ty. Chi tra loi dua tren context duoc cung cap. Neu context khong co thong tin phu hop, hay de nghi khach hang gap nhan vien ho tro.";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const getApiErrorDetail = (error: unknown) => {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.detail;
};

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  workspaces,
  initialWorkspaceId,
  onWorkspacesChanged,
}) => {
  const initialWorkspace = initialWorkspaceId
    ? workspaces.find((workspace) => workspace.id === initialWorkspaceId)
    : undefined;
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | "">(
    initialWorkspace?.id ?? ""
  );
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<KnowledgeUploadResult | null>(null);
  const [systemPrompt, setSystemPrompt] = useState(
    initialWorkspace?.system_prompt || (initialWorkspace ? DEFAULT_SYSTEM_PROMPT : "")
  );
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedWorkspace =
    selectedWorkspaceId === ""
      ? undefined
      : workspaces.find((workspace) => workspace.id === selectedWorkspaceId);

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWorkspaceId = e.target.value === "" ? "" : Number(e.target.value);
    setSelectedWorkspaceId(nextWorkspaceId);
    setUploadResult(null);
    setFile(null);
    setProgress(0);

    if (nextWorkspaceId === "") {
      setSystemPrompt("");
      return;
    }

    const workspace = workspaces.find((item) => item.id === nextWorkspaceId);
    setSystemPrompt(workspace?.system_prompt || DEFAULT_SYSTEM_PROMPT);
  };

  const validateAndSetFile = (candidate: File) => {
    const ext = candidate.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      toast.error("Chi ho tro file PDF va TXT.");
      return;
    }

    if (candidate.size > MAX_FILE_SIZE) {
      toast.error("File vuot qua gioi han 50MB.");
      return;
    }

    if (candidate.size === 0) {
      toast.error("File dang rong.");
      return;
    }

    setUploadResult(null);
    setFile(candidate);
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

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) validateAndSetFile(droppedFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) validateAndSetFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Vui long chon Workspace truoc.");
      return;
    }

    if (!file) {
      toast.error("Vui long chon file de tai len.");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setUploadResult(null);

    const processingTimer = window.setInterval(() => {
      setProgress((current) => (current >= 95 ? current : current + 1));
    }, 700);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post<KnowledgeUploadResult>(
        `/workspaces/${selectedWorkspaceId}/knowledge`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event) => {
            if (!event.total) return;
            const uploadPercent = Math.round((event.loaded * 70) / event.total);
            setProgress(Math.min(uploadPercent, 70));
          },
        }
      );

      setProgress(100);
      setUploadResult(response.data);
      toast.success(`Da nap ${response.data.chunks} chunks vao ChromaDB.`);
      clearFile();
    } catch (err: unknown) {
      setProgress(0);
      toast.error(getApiErrorDetail(err) || "Loi khi nap tri thuc.");
    } finally {
      window.clearInterval(processingTimer);
      setIsUploading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Vui long chon Workspace truoc.");
      return;
    }

    const trimmedPrompt = systemPrompt.trim();
    if (trimmedPrompt.length < 20) {
      toast.error("System prompt can it nhat 20 ky tu.");
      return;
    }

    setIsSavingPrompt(true);
    try {
      await api.put(`/workspaces/${selectedWorkspaceId}/prompt`, {
        system_prompt: trimmedPrompt,
      });
      setSystemPrompt(trimmedPrompt);
      await onWorkspacesChanged?.();
      toast.success("Da cap nhat System Prompt.");
    } catch (err: unknown) {
      toast.error(getApiErrorDetail(err) || "Cap nhat System Prompt that bai.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center space-x-2 text-2xl font-bold text-white">
            <ShieldAlert className="h-6 w-6 text-indigo-400" />
            <span>Quan ly Tri thuc & Tinh cach Bot</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Nap tai lieu PDF/TXT vao ChromaDB va cau hinh guardrails cho chatbot.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          1. Chon Workspace
        </label>
        <select
          className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition-all focus:border-indigo-500 md:w-1/2"
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
        >
          <option value="">-- Vui long chon Workspace --</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name} (ID: #{workspace.id})
            </option>
          ))}
        </select>
      </div>

      {selectedWorkspace && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="flex flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
              <ShieldAlert className="h-5 w-5 text-indigo-400" />
              <span>2. System Prompt</span>
            </h3>
            <textarea
              className="min-h-[220px] w-full flex-1 resize-none rounded-xl border border-white/10 bg-slate-950 p-4 text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500"
              placeholder="Nhap system prompt..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Workspace: {selectedWorkspace.name}</span>
              <span>{systemPrompt.trim().length}/4000</span>
            </div>
            <button
              onClick={handleSavePrompt}
              disabled={isSavingPrompt}
              className="mt-4 w-full cursor-pointer rounded-xl bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingPrompt ? "Dang luu..." : "Luu System Prompt"}
            </button>
          </div>

          <div className="flex flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
              <FileText className="h-5 w-5 text-indigo-400" />
              <span>3. Nap Knowledge Base</span>
            </h3>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex min-h-[220px] flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-700 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-900"
              } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".txt,.pdf"
                onChange={handleFileInput}
              />

              {!file ? (
                <>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
                    <UploadCloud className="h-7 w-7 text-indigo-400" />
                  </div>
                  <p className="text-center font-semibold text-white">
                    Keo tha file vao day hoac click de chon
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Ho tro PDF, TXT toi da 50MB</p>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20">
                    <FileText className="h-7 w-7 text-indigo-400" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="absolute -right-1 -top-1 rounded-full bg-slate-800 p-1 text-slate-300 transition-colors hover:bg-red-500 hover:text-white"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="max-w-[240px] truncate font-semibold text-indigo-300">{file.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs text-slate-400">
                  <span>{progress < 70 ? "Dang tai file..." : "Dang chunk va embedding..."}</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {uploadResult && (
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Nap tri thuc thanh cong</span>
                </div>
                <p>File: {uploadResult.filename}</p>
                <p>Chunks: {uploadResult.chunks}</p>
                <p>Collection: {uploadResult.collection_name}</p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="mt-6 w-full cursor-pointer rounded-xl bg-indigo-600 py-3 font-bold text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "Dang xu ly..." : "Tai len & Nap vao ChromaDB"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
