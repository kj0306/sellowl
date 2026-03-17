import { useState, useEffect } from "react";
import { fetchConversations } from "../../lib/api";

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = (Date.now() - new Date(isoString)) / 1000;
  if (diff < 60)    return "Just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function Messages({ onOpenChat }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = () => {
    fetchConversations()
      .then((d) => { setConversations(d.conversations || []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = searchQuery
    ? conversations.filter((c) =>
        (c.other_user.name || c.other_user.email || "")
          .toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - centered like profile, more padding */}
      <div className="shrink-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 border-b border-[#d4a017]/20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] flex-1 font-['Playfair_Display']">
              Messages
            </h2>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#d4a017] text-white text-xs font-bold">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/40 dark:placeholder-[#f8f4ed]/40 text-sm border-0 focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Body - centered, padded like profile */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-7 h-7 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Loading messages…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-2 px-6 text-center">
            <p className="text-2xl">⚠️</p>
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={load} className="text-xs text-[#d4a017] hover:underline mt-1">Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 px-6 text-center">
            <span className="text-5xl">💬</span>
            <p className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed]">No messages yet</p>
            <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
              Message a seller from their profile to get started.
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && filtered.map((conv) => {
          const isUnread = conv.unread_count > 0;
          const initials = (conv.other_user.name || conv.other_user.email || "?")
            .slice(0, 2).toUpperCase();

          return (
            <button
              key={conv.id}
              onClick={() => onOpenChat({ conversationId: conv.id, profile: conv.other_user })}
              className={`w-full flex gap-4 p-4 text-left transition-colors border-b border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10 ${
                isUnread
                  ? "bg-[#d4a017]/5 hover:bg-[#d4a017]/10"
                  : "hover:bg-[#3d2c1e]/5 dark:hover:bg-[#f8f4ed]/5"
              }`}
            >
              {/* Avatar with unread dot */}
              <div className="relative shrink-0">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${
                  isUnread
                    ? "bg-[#d4a017]/40 text-[#b8860b]"
                    : "bg-[#d4a017]/20 text-[#b8860b]"
                }`}>
                  {initials}
                </div>
                {/* Unread dot */}
                {isUnread && (
                  <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#d4a017] border-2 border-[#f8f4ed] dark:border-[#1a1612] flex items-center justify-center">
                    {conv.unread_count <= 9 && (
                      <span className="text-[8px] font-bold text-white leading-none">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center gap-2">
                  <span className={`truncate ${
                    isUnread
                      ? "font-bold text-[#1a1612] dark:text-[#f8f4ed]"
                      : "font-medium text-[#1a1612] dark:text-[#f8f4ed]"
                  }`}>
                    {conv.other_user.name || conv.other_user.email}
                  </span>
                  <span className={`text-xs shrink-0 ${
                    isUnread
                      ? "text-[#d4a017] font-semibold"
                      : "text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50"
                  }`}>
                    {timeAgo(conv.last_time)}
                  </span>
                </div>
                <p className={`text-sm truncate mt-0.5 ${
                  isUnread
                    ? "text-[#1a1612] dark:text-[#f8f4ed] font-medium"
                    : "text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60"
                }`}>
                  {conv.last_message || "No messages yet"}
                </p>
              </div>

              {/* Unread count pill (for > 9 messages) */}
              {conv.unread_count > 9 ? (
                <span className="self-center shrink-0 px-2 py-0.5 rounded-full bg-[#d4a017] text-white text-xs font-bold">
                  {conv.unread_count}
                </span>
              ) : (
                <span className="text-[#3d2c1e]/30 dark:text-[#f8f4ed]/30 text-lg self-center">›</span>
              )}
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
