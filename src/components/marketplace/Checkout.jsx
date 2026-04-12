import { useState } from "react";
import { placeOrder } from "../../lib/api";

/**
 * Checkout / Order Request screen.
 *
 * Props:
 *   items       – array of listing objects (each has id, title, price, condition, image_url)
 *   seller      – { id, name, email, display_name, university }
 *   onSuccess   – called with orderId after successful placement
 *   onError     – called with error message string
 *   isBag       – true when rendering from the Bag page
 */
export default function Checkout({ items, seller, onSuccess, onError, isBag }) {
  const [buyerNote, setBuyerNote]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");

  const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  const handlePlaceOrder = async () => {
    if (loading) return;
    setErrorMsg("");
    setLoading(true);
    try {
      const listingIds = items.map((i) => i.id);
      const data = await placeOrder({ listingIds, buyerNote });
      onSuccess?.(data.order_id);
    } catch (err) {
      const msg = err.message || "Could not place order. Please try again.";
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
          {isBag ? "Your Bag" : "Order Request"}
        </h2>
        {seller && (
          <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
            Seller: {seller.name || seller.display_name}
            {seller.university ? ` · ${seller.university}` : ""}
          </p>
        )}
      </div>

      {/* Item list */}
      <div className="divide-y divide-[#3d2c1e]/20 dark:divide-[#f8f4ed]/20">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4">
            {(item.image_url || item.image) ? (
              <img
                src={item.image_url || item.image}
                alt={item.title}
                className="w-20 h-20 rounded-lg object-cover shrink-0 bg-[#3d2c1e]/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 shrink-0 flex items-center justify-center text-2xl">
                📦
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[#1a1612] dark:text-[#f8f4ed] truncate">{item.title}</h3>
              <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">{item.condition}</p>
              {item.neighbourhood && (
                <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">{item.neighbourhood}</p>
              )}
              <p className="text-[#d4a017] font-semibold mt-1">${parseFloat(item.price || 0).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Buyer note */}
      <div className="px-4 pt-3 pb-1">
        <label className="block text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mb-1">
          Message to seller (optional)
        </label>
        <textarea
          value={buyerNote}
          onChange={(e) => setBuyerNote(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="E.g. Available for pickup Saturday afternoon"
          className="w-full text-sm rounded-lg border border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 bg-transparent
                     text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/40 dark:placeholder-[#f8f4ed]/40
                     px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#d4a017]"
        />
      </div>

      {/* Summary + CTA */}
      <div className="p-4 border-t border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 space-y-4 mt-2">
        <div className="flex justify-between text-lg">
          <span className="text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
            Total ({items.length} item{items.length !== 1 ? "s" : ""})
          </span>
          <span className="font-bold text-[#1a1612] dark:text-[#f8f4ed]">${total.toFixed(2)}</span>
        </div>

        <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
          In-person payment only (cash / peer-to-peer). No in-app payment in MVP.
          The seller has <strong>3 days</strong> to accept or decline your request.
        </p>

        {errorMsg && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={loading || items.length === 0}
          className="w-full py-3 rounded-xl bg-[#d4a017] hover:bg-[#b8860b] disabled:opacity-60
                     text-white font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Placing request…
            </>
          ) : (
            "Place Order Request"
          )}
        </button>
      </div>
    </div>
  );
}
