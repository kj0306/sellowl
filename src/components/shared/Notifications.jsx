import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications } from "../../lib/api";

const NOTIF_READ_KEY = "sellowl_notif_read_ids";

function getReadIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveReadIds(set) {
  try {
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...set]));
  } catch {}
}

const TYPE_META = {
  message:          { icon: "💬", accent: "#185FA5", bg: "#E6F1FB" },
  order_received:   { icon: "📦", accent: "#BA7517", bg: "#FAEEDA" },
  order_accepted:   { icon: "✅", accent: "#3B6D11", bg: "#EAF3DE" },
  order_rejected:   { icon: "✗",  accent: "#A32D2D", bg: "#FCEBEB" },
  order_cancelled:  { icon: "✗",  accent: "#5F5E5A", bg: "#F1EFE8" },
  order_expired:    { icon: "⏱",  accent: "#5F5E5A", bg: "#F1EFE8" },
  order_completed:  { icon: "★",  accent: "#3B6D11", bg: "#EAF3DE" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2)  return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readIds, setReadIds] = useState(getReadIds);

  useEffect(() => {
    fetchNotifications()
      .then((d) => setNotifications(d.notifications || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Mark all currently visible notifications as read
  useEffect(() => {
    if (notifications.length === 0) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  const handleClick = (notif) => {
    // Mark individual as read
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(notif.id);
      saveReadIds(next);
      return next;
    });

    if (notif.link_type === "conversation") {
      navigate("/chat", {
        state: {
          profile: { id: null, name: notif.title, conversationId: notif.link_id },
          isNewChat: false,
        },
      });
    } else if (notif.link_type === "order") {
      navigate("/orders");
    }
  };

  const unreadCount = notifications.filter((n) => !readIds.has(n.id) && !n.read).length;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="shrink-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] flex-1 font-['Playfair_Display']">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#d4a017] text-white text-xs font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto">

          {loading && (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-16 px-6">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-3 text-center px-6">
              <span className="text-5xl">🦉</span>
              <p className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed]">
                No notifications yet
              </p>
              <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                Activity from messages and orders will appear here
              </p>
            </div>
          )}

          {!loading && !error && notifications.map((n) => {
            const meta    = TYPE_META[n.type] || TYPE_META.message;
            const isUnread = !readIds.has(n.id) && !n.read;

            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full flex gap-4 px-4 py-4 text-left transition-colors border-b border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10 ${
                  isUnread
                    ? "bg-[#d4a017]/5 hover:bg-[#d4a017]/10"
                    : "hover:bg-[#3d2c1e]/5 dark:hover:bg-[#f8f4ed]/5"
                }`}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0"
                  style={{ background: meta.bg }}
                >
                  <span style={{ fontSize: 16 }}>{meta.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm truncate ${
                        isUnread
                          ? "font-semibold text-[#1a1612] dark:text-[#f8f4ed]"
                          : "font-medium text-[#1a1612] dark:text-[#f8f4ed]"
                      }`}
                    >
                      {n.title}
                    </p>
                    <span className="text-xs shrink-0 text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-0.5 truncate">
                    {n.body}
                  </p>
                  {n.link_type === "order" && (
                    <p className="text-xs text-[#d4a017] mt-1">
                      View order →
                    </p>
                  )}
                  {n.link_type === "conversation" && (
                    <p className="text-xs text-[#185FA5] mt-1">
                      Open conversation →
                    </p>
                  )}
                </div>

                {/* Unread dot */}
                {isUnread && (
                  <div className="w-2 h-2 rounded-full bg-[#d4a017] self-center shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
