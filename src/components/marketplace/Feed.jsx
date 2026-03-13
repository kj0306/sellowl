import { useState, useEffect } from "react";
import { fetchListings } from "../../lib/api";

const ZONE_OPTIONS = [
  { id: "products", label: "Products Zone" },
  { id: "sublease", label: "Sublease Zone" },
];
const CATEGORY_OPTIONS = [
  { id: "furniture", label: "Furniture" },
  { id: "electronics", label: "Electronics" },
  { id: "books", label: "Books" },
  { id: "housing", label: "Sublease" },
  { id: "other", label: "Other" },
];
const CONDITION_OPTIONS = [
  { id: "Like New", label: "Like New" },
  { id: "Good", label: "Good" },
  { id: "Fair", label: "Fair" },
];

export default function Feed({ onPostClick, onMessage, searchQuery = "" }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categoryChecks, setCategoryChecks] = useState({});
  const [conditionChecks, setConditionChecks] = useState({});
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Fetch real listings from the API on mount
  useEffect(() => {
    fetchListings()
      .then((data) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleCategory = (id) => setCategoryChecks((p) => ({ ...p, [id]: !p[id] }));
  const toggleCondition = (id) => setConditionChecks((p) => ({ ...p, [id]: !p[id] }));

  const activeCategories = Object.entries(categoryChecks).filter(([, v]) => v).map(([k]) => k);
  const activeConditions = Object.entries(conditionChecks).filter(([, v]) => v).map(([k]) => k);

  const filteredListings = listings.filter((listing) => {
    const matchCategory =
      activeCategories.length === 0 ||
      activeCategories.includes((listing.category || "").toLowerCase());
    const matchCondition =
      activeConditions.length === 0 ||
      activeConditions.includes(listing.condition);
    const matchSearch =
      !searchQuery ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (listing.seller?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    const matchPrice =
      (!priceMin && !priceMax) ||
      ((isNaN(min) || listing.price >= min) && (isNaN(max) || listing.price <= max));
    return matchCategory && matchCondition && matchSearch && matchPrice;
  });

  const toggleLike = (id) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex pb-8 min-h-[calc(100vh-4rem)]">
      {/* Left: Filters */}
      <aside className="hidden md:block w-60 shrink-0 sticky top-[4.25rem] self-start h-[calc(100vh-5rem)] overflow-y-auto border-r border-[#d4a017]/20 bg-[#f8f4ed] dark:bg-[#1a1612] py-4 pl-4 pr-2">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Category</p>
            {CATEGORY_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!categoryChecks[opt.id]}
                  onChange={() => toggleCategory(opt.id)}
                  className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]"
                />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Condition</p>
            {CONDITION_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!conditionChecks[opt.id]}
                  onChange={() => toggleCondition(opt.id)}
                  className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]"
                />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Price Range ($)</p>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                min={0}
                className="w-16 px-2 py-1 rounded text-sm bg-[#3d2c1e]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed]"
              />
              <span className="text-[#3d2c1e]/50">–</span>
              <input
                type="number"
                placeholder="Max"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                min={0}
                className="w-16 px-2 py-1 rounded text-sm bg-[#3d2c1e]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed]"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Center: Feed */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile filter bar */}
        <div className="md:hidden sticky top-[4.25rem] z-10 bg-[#f8f4ed] dark:bg-[#1a1612] border-b border-[#d4a017]/20 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#3d2c1e]/10 border border-[#d4a017]/20 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={!!categoryChecks[opt.id]}
                  onChange={() => toggleCategory(opt.id)}
                  className="rounded border-[#d4a017]/50 text-[#d4a017]"
                />
                <span className="text-xs text-[#1a1612] dark:text-[#f8f4ed] whitespace-nowrap">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto md:max-w-[42rem] w-full flex-1">
          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">Loading listings...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 px-6 text-center">
              <p className="text-2xl">⚠️</p>
              <p className="text-sm font-medium text-[#1a1612] dark:text-[#f8f4ed]">Could not load listings</p>
              <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">{error}</p>
              <button
                onClick={() => { setLoading(true); setError(null); fetchListings().then(d => { setListings(d.listings || []); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); }); }}
                className="mt-2 px-4 py-2 rounded-lg bg-[#d4a017] text-white text-sm font-medium hover:bg-[#b8860b]"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredListings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 px-6 text-center">
              <p className="text-4xl">🦉</p>
              <p className="text-sm font-medium text-[#1a1612] dark:text-[#f8f4ed]">
                {listings.length === 0 ? "No listings yet" : "No listings match your filters"}
              </p>
              <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                {listings.length === 0
                  ? "Be the first to post something for sale!"
                  : "Try adjusting your filters or search query."}
              </p>
            </div>
          )}

          {/* Real listings */}
          {!loading && !error && filteredListings.map((listing) => {
            const isLiked = likedPosts.has(listing.id);
            const sellerInitials = (listing.seller?.name || "?")
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <article key={listing.id} className="border-b border-[#d4a017]/20">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => onPostClick(listing.seller?.id)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-xs font-bold text-[#b8860b] shrink-0">
                      {sellerInitials}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f8f4ed] truncate">
                        {listing.seller?.name || "Unknown seller"}
                        <span className="ml-1 text-[#d4a017]">✓</span>
                      </p>
                      <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 truncate">
                        {listing.seller?.email?.split("@")[1] || ""}
                      </p>
                    </div>
                  </button>
                  <button className="p-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#d4a017]">⋮</button>
                </div>

                {/* Image or placeholder */}
                <button
                  onClick={() => onPostClick(listing.seller?.id)}
                  className="block w-full aspect-[4/3] bg-[#3d2c1e]/10 min-h-[280px] md:min-h-[320px]"
                >
                  {listing.image_url ? (
                    <img
                      src={listing.image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <span className="text-4xl">📦</span>
                      <span className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">No image</span>
                    </div>
                  )}
                </button>

                {/* Action bar */}
                <div className="flex items-center gap-4 px-4 py-2">
                  <button onClick={() => toggleLike(listing.id)} className="p-1 text-xl">
                    {isLiked ? "❤️" : "🤍"}
                  </button>
                  <button
                    onClick={() => onPostClick(listing.seller?.id)}
                    className="p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                  >
                    💬
                  </button>
                  <button
                    onClick={() => onMessage?.(listing.seller)}
                    className="p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                  >
                    ✉️
                  </button>
                  <button
                    onClick={() => onPostClick(listing.seller?.id)}
                    className="ml-auto p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                  >
                    🔖
                  </button>
                </div>

                {/* Caption */}
                <div className="px-4 pb-3">
                  <p className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed]">
                    ${listing.price.toFixed(2)}
                    {listing.condition && (
                      <span className="ml-2 text-xs font-normal text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                        · {listing.condition}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[#1a1612] dark:text-[#f8f4ed] mt-0.5">
                    <span className="font-semibold mr-2">{listing.seller?.name}</span>
                    {listing.title}
                  </p>
                  {listing.description && (
                    <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 mt-1">
                    {listing.category}
                  </p>
                  <button
                    onClick={() => onPostClick(listing.seller?.id)}
                    className="text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 text-sm mt-1 hover:text-[#d4a017]"
                  >
                    View profile & shop →
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
