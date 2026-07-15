import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, User, Headset } from 'lucide-react';
import { getWidgetConfig, type WidgetConfig } from './config';
import { streamChatMessage, loadHistory, pollAgentMessages } from './api';

interface WidgetMessage {
  id: number;
  text: string;
  sender: string; // 'user' | 'bot' | 'agent'
}

const GREETING: WidgetMessage = {
  // id 0: khong bao gio trung id tin nhan tu server (autoincrement bat dau tu 1).
  id: 0,
  text: "Xin chào! Mình là NovaChat AI. Mình có thể giúp gì cho bạn?",
  sender: "bot",
};

const POLL_INTERVAL_MS = 3000;

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([GREETING]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [hasPartialAnswer, setHasPartialAnswer] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("bot_handling");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [{ config, configError }] = useState<{
    config: WidgetConfig | null;
    configError: string | null;
  }>(() => {
    try {
      return { config: getWidgetConfig(), configError: null };
    } catch (error) {
      return {
        config: null,
        configError: error instanceof Error ? error.message : String(error),
      };
    }
  });
  // Con tro: id tin nhan nhan vien lon nhat da hien thi, de poll chi lay cai moi hon.
  const lastAgentIdRef = useRef(0);
  const historyLoadedRef = useRef(false);

  // Cuộn xuống cuối tin nhắn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Mo lai trang co session_key cu -> tai lai toan bo lich su hoi thoai.
  useEffect(() => {
    if (historyLoadedRef.current || !config) return;
    historyLoadedRef.current = true;
    void loadHistory(config).then((history) => {
      if (history.length === 0) return;
      setMessages([GREETING, ...history.map((m) => ({ id: m.id, text: m.content, sender: m.sender }))]);
      const maxAgentId = history
        .filter((m) => m.sender === "agent")
        .reduce((max, m) => Math.max(max, m.id), 0);
      lastAgentIdRef.current = maxAgentId;
    });
  }, [config]);

  // Poll dinh ky: lay tin nhan moi cua nhan vien + trang thai phien (khi dang mo widget).
  const pollOnce = useCallback(async () => {
    if (!config) return;
    const result = await pollAgentMessages(config, lastAgentIdRef.current);
    if (!result) return;
    setSessionStatus(result.status);
    if (result.messages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const additions = result.messages
          .filter((m) => !existingIds.has(m.id))
          .map((m) => ({ id: m.id, text: m.content, sender: m.sender }));
        return additions.length > 0 ? [...prev, ...additions] : prev;
      });
      lastAgentIdRef.current = Math.max(
        lastAgentIdRef.current,
        ...result.messages.map((m) => m.id)
      );
    }
  }, [config]);

  useEffect(() => {
    if (!isOpen || !config) return;
    void pollOnce();
    const timer = window.setInterval(() => void pollOnce(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [config, isOpen, pollOnce]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const newUserMsg: WidgetMessage = { id: Date.now(), text: inputText, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");

    if (!config) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: configError || "Widget chưa được cấu hình đúng.", sender: "bot" },
      ]);
      return;
    }

    setIsSending(true);
    setHasPartialAnswer(false);
    const botMsgId = Date.now() + 1;

    try {
      await streamChatMessage(config, newUserMsg.text, {
        onChunk: (chunk) => {
          setHasPartialAnswer(true);
          // Ham nay phai "pure" (chi phu thuoc prev) vi React StrictMode goi
          // updater 2 lan de kiem tra tinh pure - dung bien ngoai (mutable flag)
          // se lam lan goi thu hai sai logic va mat noi dung da them.
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === botMsgId);
            if (!exists) {
              return [...prev, { id: botMsgId, text: chunk, sender: "bot" }];
            }
            return prev.map((m) => (m.id === botMsgId ? { ...m, text: m.text + chunk } : m));
          });
        },
        onHuman: () => {
          // Nhan vien dang phu trach: cap nhat trang thai ngay de hien banner,
          // phan hoi that se den qua poll.
          setSessionStatus("human_handling");
        },
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.";
      setMessages((prev) => [...prev, { id: Date.now(), text, sender: "bot" }]);
    } finally {
      setIsSending(false);
      setHasPartialAnswer(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4 font-sans">
      {/* Khung Chat */}
      {isOpen && (
        <div className="w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100 transform transition-all duration-300 origin-bottom-right">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm tracking-wide">NovaChat AI</h3>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-indigo-100 text-xs font-medium">
                    {sessionStatus === "human_handling" ? "Nhân viên đang hỗ trợ" : "Trợ lý trực tuyến"}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-indigo-100 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body (Messages) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            <div className="text-center text-xs text-slate-400 my-4 uppercase tracking-wider font-semibold">
              Hôm nay
            </div>

            {/* Banner khi nhan vien tiep quan */}
            {sessionStatus === "human_handling" && (
              <div className="flex items-center justify-center space-x-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium">
                <Headset className="w-4 h-4" />
                <span>Bạn đang được nhân viên hỗ trợ trực tiếp.</span>
              </div>
            )}

            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isAgent = msg.sender === 'agent';
              return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end max-w-[85%] space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-indigo-100'
                      : isAgent
                        ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                        : 'bg-gradient-to-br from-indigo-500 to-violet-500'
                  }`}>
                    {isUser ? (
                      <User className="w-4 h-4 text-indigo-600" />
                    ) : isAgent ? (
                      <Headset className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div>
                    <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : isAgent
                          ? 'bg-amber-500 text-white rounded-bl-none'
                          : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                    }`}>
                      {msg.text}
                    </div>
                    {isAgent && (
                      <div className="text-[9px] text-amber-600 font-semibold mt-1 ml-1">Nhân viên hỗ trợ</div>
                    )}
                  </div>
                </div>
              </div>
              );
            })}
            {isSending && !hasPartialAnswer && sessionStatus !== "human_handling" && (
              <div className="flex justify-start">
                <div className="flex items-end max-w-[85%] space-x-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-500 to-violet-500">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="p-3 rounded-2xl text-sm shadow-sm bg-white text-slate-400 border border-slate-100 rounded-bl-none">
                    Đang trả lời...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer (Input) */}
          <div className="p-4 bg-white border-t border-slate-100">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Nhập tin nhắn..." 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-slate-100 text-slate-700 text-sm rounded-full py-3 pl-4 pr-12 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 cursor-pointer"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-3 text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Powered by NovaChat
            </div>
          </div>

        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? 'bg-slate-800 rotate-90 scale-90' : 'bg-indigo-600 hover:scale-110 shadow-indigo-600/30'
        } w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-all duration-300 cursor-pointer`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}

export default App;
