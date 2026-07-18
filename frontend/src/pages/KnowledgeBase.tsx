import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { BookOpenCheck, Bot, CheckCircle2, Database, Eye, FilePenLine, FileText, MessageSquare, RefreshCw, Send, ShieldAlert, Trash2, UploadCloud, X } from "lucide-react";
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

interface KnowledgePreviewChunk {
  chunk_index: number;
  page: number | null;
  content: string;
}

interface KnowledgePreview {
  filename: string;
  total_chunks: number;
  chunks: KnowledgePreviewChunk[];
}

interface ChatTestResult {
  answer: string;
  sources: Array<{ source_filename: string | null; page: number | null }>;
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
  const [preview, setPreview] = useState<KnowledgePreview | null>(null);
  const [previewFilenameLoading, setPreviewFilenameLoading] = useState<string | null>(null);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [textFilename, setTextFilename] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isSavingText, setIsSavingText] = useState(false);
  const [testQuestion, setTestQuestion] = useState("");
  const [testResult, setTestResult] = useState<ChatTestResult | null>(null);
  const [isTestingBot, setIsTestingBot] = useState(false);
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
    setPreview(null);
  };

  const validateAndSetFile = (candidate: File) => {
    const ext = candidate.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt" && ext !== "docx") {
      toast.error("Chỉ hỗ trợ tệp PDF, TXT và DOCX.");
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
      toast.success(`Đã nạp ${response.data.chunks} đoạn dữ liệu vào kho tri thức.`);
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
      if (preview?.filename === filename) setPreview(null);
      toast.success(`Đã xóa ${filename} khỏi kho tri thức.`);
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Không thể xóa tài liệu.");
    } finally {
      setDeletingFilename(null);
    }
  };

  const handlePreviewKnowledge = async (filename: string) => {
    if (!selectedWorkspaceId) return;
    setPreviewFilenameLoading(filename);
    try {
      const response = await api.get<KnowledgePreview>(
        `/workspaces/${selectedWorkspaceId}/knowledge/${encodeURIComponent(filename)}/preview`
      );
      setPreview(response.data);
    } catch (err) {
      toast.error(getApiErrorDetail(err) || "Không thể xem trước tài liệu.");
    } finally {
      setPreviewFilenameLoading(null);
    }
  };

  const openTextEditor = async (filename?: string) => {
    setTextFilename(filename || "");
    setTextContent("");
    if (filename && selectedWorkspaceId) {
      const response = await api.get<KnowledgePreview>(
        `/workspaces/${selectedWorkspaceId}/knowledge/${encodeURIComponent(filename)}/preview`
      );
      setTextContent(response.data.chunks.map((chunk) => chunk.content).join("\n\n"));
    }
    setTextEditorOpen(true);
  };

  const saveTextKnowledge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedWorkspaceId) return;
    setIsSavingText(true);
    try {
      await api.post(`/workspaces/${selectedWorkspaceId}/knowledge/text`, {
        filename: textFilename,
        content: textContent,
      });
      toast.success("Đã lưu và nạp lại tri thức văn bản.");
      setTextEditorOpen(false);
      await fetchKnowledge();
    } catch (error) {
      toast.error(getApiErrorDetail(error) || "Không thể lưu tri thức văn bản.");
    } finally {
      setIsSavingText(false);
    }
  };

  const testBot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedWorkspaceId || !testQuestion.trim()) return;
    setIsTestingBot(true);
    setTestResult(null);
    try {
      const response = await api.post<ChatTestResult>(`/chat/${selectedWorkspaceId}`, {
        message: testQuestion.trim(),
        top_k: 3,
      });
      setTestResult(response.data);
    } catch (error) {
      toast.error(getApiErrorDetail(error) || "Không thể kiểm tra bot.");
    } finally {
      setIsTestingBot(false);
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
            Nạp tài liệu PDF/TXT vào kho tri thức làm nguồn dữ liệu cho chatbot. (Tính cách bot cấu hình ở tab "Cấu hình Bot AI".)
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
        <>
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
              <div className="flex gap-2">
              <button
                onClick={() => void openTextEditor()}
                title="Thêm tri thức dạng văn bản"
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                <FilePenLine className="h-3.5 w-3.5" />
                Thêm văn bản
              </button>
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
                <p className="mt-1 text-xs text-slate-500">Tải PDF, TXT hoặc DOCX lên để bắt đầu xây dựng tri thức.</p>
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
                    <div className="flex items-center gap-1">
                      {document.file_type === "txt" && (
                        <button
                          onClick={() => void openTextEditor(document.filename)}
                          title="Sửa nhanh văn bản"
                          className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500"
                        >
                          <FilePenLine className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => void handlePreviewKnowledge(document.filename)}
                        disabled={previewFilenameLoading === document.filename}
                        title="Xem nội dung AI đã học"
                        className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-500 disabled:opacity-50"
                      >
                        {previewFilenameLoading === document.filename
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => void handleDeleteKnowledge(document.filename)}
                        disabled={deletingFilename === document.filename}
                        title="Xóa khỏi kho tri thức"
                        className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
                accept=".txt,.pdf,.docx"
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
                  <p className="mt-2 text-xs text-slate-500">Hỗ trợ PDF, TXT, DOCX tối đa 50MB</p>
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
              {isUploading ? "Đang xử lý..." : "Tải lên & Nạp vào kho tri thức"}
            </button>
          </div>
        </div>

        <section className="border-y border-slate-200 bg-white px-6 py-6 text-slate-900">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold">Test Bot của bạn</h3>
          </div>
          <form onSubmit={testBot} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={testQuestion}
              onChange={(event) => setTestQuestion(event.target.value)}
              placeholder="Đặt câu hỏi dựa trên tri thức vừa nạp..."
              className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
            <button disabled={isTestingBot || !testQuestion.trim()} className="inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
              <Send className="h-4 w-4" />
              {isTestingBot ? "Đang kiểm tra..." : "Gửi câu hỏi"}
            </button>
          </form>
          {testResult && (
            <div className="mt-5 border-l-2 border-indigo-500 pl-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600"><Bot className="h-4 w-4" /> Phản hồi của bot</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{testResult.answer}</p>
              {testResult.sources.length > 0 && (
                <p className="mt-3 text-xs text-slate-500">
                  Nguồn: {testResult.sources.map((source) => `${source.source_filename || "Tài liệu"}${source.page ? `, trang ${source.page}` : ""}`).join(" · ")}
                </p>
              )}
            </div>
          )}
        </section>
        </>
      )}

      {textEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={saveTextKnowledge} className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-lg bg-white p-6 text-slate-900 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Tri thức dạng văn bản</h3>
                <p className="mt-1 text-xs text-slate-500">Lưu lại sẽ thay thế tài liệu trùng tên và tạo lại embedding.</p>
              </div>
              <button type="button" onClick={() => setTextEditorOpen(false)} title="Đóng" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <input
              required
              value={textFilename}
              onChange={(event) => setTextFilename(event.target.value)}
              placeholder="Tên tài liệu, ví dụ: chinh-sach-bao-hanh.txt"
              className="mt-5 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <textarea
              required
              value={textContent}
              onChange={(event) => setTextContent(event.target.value)}
              placeholder="Nhập nội dung bot cần học..."
              className="mt-3 min-h-72 resize-y rounded-md border border-slate-300 p-4 text-sm leading-6 outline-none focus:border-indigo-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setTextEditorOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">Hủy</button>
              <button disabled={isSavingText} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{isSavingText ? "Đang lưu..." : "Lưu và nạp tri thức"}</button>
            </div>
          </form>
        </div>
      )}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPreview(null);
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-indigo-600">
                  <BookOpenCheck className="h-4 w-4" />
                  Nội dung AI đã học
                </div>
                <h3 className="mt-1 truncate text-lg font-bold text-slate-900">{preview.filename}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {preview.total_chunks} đoạn đã được tách và lưu trong kho vector
                </p>
              </div>
              <button
                onClick={() => setPreview(null)}
                title="Đóng xem trước"
                className="shrink-0 cursor-pointer rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 sm:px-6">
              {preview.chunks.map((chunk) => (
                <section key={chunk.chunk_index} className="border-b border-slate-200 py-5 last:border-b-0">
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
                    <span>Đoạn {chunk.chunk_index + 1}</span>
                    {chunk.page && <span>Trang {chunk.page}</span>}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{chunk.content}</p>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
