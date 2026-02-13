import { useState } from "react";
import { profiles } from "../data/dummyData";

// Dummy messages - Instagram DM style
const dummyMessages = profiles.slice(0, 8).map((p, i) => ({
  id: p.id,
  profile: p,
  lastMessage: i % 2 === 0 ? "Interested in your desk and chair!" : "Is the sublease still available?",
  time: i % 3 === 0 ? "2m" : i % 3 === 1 ? "1h" : "Yesterday",
  unread: i < 3,
  offerCount: i % 2 === 0 ? 2 : 0,
}));

export default function Messages({ onBack, onOpenChat }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMessages = searchQuery
    ? dummyMessages.filter((m) =>
        m.profile.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : dummyMessages;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Instagram DM style */}
      <div className="p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#1a1612] dark:hover:text-[#f8f4ed] text-lg"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] flex-1 font-['Playfair_Display']">
            Messages
          </h2>
          <button className="p-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#1a1612] dark:hover:text-[#f8f4ed] text-lg">
            +
          </button>
        </div>
        {/* Search - like Instagram */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#3d2c1e]/10 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 text-sm border-0 focus:ring-2 focus:ring-[#d4a017]"
          />
        </div>
      </div>

      {/* Conversations list - Instagram style */}
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.map((msg) => (
          <button
            key={msg.id}
            onClick={() => onOpenChat?.(msg)}
            className="w-full flex gap-4 p-4 text-left hover:bg-[#3d2c1e]/5 dark:hover:bg-[#f8f4ed]/5 active:bg-[#3d2c1e]/10 transition-colors border-b border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10"
          >
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-base font-bold text-[#1a1612]">
                {msg.profile.initials}
              </div>
              {msg.unread && (
                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#d4a017] border-2 border-[#f8f4ed] dark:border-[#1a1612]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center gap-2">
                <span className="font-medium text-[#1a1612] dark:text-[#f8f4ed] truncate">
                  {msg.profile.name}
                </span>
                <span className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 shrink-0">
                  {msg.time}
                </span>
              </div>
              <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 truncate mt-0.5">
                {msg.lastMessage}
              </p>
              {msg.offerCount > 0 && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-[#d4a017]/20 text-[#b8860b] text-xs rounded-full">
                  {msg.offerCount} offer(s)
                </span>
              )}
            </div>
            <span className="text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 text-lg">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
