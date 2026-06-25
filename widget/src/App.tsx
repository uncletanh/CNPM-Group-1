import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Xin chào! Mình là NovaChat AI. Mình có thể giúp gì cho bạn?", sender: "bot" }
  ]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cuộn xuống cuối tin nhắn
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Thêm tin nhắn của User
    const newUserMsg = { id: Date.now(), text: inputText, sender: "user" };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");

    // Giả lập Bot phản hồi sau 1s (Sprint 2 sẽ thay bằng gọi API/WebSocket thực)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: "Cảm ơn bạn đã nhắn tin. Chức năng AI đang được nâng cấp trong Sprint 2!", sender: "bot" }
      ]);
    }, 1000);
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
                  <span className="text-indigo-100 text-xs font-medium">Trợ lý trực tuyến</span>
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
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-end max-w-[85%] space-x-2 ${msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-indigo-100' : 'bg-gradient-to-br from-indigo-500 to-violet-500'
                  }`}>
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
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
                disabled={!inputText.trim()}
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
