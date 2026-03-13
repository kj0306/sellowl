import { useState } from "react";

const QUICK_OPTIONS = [
  "Is this still available?",
  "Interested in this item",
  "What's your best price?",
  "When can I pick up?",
  "Can you hold it for me?",
];

const dummyMessages = [
  { id: 1, from: "them", text: "Hi! Is the desk still available?", time: "10:30 AM" },
  { id: 2, from: "me", text: "Yes! It's in great condition", time: "10:32 AM" },
  { id: 3, from: "them", text: "Can I also get the chair? What's your best price for both?", time: "10:35 AM" },
  { id: 4, from: "me", text: "I can do $80 for both. When can you pick up?", time: "10:38 AM" },
  { id: 5, from: "them", text: "That works! Can I come tomorrow afternoon?", time: "10:40 AM" },
];

export default function ChatThread({ profile, onBack, isNewChat = false }) {
  const [messages, setMessages] = useState(isNewChat ? [] : dummyMessages);
  const [inputValue, setInputValue] = useState("");
  const [showQuickOptions, setShowQuickOptions] = useState(isNewChat);

  const sendMessage = (text) => {
    const msg = typeof text === "string" ? text : inputValue.trim();
    if (!msg) return;
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        from: "me",
        text: msg,
        time: "Now",
      },
    ]);
    setInputValue("");
    setShowQuickOptions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue.trim());
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0">
        <button
          onClick={onBack}
          className="p-1 -ml-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#1a1612] dark:hover:text-[#f8f4ed] text-xl"
        >
          ←
        </button>
        <div className="w-10 h-10 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-sm font-bold text-[#1a1612] shrink-0">
          {profile?.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed] truncate">
            {profile?.name}
          </p>
          <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 truncate">
            {profile?.university}
          </p>
        </div>
        <button className="p-2 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 text-sm" title="Call">
          Call
        </button>
        <button className="p-2 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 text-sm" title="Video">
          Video
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {showQuickOptions && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">Quick select or type below</p>
            {QUICK_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => sendMessage(opt)}
                className="block w-full text-left px-4 py-2 rounded-xl bg-[#3d2c1e]/10 text-[#1a1612] dark:text-[#f8f4ed] text-sm hover:bg-[#3d2c1e]/20 transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                msg.from === "me"
                  ? "bg-[#d4a017] text-white rounded-br-md"
                  : "bg-[#3d2c1e]/15 dark:bg-[#f8f4ed]/15 text-[#1a1612] dark:text-[#f8f4ed] rounded-bl-md"
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs opacity-70 mt-1">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0"
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-full bg-[#3d2c1e]/10 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 text-sm border-0 focus:ring-2 focus:ring-[#d4a017]"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-[#d4a017] hover:bg-[#b8860b] disabled:bg-[#3d2c1e]/30 text-white font-medium disabled:cursor-not-allowed text-lg"
            title="Send"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
}
