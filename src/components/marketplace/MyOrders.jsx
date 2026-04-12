import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchOutgoingOrders, fetchIncomingOrders, updateOrder } from "../../lib/api";

// ── helpers ────────────────────────────────────────────────────────
const STATUS_META = {
  pending:   { label: "Pending",   bg: "bg-[#d4a017]/15",          text: "text-[#b8860b]" },
  accepted:  { label: "Accepted",  bg: "bg-green-100 dark:bg-green-900/30",  text: "text-green-700 dark:text-green-400" },
  rejected:  { label: "Declined",  bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-600 dark:text-red-400" },
  cancelled: { label: "Cancelled", bg: "bg-gray-100 dark:bg-gray-800",  text: "text-gray-500 dark:text-gray-400" },
  expired:   { label: "Expired",   bg: "bg-gray-100 dark:bg-gray-800",  text: "text-gray-400 dark:text-gray-500" },
  completed: { label: "Completed", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400" },
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 2) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function daysLeft(iso) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h left`;
  return `${h}h left`;
}

// ── Single order card ───────────────────────────────────────────
function OrderCard({ order, role }) {
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled]   = useState(false);
  const meta = STATUS_META[order.status] || STATUS_META.pending;
  const expires = order.status === "pending" ? daysLeft(order.expires_at) : null;
  const isUrgent = expires && (expires.includes("h left") || expires.startsWith("0d"));

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order request?")) return;
    setCancelling(true);
    try {
      await updateOrder(order.id, { action: "cancel" });
      setCancelled(true);
    } catch { /* show nothing */ }
    finally { setCancelling(false); }
  };

  if (cancelled) return null;

  const otherName  = role === "buyer" ? order.seller_name : order.buyer_name;
  const otherId    = role === "buyer" ? order.seller_id   : order.buyer_id;
  const otherLabel = role === "buyer" ? "Seller" : "Buyer";

  return (
    <div className="border border-[#3d2c1e]/15 dark:border-[#f8f4ed]/15 rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 border-b border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
            {meta.label}
          </span>
          {expires && (
            <span className={`text-xs font-medium ${isUrgent ? "text-red-500" : "text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50"}`}>
              {isUrgent ? "⚠️ " : "⏳ "}{expires} to respond
            </span>
          )}
        </div>
        <span className="text-xs text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40">{timeAgo(order.created_at)}</span>
      </div>

      {/* Items */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        {order.items && order.items.map((item) => (
          <div key={item.id} className="flex gap-3 items-start">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title}
                className="w-14 h-14 rounded-lg object-cover shrink-0 bg-[#3d2c1e]/10" />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 flex items-center justify-center shrink-0">
                <span className="text-xl">📦</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1a1612] dark:text-[#f8f4ed] truncate">{item.title}</p>
              <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">{item.condition} · {item.category}</p>
              <p className="text-sm font-bold text-[#d4a017] mt-0.5">${parseFloat(item.price || 0).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">{otherLabel}</p>
          <button
            onClick={() => otherId && navigate(`/profile/${otherId}`)}
            className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed] hover:text-[#d4a017] transition-colors underline-offset-2 hover:underline"
          >
            {otherName || "—"}
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Total</p>
          <p className="text-lg font-bold text-[#1a1612] dark:text-[#f8f4ed]">
            ${parseFloat(order.total_amount || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Notes */}
      {order.buyer_note && (
        <div className="px-4 pb-3">
          <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 mb-0.5">Your note</p>
          <p className="text-sm italic text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 rounded px-2 py-1">
            "{order.buyer_note}"
          </p>
        </div>
      )}
      {order.seller_note && order.status !== "pending" && (
        <div className="px-4 pb-3">
          <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 mb-0.5">Seller's note</p>
          <p className="text-sm italic text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 rounded px-2 py-1">
            "{order.seller_note}"
          </p>
        </div>
      )}

      {/* Cancel button — buyer only, pending only */}
      {role === "buyer" && order.status === "pending" && (
        <div className="px-4 pb-3">
          <button onClick={handleCancel} disabled={cancelling}
            className="text-xs text-red-500 hover:text-red-600 underline disabled:opacity-50">
            {cancelling ? "Cancelling…" : "Cancel request"}
          </button>
        </div>
      )}

      {/* Accepted next steps hint */}
      {order.status === "accepted" && (
        <div className="mx-4 mb-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400">Next step</p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
            {role === "buyer"
              ? "Your order was accepted! Message the seller to arrange pickup and payment."
              : "You accepted this order. Message the buyer to coordinate pickup and payment."}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tabs ────────────────────────────────────────────────────────
const STATUS_FILTERS = ["all", "pending", "accepted", "rejected", "cancelled", "expired"];

export default function MyOrders() {
  const [tab, setTab]         = useState("purchases"); // purchases | sales
  const [filter, setFilter]   = useState("all");
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const statusParam = filter === "all" ? null : filter;
      const data = tab === "purchases"
        ? await fetchOutgoingOrders(statusParam)
        : await fetchIncomingOrders(statusParam);
      setOrders(data.orders || []);
    } catch (e) {
      setError(e.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [tab, filter]);

  useEffect(() => { load(); }, [load]);

  // counts per tab
  const pendingCount = orders.filter(o => o.status === "pending").length;

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">My Orders</h2>
        <p className="text-sm text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 mt-0.5">Track all your buying and selling activity</p>

        {/* Main tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { id: "purchases", label: "My Purchases" },
            { id: "sales",     label: "My Sales" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => { setTab(id); setFilter("all"); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === id
                  ? "bg-[#1a1612] dark:bg-[#f8f4ed] text-[#f8f4ed] dark:text-[#1a1612]"
                  : "text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 hover:bg-[#3d2c1e]/10"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-1.5 px-4 py-2 overflow-x-auto border-b border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10">
        {STATUS_FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              filter === f
                ? "bg-[#d4a017] text-white"
                : "bg-[#3d2c1e]/8 dark:bg-[#f8f4ed]/8 text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 hover:bg-[#d4a017]/20"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-6 h-6 border-2 border-[#d4a017]/30 border-t-[#d4a017] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-500 mb-3">{error}</p>
            <button onClick={load} className="text-sm text-[#d4a017] underline">Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <span className="text-5xl">🦉</span>
            <p className="text-sm font-semibold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
              {filter === "all"
                ? tab === "purchases" ? "You haven't placed any orders yet" : "No orders received yet"
                : `No ${filter} orders`}
            </p>
            {filter !== "all" && (
              <button onClick={() => setFilter("all")} className="text-sm text-[#d4a017] underline">Show all</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} role={tab === "purchases" ? "buyer" : "seller"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}