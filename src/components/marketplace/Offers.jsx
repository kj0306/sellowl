import { useState, useEffect, useCallback } from "react";
import { fetchIncomingOrders, updateOrder } from "../../lib/api";

const STATUS_LABEL = {
  pending:   { label: "Pending",   cls: "bg-[#d4a017]/15 text-[#b8860b]" },
  accepted:  { label: "Accepted",  cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected:  { label: "Rejected",  cls: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
  expired:   { label: "Expired",   cls: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500" },
  completed: { label: "Completed", cls: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
};

function timeAgo(isoString) {
  if (!isoString) return "";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 2)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function ExpiryCountdown({ expiresAt }) {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return <span className="text-xs text-red-500">Expired</span>;
  const hours = Math.floor(remaining / 3600000);
  const days  = Math.floor(hours / 24);
  const label = days > 0 ? `${days}d ${hours % 24}h left` : `${hours}h left`;
  return (
    <span className={`text-xs ${hours < 12 ? "text-red-500" : "text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50"}`}>
      {label} to respond
    </span>
  );
}

function OrderCard({ order, onAction }) {
  const [actionLoading, setActionLoading] = useState(null); // "accept"|"reject"|null
  const [sellerNote, setSellerNote]       = useState("");
  const [showNote, setShowNote]           = useState(false);
  const [error, setError]                 = useState("");

  const handleAction = async (action) => {
    setActionLoading(action);
    setError("");
    try {
      await updateOrder(order.id, { action, sellerNote });
      onAction(order.id, action === "accept" ? "accepted" : "rejected");
    } catch (err) {
      setError(err.message || "Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const { label, cls } = STATUS_LABEL[order.status] || { label: order.status, cls: "" };
  const isPending = order.status === "pending";

  return (
    <div className={`p-4 ${isPending ? "bg-[#d4a017]/5 dark:bg-[#d4a017]/5" : ""}`}>
      {/* Buyer info + status */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-sm font-bold text-[#1a1612] shrink-0">
          {(order.buyer_name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-[#1a1612] dark:text-[#f8f4ed] truncate">
              {order.buyer_name || order.buyer_email || "Buyer"}
            </p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${cls}`}>
              {label}
            </span>
          </div>

          {/* Items */}
          <div className="mt-1 space-y-0.5">
            {order.items.map((item) => (
              <p key={item.id} className="text-sm text-[#3d2c1e]/80 dark:text-[#f8f4ed]/80">
                {item.title} — <span className="text-[#d4a017] font-medium">${parseFloat(item.price).toFixed(2)}</span>
              </p>
            ))}
          </div>

          {/* Total + time */}
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed]">
              Total: ${parseFloat(order.total_amount).toFixed(2)}
            </span>
            <span className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">
              {timeAgo(order.created_at)}
            </span>
            {isPending && order.expires_at && <ExpiryCountdown expiresAt={order.expires_at} />}
          </div>

          {/* Buyer note */}
          {order.buyer_note && (
            <p className="mt-2 text-sm italic text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 rounded px-2 py-1">
              "{order.buyer_note}"
            </p>
          )}

          {/* Seller's previous note (if responded) */}
          {order.seller_note && !isPending && (
            <p className="mt-2 text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
              Your note: {order.seller_note}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons (pending only) */}
      {isPending && (
        <div className="mt-3 pl-13">
          {order.listing_has_accepted_order && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1">
              This item was sold in another order — you can only decline this request.
            </p>
          )}
          {showNote && (
            <textarea
              value={sellerNote}
              onChange={(e) => setSellerNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Optional note to buyer (e.g. pickup time, location)"
              className="w-full text-sm rounded-lg border border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 bg-transparent
                         text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/40 px-3 py-2 resize-none
                         focus:outline-none focus:ring-1 focus:ring-[#d4a017] mb-2"
            />
          )}
          <div className="flex gap-2 flex-wrap">
            {!order.listing_has_accepted_order && (
              <button
                onClick={() => handleAction("accept")}
                disabled={!!actionLoading}
                className="px-4 py-2 rounded-lg bg-[#1a1612] dark:bg-[#f8f4ed] text-[#f8f4ed] dark:text-[#1a1612]
                           text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading === "accept" && (
                  <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                )}
                Accept
              </button>
            )}
            <button
              onClick={() => handleAction("reject")}
              disabled={!!actionLoading}
              className="px-4 py-2 rounded-lg border border-[#3d2c1e]/30 dark:border-[#f8f4ed]/30
                         text-[#1a1612] dark:text-[#f8f4ed] text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
            >
              {actionLoading === "reject" && (
                <span className="w-3 h-3 border border-gray-400/40 border-t-gray-600 rounded-full animate-spin" />
              )}
              Decline
            </button>
            <button
              onClick={() => setShowNote((s) => !s)}
              className="px-3 py-2 rounded-lg text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 hover:bg-[#3d2c1e]/5"
            >
              {showNote ? "Hide note" : "+ Add note"}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

const FILTERS = ["all", "pending", "accepted", "rejected", "cancelled", "expired"];

export default function Offers({ onPendingCountChange }) {
  const [orders, setOrders]       = useState([]);
  const [filter, setFilter]       = useState("pending");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const statusParam = filter === "all" ? null : filter;
      const data = await fetchIncomingOrders(statusParam);
      setOrders(data.orders || []);
      // Bubble pending count up to App for the nav badge
      const pending = (data.orders || []).filter((o) => o.status === "pending").length;
      onPendingCountChange?.(pending);
    } catch (err) {
      setError(err.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, [filter, onPendingCountChange]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Optimistic update after seller action, then refetch for accuracy
  const handleAction = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    // Refetch after a short delay so the expiry/audit data is fresh
    setTimeout(loadOrders, 800);
  };

  const filtered = orders; // already filtered by API; full list kept for tab counts

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0">
        <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
          Order Requests
        </h2>
        <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-0.5">
          Manage incoming requests from buyers
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 overflow-x-auto shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
              ${filter === f
                ? "bg-[#1a1612] dark:bg-[#f8f4ed] text-[#f8f4ed] dark:text-[#1a1612]"
                : "text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 hover:bg-[#3d2c1e]/10"
              }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-6 h-6 border-2 border-[#d4a017]/30 border-t-[#d4a017] rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</p>
            <button onClick={loadOrders} className="text-sm text-[#d4a017] underline">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 text-sm">
            {filter === "pending" ? "No pending order requests" : `No ${filter} orders`}
          </div>
        ) : (
          <div className="divide-y divide-[#3d2c1e]/20 dark:divide-[#f8f4ed]/20">
            {filtered.map((order) => (
              <OrderCard key={order.id} order={order} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}