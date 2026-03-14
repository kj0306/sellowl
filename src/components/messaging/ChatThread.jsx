import { useState, useEffect, useRef } from "react";
import { fetchMessages, sendMessage, startConversation, markConversationRead } from "../../lib/api";

const QUICK_OPTIONS = [
  "Is this still available?",
  "Interested in this item!",
  "What's your best price?",
  "When can I pick up?",
  "Can you hold it for me?",
];

function timeLabel(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit",
  });
}

export default function ChatThread({ profile, onBack, isNewChat = false, conversationId: initialConvId }) {
  const [messages, setMessages]     = useState([]);
  const [convId, setConvId]         = useState(initialConvId || null);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading]       = useState(!isNewChat);
  const [sending, setSending]       = useState(false);
  const [error, setError]           = useState(null);
  const [showQuick, setShowQuick]   = useState(isNewChat);
  const bottomRef = useRef(null);

  // Load messages + mark as read when conversation opens
  useEffect(() => {
    if (!convId) return;
    setLoading(true);
    fetchMessages(convId)
      .then((d) => {
        setMessages(d.messages || []);
        setLoading(false);
        // Mark as read silently
        markConversationRead(convId).catch(() => {});
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [convId]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ensureConversation = async () => {
    if (convId) return convId;
    // Start a new conversation with this user
    const data = await startConversation(profile.id);
    setConvId(data.conversation_id);
    return data.conversation_id;
  };

  const handleSend = async (text) => {
    const msg = typeof text === "string" ? text : inputValue.trim();
    if (!msg || sending) return;
    setSending(true);
    setShowQuick(false);
    setInputValue("");
    try {
      const cid = await ensureConversation();
      const newMsg = await sendMessage(cid, msg);
      setMessages((prev) => [...prev, newMsg]);
      markConversationRead(cid).catch(() => {});
    } catch (e) {
      setError(e.message);
      setInputValue(msg); // restore so user can retry
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend(inputValue.trim());
  };

  const initials = (profile?.name || profile?.display_name || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0">
        <button onClick={onBack}
          className="p-1 -ml-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#1a1612] dark:hover:text-[#f8f4ed] text-xl">
          ←
        </button>
        <div className="w-10 h-10 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-sm font-bold text-[#b8860b] shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed] truncate">
            {profile?.name || profile?.display_name || "User"}
          </p>
          {profile?.email && (
            <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 truncate">
              {profile.email}
            </p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && error && (
          <p className="text-center text-sm text-red-500 py-4">{error}</p>
        )}

        {/* Quick reply options for new chats */}
        {showQuick && !loading && (
          <div className="space-y-2 mb-2">
            <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 text-center">
              Quick messages
            </p>
            {QUICK_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSend(opt)}
                className="block w-full text-left px-4 py-2.5 rounded-xl bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] text-sm hover:bg-[#d4a017]/15 transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.is_mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
              msg.is_mine
                ? "bg-[#d4a017] text-white rounded-br-md"
                : "bg-[#3d2c1e]/12 dark:bg-[#f8f4ed]/12 text-[#1a1612] dark:text-[#f8f4ed] rounded-bl-md"
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <p className="text-xs opacity-60 mt-1 text-right">{timeLabel(msg.time)}</p>
            </div>
          </div>
        ))}

        {/* Sending indicator */}
        {sending && (
          <div className="flex justify-end">
            <div className="bg-[#d4a017]/50 px-4 py-2 rounded-2xl rounded-br-md">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}
        className="p-4 border-t border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Message…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-full bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/40 dark:placeholder-[#f8f4ed]/40 text-sm border-0 focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#d4a017] hover:bg-[#b8860b] disabled:bg-[#3d2c1e]/20 dark:disabled:bg-[#f8f4ed]/20 text-white flex items-center justify-center transition-colors disabled:cursor-not-allowed text-base"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
}
