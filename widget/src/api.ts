import type { WidgetConfig } from "./config";

export interface ChatMessage {
  id: number;
  sender: string; // 'user' | 'bot' | 'agent'
  content: string;
  created_at: string;
}

export interface PollResult {
  status: string; // 'bot_handling' | 'human_handling' | 'resolved'
  messages: ChatMessage[];
}

export interface StreamHandlers {
  onChunk: (text: string) => void;
  onHuman?: (text: string) => void;
}

// session_key duoc luu vao localStorage de cuoc hoi thoai song sot qua reload trang.
const SESSION_STORAGE_KEY = "novachat_session_key";

function loadSessionKey(): string | null {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveSessionKey(key: string): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, key);
  } catch {
    // localStorage khong kha dung (che do rieng tu...) -> bo qua, van chay trong bo nho.
  }
}

let sessionKey: string | null = loadSessionKey();

export function getSessionKey(): string | null {
  return sessionKey;
}

function setSessionKey(key: string): void {
  sessionKey = key;
  saveSessionKey(key);
}

function authHeaders(config: WidgetConfig): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Widget-Token": config.widgetToken,
  };
}

// Doc SSE tho tu response.body (khong dung EventSource vi no chi ho tro GET,
// con o day can POST + header X-Widget-Token). Moi event dang:
// "event: <ten>\ndata: <json>\n\n"
export async function streamChatMessage(
  config: WidgetConfig,
  message: string,
  handlers: StreamHandlers
): Promise<void> {
  const response = await fetch(`${config.apiUrl}/chat/${config.workspaceId}/stream`, {
    method: "POST",
    headers: authHeaders(config),
    body: JSON.stringify({ message, session_key: sessionKey }),
  });

  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Yêu cầu thất bại (${response.status}).`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      let eventType = "message";
      let dataLine = "";
      for (const line of rawEvent.split("\n")) {
        if (line.startsWith("event: ")) eventType = line.slice(7);
        else if (line.startsWith("data: ")) dataLine = line.slice(6);
      }

      if (dataLine) {
        const data = JSON.parse(dataLine);
        if (eventType === "session") {
          setSessionKey(data);
        } else if (eventType === "chunk") {
          handlers.onChunk(data);
        } else if (eventType === "human") {
          // Nhan vien da tiep quan: bot khong tra loi, khach cho phan hoi qua poll.
          handlers.onHuman?.(data);
        } else if (eventType === "error") {
          await reader.cancel();
          throw new Error(data);
        }
      }

      boundary = buffer.indexOf("\n\n");
    }
  }
}

// Tai toan bo lich su hoi thoai (dung khi mo lai trang co session_key cu).
export async function loadHistory(config: WidgetConfig): Promise<ChatMessage[]> {
  if (!sessionKey) return [];
  const url = `${config.apiUrl}/chat/${config.workspaceId}/history?session_key=${encodeURIComponent(sessionKey)}`;
  const response = await fetch(url, { headers: authHeaders(config) });
  if (!response.ok) {
    // Session_key cu khong con hop le (vd DB da reset) -> bo di, bat dau moi.
    if (response.status === 404) {
      sessionKey = null;
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    return [];
  }
  return response.json();
}

// Hoi backend co tin nhan moi cua nhan vien khong + trang thai phien hien tai.
export async function pollAgentMessages(
  config: WidgetConfig,
  afterId: number
): Promise<PollResult | null> {
  if (!sessionKey) return null;
  const url = `${config.apiUrl}/chat/${config.workspaceId}/poll?session_key=${encodeURIComponent(sessionKey)}&after=${afterId}`;
  const response = await fetch(url, { headers: authHeaders(config) });
  if (!response.ok) return null;
  return response.json();
}
