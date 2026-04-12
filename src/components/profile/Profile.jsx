import { useState, useEffect } from "react";
import { fetchUserAllListings } from "../../lib/api";

// ─── Listing Detail Modal ────────────────────────────────────────
function ListingDetail({ listing, seller, onClose, onCheckout, onAddToBag, onMessage, isOwnProfile }) {
  if (!listing) return null;
  const deliveryParts = (listing.delivery_option || "pickup").split(",");
  const hasPickup   = deliveryParts.includes("pickup");
  const hasDelivery = deliveryParts.includes("delivery");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#f8f4ed] dark:bg-[#1a1612] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">

        {/* Close bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d4a017]/20 shrink-0">
          <button
            onClick={onClose}
            className="text-sm font-medium text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#d4a017] transition-colors"
          >
            ← Back
          </button>
          <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Listing details</p>
          <div className="w-12" />
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Image */}
          <div className="aspect-[4/3] bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/5 flex items-center justify-center">
            {listing.image_url ? (
              <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#3d2c1e]/20 dark:text-[#f8f4ed]/20">
                <span className="text-5xl">📦</span>
                <span className="text-sm">No photo</span>
              </div>
            )}
          </div>

          <div className="px-4 py-4 space-y-4">
            {/* Price + title */}
            <div>
              <p className="text-2xl font-bold text-[#d4a017]">
                ${parseFloat(listing.price || 0).toFixed(2)}
              </p>
              <p className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] mt-1">
                {listing.title}
              </p>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap gap-2">
              {listing.condition && (
                <span className="text-xs px-3 py-1 rounded-full border border-[#d4a017]/30 text-[#b8860b] font-medium">
                  {listing.condition}
                </span>
              )}
              {listing.category && (
                <span className="text-xs px-3 py-1 rounded-full bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
                  {listing.category}
                </span>
              )}
              {hasPickup && (
                <span className="text-xs px-3 py-1 rounded-full bg-[#d4a017]/15 text-[#b8860b] font-medium">
                  🤝 Pickup
                </span>
              )}
              {hasDelivery && (
                <span className="text-xs px-3 py-1 rounded-full bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                  📦 Delivery
                </span>
              )}
            </div>

            {/* Description */}
            {listing.description && (
              <div>
                <p className="text-xs font-bold text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-sm text-[#1a1612] dark:text-[#f8f4ed] leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Location */}
            {listing.neighbourhood && (
              <div className="flex items-center gap-2 text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
                <span>📍</span>
                <span>{listing.neighbourhood}</span>
              </div>
            )}

            {/* Seller */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 border border-[#d4a017]/15">
              <div className="w-9 h-9 rounded-full bg-[#d4a017]/25 flex items-center justify-center text-sm font-bold text-[#b8860b] shrink-0">
                {(seller?.display_name || listing.seller_name || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed] truncate">
                  {listing.seller_name || "Seller"}
                  <span className="ml-1 text-[#d4a017] text-xs">✓</span>
                </p>
                <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 truncate">
                  {listing.seller_email || ""}
                </p>
              </div>
              <button
                onClick={() => onMessage?.({ id: listing.seller_id, name: listing.seller_name })}
                className="text-xs font-semibold text-[#d4a017] hover:text-[#b8860b] transition-colors"
              >
                Message
              </button>
            </div>

            {/* Posted date */}
            {listing.created_at && (
              <p className="text-xs text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40">
                Posted {new Date(listing.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="px-4 py-3 border-t border-[#d4a017]/20 shrink-0 flex gap-2">
          {listing.is_available === false ? (
            <div className="flex-1 flex items-center justify-center gap-3 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <img src="/sold-stamp.svg" alt="Sold" className="w-8 h-8 shrink-0" />
              <span className="text-sm font-bold text-red-600 dark:text-red-400">This item has been sold</span>
            </div>
          ) : (
            <>
              {onAddToBag && !isOwnProfile && (
                <button
                  onClick={() => { onAddToBag([listing], { id: listing.seller_id, name: listing.seller_name }); onClose(); }}
                  className="flex-1 py-3 rounded-xl border-2 border-[#d4a017] text-[#d4a017] font-semibold text-sm hover:bg-[#d4a017]/10 transition-colors"
                >
                  Add to Bag
                </button>
              )}
              <button
                disabled={isOwnProfile}
                onClick={() => { if (!isOwnProfile) { onCheckout([listing], { id: listing.seller_id, name: listing.seller_name }); onClose(); } }}
                className="flex-1 py-3 rounded-xl bg-[#d4a017] hover:bg-[#b8860b] text-white font-semibold text-sm transition-colors"
              >
                Buy Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Profile Page ────────────────────────────────────────────────
export default function Profile({ profileId, currentUserId, onMessage, onCheckout, onAddToBag }) {
  const isOwnProfile = currentUserId && String(profileId) === String(currentUserId);
  const [listings, setListings]       = useState([]);
  const [sellerInfo, setSellerInfo]   = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectMode, setSelectMode]   = useState(false);
  const [detailListing, setDetailListing] = useState(null); // which listing is open in modal

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    fetchUserAllListings(profileId)
      .then((data) => {
        const items = data.listings || [];
        setListings(items);
        // Pull seller info from first listing
        if (items.length > 0) {
          setSellerInfo({
            id:           items[0].seller_id,
            display_name: items[0].seller_name,
            email:        items[0].seller_email,
          });
        }
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [profileId]);

  const toggleItem = (listing) => {
    if (listing.is_available === false) return; // can't select sold items
    setSelectedItems((prev) =>
      prev.some((p) => p.id === listing.id)
        ? prev.filter((p) => p.id !== listing.id)
        : [...prev, listing]
    );
  };

  const handleGridTap = (listing) => {
    if (selectMode) {
      toggleItem(listing);
    } else {
      setDetailListing(listing);
    }
  };

  const handleSelectAll = () => {
    setSelectedItems(selectedItems.length === listings.length ? [] : [...listings]);
  };

  const initials = (sellerInfo?.display_name || "?").slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 px-6 text-center">
        <p className="text-2xl">⚠️</p>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="pb-8 max-w-2xl mx-auto">

      {/* Listing detail modal */}
      {detailListing && (
        <ListingDetail
          listing={detailListing}
          seller={sellerInfo}
          onClose={() => setDetailListing(null)}
          onCheckout={onCheckout}
          onAddToBag={onAddToBag}
          onMessage={onMessage}
          isOwnProfile={isOwnProfile}
        />
      )}

      {/* ── Profile header ── */}
      <div className="px-4 py-6 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <div className="flex gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-3xl font-bold text-[#b8860b] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
              {sellerInfo?.display_name || "Seller"}
            </h2>
            <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 mt-0.5">
              {sellerInfo?.email || ""}
            </p>
            <div className="flex gap-6 mt-3">
              <div className="text-center">
                <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">{listings.length}</p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message + Select row */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onMessage?.({ id: sellerInfo?.id, name: sellerInfo?.display_name })}
            className="flex-1 py-2 rounded-lg bg-[#3d2c1e]/10 hover:bg-[#3d2c1e]/20 dark:hover:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm transition-colors"
          >
            Message
          </button>
          <button
            onClick={() => { setSelectMode((s) => !s); setSelectedItems([]); }}
            className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-colors ${
              selectMode
                ? "bg-[#d4a017] border-[#d4a017] text-white"
                : "border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 text-[#1a1612] dark:text-[#f8f4ed] hover:border-[#d4a017]/50"
            }`}
          >
            {selectMode ? "Cancel Select" : "Select Items"}
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2 text-center px-4">
          <span className="text-4xl">🦉</span>
          <p className="text-sm font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">No listings yet</p>
          <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">This seller hasn't posted anything.</p>
        </div>
      ) : (
        <div className="mt-1">
          <div className="grid grid-cols-3 gap-0.5">
            {listings.map((listing) => {
              const isSelected = selectedItems.some((p) => p.id === listing.id);
              const isSold = listing.is_available === false;
              return (
                <button
                  key={listing.id}
                  onClick={() => !isSold && handleGridTap(listing)}
                  className={`aspect-square relative overflow-hidden group ${
                    isSelected ? "ring-4 ring-[#d4a017] ring-inset" : ""
                  } ${isSold ? "cursor-default" : ""}`}
                >
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 flex items-center justify-center">
                      <span className="text-2xl opacity-40">📦</span>
                    </div>
                  )}

                  {/* Selected overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#d4a017]/40 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold drop-shadow">✓</span>
                    </div>
                  )}

                  {/* Select mode hint */}
                  {selectMode && !isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full border-2 border-white/80 bg-black/20" />
                  )}

                  {/* Price overlay (always visible) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5">
                    <p className="text-white text-xs font-bold">
                      ${parseFloat(listing.price || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* SOLD stamp overlay */}
                  {isSold && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <img
                        src="/sold-stamp.svg"
                        alt="Sold"
                        className="w-3/5 max-w-[96px] drop-shadow-lg select-none pointer-events-none"
                      />
                    </div>
                  )}

                  {/* Tap hint when not in select mode and not sold */}
                  {!selectMode && !isSold && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow bg-black/40 px-2 py-1 rounded-full">
                        View details
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sticky checkout bar (select mode) ── */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f8f4ed] dark:bg-[#1a1612] border-t border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 z-20">
          <div className="flex gap-2 max-w-lg mx-auto">
            <button
              onClick={handleSelectAll}
              className="flex-1 py-2.5 rounded-lg border-2 border-[#3d2c1e]/30 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm"
            >
              {selectedItems.length === listings.length ? "Deselect All" : "Select All"}
            </button>
            {onAddToBag && !isOwnProfile && (
              <button
                onClick={() => onAddToBag(selectedItems, sellerInfo)}
                className="flex-1 py-2.5 rounded-lg border-2 border-[#d4a017] text-[#d4a017] font-medium text-sm hover:bg-[#d4a017]/10 transition-colors"
              >
                Add to Bag ({selectedItems.length})
              </button>
            )}
            <button
              onClick={() => onCheckout(selectedItems, sellerInfo)}
              className="flex-1 py-2.5 rounded-lg bg-[#d4a017] hover:bg-[#b8860b] text-white font-medium text-sm transition-colors"
            >
              Checkout ({selectedItems.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}