import { useState, useEffect } from "react";
import { fetchListings } from "../../lib/api";
import CreateListing from "./CreateListing";

const CATEGORIES = ["All", "Furniture", "Electronics", "Books", "Clothing", "Kitchen", "Sports", "Other"];
const CONDITIONS = ["All", "Like New", "Good", "Fair"];

export default function Feed({ onPostClick, searchQuery = "" }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likedIds, setLikedIds] = useState(new Set());
  const [showCreate, setShowCreate] = useState(false);

  // Filters
  const [category, setCategory] = useState("All");
  const [condition, setCondition] = useState("All");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("all"); // all | pickup | delivery

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchListings();
      setListings(data.listings || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadListings(); }, []);

  const handleCreated = () => {
    setShowCreate(false);
    loadListings();
  };

  const toggleLike = (id) =>
    setLikedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const filtered = listings.filter((l) => {
    if (category !== "All" && l.category !== category) return false;
    if (condition !== "All" && l.condition !== condition) return false;
    if (priceMin && l.price < parseFloat(priceMin)) return false;
    if (priceMax && l.price > parseFloat(priceMax)) return false;
    if (deliveryFilter === "pickup" && !l.delivery_option?.includes("pickup")) return false;
    if (deliveryFilter === "delivery" && !l.delivery_option?.includes("delivery")) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.title?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) ||
        l.seller_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      {showCreate && (
        <CreateListing onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {/* ── Create Listing card (above categories) ── */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full mb-4 flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#221e1a] rounded-2xl border border-[#d4a017]/20 shadow-sm hover:shadow-md hover:border-[#d4a017]/50 transition-all group"
      >
        <div className="w-9 h-9 rounded-full bg-[#d4a017]/20 flex items-center justify-center shrink-0">
          <span className="text-[#d4a017] text-lg font-bold leading-none">+</span>
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40 group-hover:text-[#3d2c1e]/70 dark:group-hover:text-[#f8f4ed]/70 transition-colors">
            What are you selling today?
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-lg">📷</span>
          <span className="text-xs font-semibold text-[#d4a017] bg-[#d4a017]/10 px-3 py-1.5 rounded-full whitespace-nowrap">
            List item
          </span>
        </div>
      </button>

      {/* ── Filters ── */}
      <div className="space-y-3 mb-5">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border shrink-0 transition-colors ${
                category === cat
                  ? "bg-[#d4a017] border-[#d4a017] text-white"
                  : "border-[#d4a017]/25 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:border-[#d4a017]/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Condition + Delivery + Price in a row */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="flex-1 min-w-[100px] px-2 py-1.5 rounded-lg bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-xs text-[#3d2c1e] dark:text-[#f8f4ed] focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
          >
            {CONDITIONS.map((c) => <option key={c} value={c}>{c === "All" ? "All conditions" : c}</option>)}
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="flex-1 min-w-[100px] px-2 py-1.5 rounded-lg bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-xs text-[#3d2c1e] dark:text-[#f8f4ed] focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
          >
            <option value="all">All delivery</option>
            <option value="pickup">🤝 Pickup only</option>
            <option value="delivery">📦 Delivery</option>
          </select>

          <div className="flex gap-1 items-center">
            <input
              type="number"
              placeholder="$min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-xs text-[#3d2c1e] dark:text-[#f8f4ed] focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
            />
            <span className="text-xs text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40">–</span>
            <input
              type="number"
              placeholder="$max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-xs text-[#3d2c1e] dark:text-[#f8f4ed] focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Results count ── */}
      {!loading && !error && (
        <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 mb-3">
          {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== listings.length && ` of ${listings.length}`}
        </p>
      )}

      {/* ── States ── */}
      {loading && (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Loading listings…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-col items-center py-20 gap-3">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={loadListings} className="text-xs text-[#d4a017] hover:underline">Try again</button>
        </div>
      )}

      {!loading && !error && listings.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
          <span className="text-5xl">🦉</span>
          <p className="text-base font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">No listings yet</p>
          <p className="text-sm text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Be the first to post something!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#d4a017] text-white text-sm font-semibold hover:bg-[#b8860b] transition-colors"
          >
            + Create listing
          </button>
        </div>
      )}

      {!loading && !error && listings.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-2 text-center">
          <span className="text-4xl">🔍</span>
          <p className="text-sm font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">No listings match your filters</p>
          <button
            onClick={() => { setCategory("All"); setCondition("All"); setPriceMin(""); setPriceMax(""); setDeliveryFilter("all"); }}
            className="text-xs text-[#d4a017] hover:underline mt-1"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Grid ── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              liked={likedIds.has(listing.id)}
              onLike={() => toggleLike(listing.id)}
              onClick={() => onPostClick(listing.seller_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing, liked, onLike, onClick }) {
  const initials = (listing.seller_name || "?").slice(0, 2).toUpperCase();
  const deliveryParts = (listing.delivery_option || "pickup").split(",");
  const hasPickup = deliveryParts.includes("pickup");
  const hasDelivery = deliveryParts.includes("delivery");

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-[#d4a017]/15 overflow-hidden bg-white dark:bg-[#221e1a] shadow-sm hover:shadow-md hover:border-[#d4a017]/30 transition-all cursor-pointer group"
    >
      {/* Seller header */}
      <div className="flex items-center gap-2 px-2.5 py-2 border-b border-[#d4a017]/8">
        <div className="w-6 h-6 rounded-full bg-[#d4a017]/25 flex items-center justify-center text-[10px] font-bold text-[#b8860b] shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-[#1a1612] dark:text-[#f8f4ed] truncate">
            {listing.seller_name || "Seller"}
          </p>
          {listing.neighbourhood && (
            <p className="text-[9px] text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 truncate">
              📍 {listing.neighbourhood}
            </p>
          )}
        </div>
      </div>

      {/* Image */}
      <div className="aspect-square bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 flex items-center justify-center overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-3xl opacity-30">📦</span>
        )}
      </div>

      {/* Details */}
      <div className="px-2.5 py-2.5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-[#d4a017]">
            ${parseFloat(listing.price || 0).toFixed(2)}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            className="text-base leading-none transition-transform hover:scale-125"
            aria-label="Like"
          >
            {liked ? "❤️" : "🤍"}
          </button>
        </div>
        <p className="text-xs font-semibold text-[#1a1612] dark:text-[#f8f4ed] mt-0.5 line-clamp-2">
          {listing.title}
        </p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {listing.condition && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3d2c1e]/8 dark:bg-[#f8f4ed]/8 text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
              {listing.condition}
            </span>
          )}
          {hasPickup && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#d4a017]/12 text-[#b8860b]">
              🤝 Pickup
            </span>
          )}
          {hasDelivery && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#3d2c1e]/8 dark:bg-[#f8f4ed]/8 text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
              📦
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
