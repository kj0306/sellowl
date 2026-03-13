import { useState, useEffect } from "react";
import { fetchUserListings } from "../../lib/api";

export default function Profile({ profileId, onMessage, onCheckout, onAddToBag }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    if (!profileId) return;
    setLoading(true);
    fetchUserListings(profileId)
      .then((data) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [profileId]);

  const toggleItem = (listing) => {
    setSelectedItems((prev) =>
      prev.some((p) => p.id === listing.id)
        ? prev.filter((p) => p.id !== listing.id)
        : [...prev, listing]
    );
  };

  const selectAll = () => {
    setSelectedItems(selectedItems.length === listings.length ? [] : [...listings]);
  };

  // Build a minimal seller object from the first listing or just the ID
  const seller = listings[0]
    ? { id: profileId, name: listings[0].seller_name, email: listings[0].seller_email }
    : { id: profileId };

  const sellerInitials = (seller?.name || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Profile header */}
      <div className="px-4 py-6 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <div className="flex gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-3xl font-bold text-[#1a1612] shrink-0">
            {sellerInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
              {seller?.name || `Seller #${profileId}`}
            </h2>
            {seller?.email && (
              <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
                {seller.email}
              </p>
            )}
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">{listings.length}</p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">items</p>
              </div>
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 mt-3 text-[#d4a017] text-sm">
          ✓ Verified .edu
        </span>

        <button
          onClick={() => onMessage(seller)}
          className="w-full mt-4 py-2 rounded-lg bg-[#3d2c1e]/10 hover:bg-[#3d2c1e]/20 dark:hover:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm transition-colors"
        >
          Message
        </button>
      </div>

      {/* Listings grid */}
      <div className="mt-4">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <span className="text-4xl">🦉</span>
            <p className="text-sm font-medium text-[#1a1612] dark:text-[#f8f4ed]">No listings yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-1">
            {listings.map((listing) => {
              const isSelected = selectedItems.some((p) => p.id === listing.id);
              return (
                <button
                  key={listing.id}
                  onClick={() => toggleItem(listing)}
                  className={`aspect-square relative overflow-hidden bg-[#3d2c1e]/10 ${
                    isSelected ? "ring-4 ring-[#d4a017] ring-inset" : ""
                  }`}
                >
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl">📦</span>
                      <span className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 px-1 truncate w-full text-center">
                        {listing.title}
                      </span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#d4a017]/40 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">✓</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                    <p className="text-white text-xs font-medium truncate">${listing.price.toFixed(2)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky action bar when items selected */}
      {selectedItems.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#f8f4ed] dark:bg-[#1a1612] border-t border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 z-20">
          <div className="flex gap-2 max-w-lg mx-auto">
            <button
              onClick={selectAll}
              className="flex-1 py-2.5 rounded-lg border-2 border-[#3d2c1e]/30 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm"
            >
              {selectedItems.length === listings.length ? "Deselect All" : "Select All"}
            </button>
            {onAddToBag && (
              <button
                onClick={() => onAddToBag(selectedItems, seller)}
                className="flex-1 py-2.5 rounded-lg border-2 border-[#d4a017] text-[#d4a017] font-medium text-sm hover:bg-[#d4a017]/10 transition-colors"
              >
                Add to Bag ({selectedItems.length})
              </button>
            )}
            <button
              onClick={() => onCheckout(selectedItems, seller)}
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
