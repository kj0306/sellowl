import { useState } from "react";

const BOT_REPLIES = [
  "Hi! I'm the Sell OWL assistant. How can I help you today?",
  "You can search for items, message sellers, or add items to your bag from their profiles.",
  "Need help with a listing? Tap on any post to view the seller's profile and their items.",
  "For subleases, filter by 'Sublease Zone' in the left sidebar.",
  "Thanks for using Sell OWL! Is there anything else?",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: "bot", text: "Hi! I'm the Sell OWL assistant. Ask me anything about buying or selling on campus.", time: "Now" },
  ]);
  const [inputValue, setInputValue] = useState("");

  const sendMessage = () => {
    const text = inputValue.trim();
    if (!text) return;
    const userMsg = { id: messages.length + 1, from: "user", text, time: "Now" };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setTimeout(() => {
      const botReply = BOT_REPLIES[messages.length % BOT_REPLIES.length];
      setMessages((prev) => [...prev, { id: prev.length + 2, from: "bot", text: botReply, time: "Now" }]);
    }, 800);
  };

  return (
    <>
      {/* Floating icon - always visible */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#d4a017] hover:bg-[#b8860b] shadow-lg flex items-center justify-center p-2 transition-all duration-200 ${isOpen ? "hidden" : ""}`}
        title="Chat"
      >
        <img src="/Logos/LOGO.png" alt="Chat" className="w-full h-full object-contain" />
      </button>

      {/* Chat panel - when expanded */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-40 w-80 md:w-96 h-[420px] flex flex-col rounded-2xl shadow-xl border border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#1a1612] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#d4a017]/20 bg-[#d4a017]/10">
            <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">Chat</p>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/20"
              title="Minimize"
            >
              Minimize
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    msg.from === "user"
                      ? "bg-[#d4a017] text-white rounded-br-md"
                      : "bg-[#3d2c1e]/15 dark:bg-[#f8f4ed]/15 text-[#1a1612] dark:text-[#f8f4ed] rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="p-3 border-t border-[#d4a017]/20"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 text-sm border border-[#d4a017]/20 focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-4 py-2 rounded-lg bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
