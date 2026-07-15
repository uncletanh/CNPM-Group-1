import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { BookOpenCheck, CheckCircle2, Database, FileText, RefreshCw, ShieldAlert, Trash2, UploadCloud, X } from "lucide-react";
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

interface KnowledgeDocument {
  filename: string;
  file_size: number | null;
  chunks: number;
  uploaded_at: string | null;
  file_type: string | null;
}

interface KnowledgeSummary {
  total_documents: number;
  total_chunks: number;
  documents: KnowledgeDocument[];
}

interface KnowledgeBaseProps {
  workspaces: Workspace[];
  initialWorkspaceId?: number | null;
  onWorkspacesChanged?: () => Promise<void> | void;
}

interface ApiErrorBody {
  detail?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const getApiErrorDetail = (error: unknown) => {
  const axiosError = error as AxiosError<ApiErrorBody>;
  return axiosError.response?.data?.detail;
};

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  workspaces,
  initialWorkspaceId,
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
  const [knowledgeSummary, setKnowledgeSummary] = useState<KnowledgeSummary | null>(null);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedWorkspace =
    selectedWorkspaceId === ""
      ? undefined
      : workspaces.find((workspace) => workspace.id === selectedWorkspaceId);

  const fetchKnowledge = useCallback(async () => {
    if (!selectedWorkspaceId) return;
    try {
      const response = await api.get<KnowledgeSummary>(`/workspaces/${selectedWorkspaceId}/knowledge`);
      setKnowledgeSummary(response.data);
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Không thể tải danh sách tri thức.");
    } finally {
      setIsLoadingKnowledge(false);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    const timer = window.setTimeout(() => {
      setIsLoadingKnowledge(true);
      void fetchKnowledge();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedWorkspaceId, fetchKnowledge]);

  const handleWorkspaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWorkspaceId = e.target.value === "" ? "" : Number(e.target.value);
    setSelectedWorkspaceId(nextWorkspaceId);
    setUploadResult(null);
    setFile(null);
    setProgress(0);
    setKnowledgeSummary(null);
  };

  const validateAndSetFile = (candidate: File) => {
    const ext = candidate.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      toast.error("Chỉ hỗ trợ tệp PDF và TXT.");
      return;
    }

    if (candidate.size > MAX_FILE_SIZE) {
      toast.error("Tệp vượt quá giới hạn 50MB.");
      return;
    }

    if (candidate.size === 0) {
      toast.error("Tệp đang rỗng.");
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
      toast.error("Vui lòng chọn workspace trước.");
      return;
    }

    if (!file) {
      toast.error("Vui lòng chọn tệp để tải lên.");
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
      toast.success(`Đã nạp ${response.data.chunks} đoạn dữ liệu vào ChromaDB.`);
      clearFile();
      await fetchKnowledge();
    } catch (err: unknown) {
      setProgress(0);
      toast.error(getApiErrorDetail(err) || "Lỗi khi nạp tri thức.");
    } finally {
      window.clearInterval(processingTimer);
      setIsUploading(false);
    }
  };

  const handleDeleteKnowledge = async (filename: string) => {
    if (!selectedWorkspaceId || !window.confirm(`Xóa "${filename}" khỏi kho tri thức của bot?`)) return;
    setDeletingFilename(filename);
    try {
      const response = await api.delete<KnowledgeSummary>(
        `/workspaces/${selectedWorkspaceId}/knowledge/${encodeURIComponent(filename)}`
      );
      setKnowledgeSummary(response.data);
      toast.success(`Đã xóa ${filename} khỏi kho tri thức.`);
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Không thể xóa tài liệu.");
    } finally {
      setDeletingFilename(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes === null) return "Chưa có dữ liệu";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center space-x-2 text-2xl font-bold text-white">
            <ShieldAlert className="h-6 w-6 text-indigo-400" />
            <span>Quản lý Tri thức</span>
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Nạp tài liệu PDF/TXT vào ChromaDB làm nguồn tri thức cho chatbot. (Tính cách bot cấu hình ở tab "Cấu hình Bot AI".)
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          1. Chọn workspace
        </label>
        <select
          className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition-all focus:border-indigo-500 md:w-1/2"
          value={selectedWorkspaceId}
          onChange={handleWorkspaceChange}
        >
          <option value="">-- Vui lòng chọn workspace --</option>
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name} (ID: #{workspace.id})
            </option>
          ))}
        </select>
      </div>

      {selectedWorkspace && (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <section className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                  <BookOpenCheck className="h-5 w-5 text-emerald-400" />
                  <span>2. Tri thức đã nạp</span>
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Bot sẽ tìm kiếm câu trả lời trong các tài liệu dưới đây.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsLoadingKnowledge(true);
                  void fetchKnowledge();
                }}
                disabled={isLoadingKnowledge}
                title="Làm mới danh sách"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingKnowledge ? "animate-spin" : ""}`} />
                Làm mới
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Tài liệu</p>
                <p className="mt-1 text-2xl font-bold text-white">{knowledgeSummary?.total_documents ?? 0}</p>
              </div>
              <div className="rounded-xl bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Đoạn tri thức</p>
                <p className="mt-1 text-2xl font-bold text-white">{knowledgeSummary?.total_chunks ?? 0}</p>
              </div>
            </div>

            {isLoadingKnowledge && !knowledgeSummary ? (
              <div className="flex min-h-40 items-center justify-center text-sm text-slate-500">
                Đang đọc kho tri thức...
              </div>
            ) : !knowledgeSummary?.documents.length ? (
              <div className="mt-5 flex min-h-40 flex-col items-center justify-center border border-dashed border-slate-800 text-center">
                <Database className="mb-3 h-8 w-8 text-slate-600" />
                <p className="font-semibold text-slate-300">Bot chưa có tài liệu nào</p>
                <p className="mt-1 text-xs text-slate-500">Tải PDF hoặc TXT lên để bắt đầu xây dựng tri thức.</p>
              </div>
            ) : (
              <div className="mt-5 max-h-[460px] divide-y divide-white/5 overflow-y-auto border-y border-white/5 pr-1">
                {knowledgeSummary.documents.map((document) => (
                  <div key={document.filename} className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{document.filename}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {document.chunks} đoạn · {formatFileSize(document.file_size)}
                        {document.uploaded_at
                          ? ` · Nạp ${new Date(document.uploaded_at).toLocaleString("vi-VN")}`
                          : " · Tài liệu cũ"}
                      </p>
                    </div>
                    <button
                      onClick={() => void handleDeleteKnowledge(document.filename)}
                      disabled={deletingFilename === document.filename}
                      title="Xóa khỏi kho tri thức"
                      className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-col rounded-2xl border border-white/5 bg-slate-900/40 p-6 backdrop-blur-md xl:sticky xl:top-24">
            <h3 className="mb-4 flex items-center space-x-2 text-lg font-bold text-white">
              <FileText className="h-5 w-5 text-indigo-400" />
              <span>3. Nạp thêm tri thức</span>
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
                    Kéo thả tệp vào đây hoặc bấm để chọn
                  </p>
                  <p className="mt-2 text-xs text-slate-500">Hỗ trợ PDF, TXT tối đa 50MB</p>
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
                  <span>{progress < 70 ? "Đang tải tệp..." : "Đang chia đoạn và tạo embedding..."}</span>
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
                  <span>Nạp tri thức thành công</span>
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
              {isUploading ? "Đang xử lý..." : "Tải lên & Nạp vào ChromaDB"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
