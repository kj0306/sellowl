import { useState, useEffect } from "react";
import { getMe, fetchUserListings } from "../../lib/api";
import CreateListing from "../marketplace/CreateListing";

export default function MyProfile({ onMessage, onOffers, offersCount = 0 }) {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [showCreateListing, setShowCreateListing] = useState(false);

  const loadData = async () => {
    try {
      const meData = await getMe();
      const u = meData.user;
      setUser(u);
      const listingsData = await fetchUserListings(u.id);
      setListings(listingsData.listings || []);
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleListingCreated = () => {
    setShowCreateListing(false);
    setLoading(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = (user?.display_name || user?.email || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="pb-8">
      {showCreateListing && (
        <CreateListing
          onClose={() => setShowCreateListing(false)}
          onCreated={handleListingCreated}
        />
      )}

      {/* Profile header */}
      <div className="px-4 py-6 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <div className="flex gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-3xl font-bold text-[#1a1612] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
              {user?.display_name || user?.email?.split("@")[0]}
            </h2>
            <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
              {user?.email}
            </p>
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">{listings.length}</p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">listings</p>
              </div>
            </div>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 mt-3 text-[#d4a017] text-sm">
          ✓ Verified .edu
        </span>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowCreateListing(true)}
            className="flex-1 py-2 rounded-lg bg-[#d4a017] hover:bg-[#b8860b] text-white font-medium text-sm transition-colors"
          >
            + New Listing
          </button>
          <button
            onClick={onOffers}
            className="flex-1 py-2 rounded-lg bg-[#1a1612] dark:bg-[#f8f4ed] text-[#f8f4ed] dark:text-[#1a1612] font-medium text-sm"
          >
            Order Requests {offersCount > 0 ? `(${offersCount})` : ""}
          </button>
          <button
            onClick={() => onMessage?.(null)}
            className="flex-1 py-2 rounded-lg border border-[#3d2c1e]/30 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm"
          >
            Messages
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "all"
              ? "text-[#d4a017] border-b-2 border-[#d4a017]"
              : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
          }`}
        >
          My Listings
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "offers"
              ? "text-[#d4a017] border-b-2 border-[#d4a017]"
              : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
          }`}
        >
          {offersCount > 0 ? `${offersCount} Offers` : "Offers"}
        </button>
      </div>

      <div className="mt-4 px-4">
        {activeTab === "all" ? (
          listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-4xl">🦉</span>
              <p className="text-sm font-medium text-[#1a1612] dark:text-[#f8f4ed]">No listings yet</p>
              <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                Tap "+ New Listing" to post your first item
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {listings.map((listing) => (
                <div key={listing.id} className="aspect-square relative overflow-hidden bg-[#3d2c1e]/10 rounded">
                  {listing.image_url ? (
                    <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                    <p className="text-white text-xs font-medium truncate">${listing.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="py-8">
            <p className="text-center text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 text-sm mb-4">
              Your order requests from buyers
            </p>
            <button
              onClick={onOffers}
              className="w-full py-3 rounded-lg bg-[#d4a017] hover:bg-[#b8860b] text-white font-medium text-sm"
            >
              View Order Requests
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
