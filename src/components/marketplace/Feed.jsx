import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { fetchListings } from "../../lib/api";
import CreateListing from "./CreateListing";

// Fix Leaflet default icon (broken with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CATEGORY_OPTIONS = [
  { id: "furniture", label: "Furniture" },
  { id: "electronics", label: "Electronics" },
  { id: "books", label: "Books" },
  { id: "clothing", label: "Clothing" },
  { id: "kitchen", label: "Kitchen" },
  { id: "sports", label: "Sports" },
  { id: "other", label: "Other" },
];
const CONDITION_OPTIONS = [
  { id: "Like New", label: "Like New" },
  { id: "Good", label: "Good" },
  { id: "Fair", label: "Fair" },
];
const RADIUS_OPTIONS = [
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
  { value: 50, label: "50 mi" },
  { value: 100, label: "100 mi" },
];

// Multi-select dropdown - uses portal so dropdown is not clipped
function MultiSelectDropdown({ label, options, selected, onToggle, selectedLabels }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const [dropdownRect, setDropdownRect] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest("[data-filter-dropdown]")) return;
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    } else {
      setDropdownRect(null);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">
        {label}
      </p>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 border border-[#d4a017]/20 text-left text-sm text-[#1a1612] dark:text-[#f8f4ed] flex items-center justify-between"
      >
        <span className="truncate">
          {selectedLabels.length > 0 ? selectedLabels.join(", ") : `Select ${label}...`}
        </span>
        <span className="shrink-0 ml-1">{open ? "▲" : "▼"}</span>
      </button>
      {dropdownRect && open && createPortal(
        <div
          data-filter-dropdown
          className="fixed z-[9999] rounded-lg border border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#1a1612] shadow-xl py-1 max-h-56 overflow-y-auto"
          style={{ top: dropdownRect.top, left: dropdownRect.left, width: dropdownRect.width }}
        >
          {options.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[#d4a017]/10"
            >
              <input
                type="checkbox"
                checked={!!selected[opt.id]}
                onChange={() => onToggle(opt.id)}
                className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]"
              />
              <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
            </label>
          ))}
        </div>,
        document.body
      )}
      {selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {selectedLabels.map((lbl) => (
            <span
              key={lbl}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#d4a017]/20 text-[#b8860b] text-xs font-medium"
            >
              {lbl}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Map center updater (for when location changes)
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function Feed({ onPostClick, onMessage, searchQuery = "" }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const [categoryChecks, setCategoryChecks] = useState({});
  const [conditionChecks, setConditionChecks] = useState({});
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Location filter (sidebar - top, below New Listing)
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationRef = useRef(null);
  const locationInputRef = useRef(null);
  const [suggestionDropdownRect, setSuggestionDropdownRect] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest("[data-location-suggestions]")) return;
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (showLocationSuggestions && locationSuggestions.length > 0 && locationInputRef.current) {
      const rect = locationInputRef.current.getBoundingClientRect();
      setSuggestionDropdownRect({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) });
    } else {
      setSuggestionDropdownRect(null);
    }
  }, [showLocationSuggestions, locationSuggestions]);

  useEffect(() => {
    if (!locationQuery?.trim() || locationQuery.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationQuery)}&limit=5`)
        .then((r) => r.json())
        .then((data) => {
          setLocationSuggestions(data.features || []);
          setShowLocationSuggestions(true);
        })
        .catch(() => setLocationSuggestions([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  const selectLocation = (feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const name =
      feature.properties?.name ||
      feature.properties?.street ||
      feature.properties?.city ||
      feature.properties?.state ||
      "Selected location";
    setSelectedLocation({ lat, lng, name });
    setLocationQuery(name);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setLocationQuery("");
  };

  const loadListings = () => {
    setLoading(true);
    setError(null);
    fetchListings()
      .then((data) => {
        setListings(data.listings || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleCreated = () => {
    setShowCreate(false);
    loadListings();
  };

  const toggleCategory = (id) =>
    setCategoryChecks((p) => ({ ...p, [id]: !p[id] }));
  const toggleCondition = (id) =>
    setConditionChecks((p) => ({ ...p, [id]: !p[id] }));

  const activeCategories = Object.entries(categoryChecks)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const activeConditions = Object.entries(conditionChecks)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const filteredListings = listings.filter((listing) => {
    const matchCategory =
      activeCategories.length === 0 ||
      activeCategories.includes((listing.category || "").toLowerCase());
    const matchCondition =
      activeConditions.length === 0 ||
      activeConditions.includes(listing.condition);
    const matchSearch =
      !searchQuery ||
      (listing.title || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (listing.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (listing.seller_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    const matchPrice =
      (!priceMin && !priceMax) ||
      ((isNaN(min) || listing.price >= min) &&
        (isNaN(max) || listing.price <= max));

    // Location filter (if listing has lat/lng or neighbourhood)
    let matchLocation = true;
    if (selectedLocation && listing.neighbourhood) {
      // Simple text match for neighbourhood when no coords on listing
      const listingLoc = (listing.neighbourhood || "").toLowerCase();
      const searchLoc = selectedLocation.name.toLowerCase();
      matchLocation = listingLoc.includes(searchLoc) || searchLoc.includes(listingLoc);
    }

    return matchCategory && matchCondition && matchSearch && matchPrice && matchLocation;
  });

  const toggleLike = (id) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const defaultCenter = [39.8283, -98.5795]; // US center
  const mapCenter = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : defaultCenter;

  return (
    <div className="flex pb-8 min-h-[calc(100vh-4rem)]">
      {showCreate && (
        <CreateListing
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}

      {/* ── Left: Filters sidebar ── */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-[4.25rem] self-start h-[calc(100vh-5rem)] overflow-y-auto border-r border-[#d4a017]/20 bg-[#f8f4ed] dark:bg-[#1a1612] py-4 pl-4 pr-2">
        <div className="space-y-4">
          {/* Create listing button */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#d4a017]/40 hover:border-[#d4a017] hover:bg-[#d4a017]/5 transition-all flex items-center justify-center gap-2 text-[#d4a017] font-semibold text-sm"
          >
            <span className="text-base">+</span> New Listing
          </button>

          {/* Location: Map + input + radius (top of sidebar, below New Listing) */}
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">
              Location
            </p>
            <div className="rounded-lg overflow-hidden border border-[#d4a017]/20 bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 relative">
              <div className="h-32 relative">
                <MapContainer
                  key={selectedLocation ? `${selectedLocation.lat}-${selectedLocation.lng}` : "default"}
                  center={mapCenter}
                  zoom={selectedLocation ? 14 : 4}
                  className="h-full w-full"
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {selectedLocation && (
                    <>
                      <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                        <Popup>{selectedLocation.name}</Popup>
                      </Marker>
                      <Circle
                        center={[selectedLocation.lat, selectedLocation.lng]}
                        radius={radiusMiles * 1609.34}
                        pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 2 }}
                      />
                    </>
                  )}
                  <MapCenterUpdater center={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null} />
                </MapContainer>
                {selectedLocation && (
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-[#2563eb]/90 text-white text-xs font-medium shadow">
                    Radius: {radiusMiles} mi
                  </div>
                )}
              </div>
              <div className="p-2 space-y-2">
                <div className="relative" ref={locationRef}>
                  <input
                    ref={locationInputRef}
                    type="text"
                    placeholder="Type a location..."
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    onFocus={() => locationSuggestions.length > 0 && setShowLocationSuggestions(true)}
                    className="w-full px-3 py-2 rounded-lg bg-[#f8f4ed] dark:bg-[#1a1612] border border-[#d4a017]/20 text-sm text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
                  />
                  {selectedLocation && (
                    <button
                      type="button"
                      onClick={clearLocation}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#3d2c1e]/60 hover:text-[#d4a017]"
                    >
                      ✕
                    </button>
                  )}
                  {suggestionDropdownRect &&
                    createPortal(
                      <div
                        data-location-suggestions
                        className="fixed z-[9999] rounded-lg border border-[#d4a017]/30 bg-[#f8f4ed] dark:bg-[#1a1612] shadow-xl py-1 max-h-48 overflow-y-auto"
                        style={{
                          top: suggestionDropdownRect.top,
                          left: suggestionDropdownRect.left,
                          width: suggestionDropdownRect.width,
                        }}
                      >
                        {locationSuggestions.map((f, i) => {
                          const name =
                            f.properties?.name ||
                            f.properties?.street ||
                            f.properties?.city ||
                            f.properties?.state ||
                            "Location";
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectLocation(f)}
                              className="w-full px-3 py-2.5 text-left text-sm text-[#1a1612] dark:text-[#f8f4ed] hover:bg-[#d4a017]/10"
                            >
                              {name}
                              {f.properties?.city && f.properties?.city !== name && (
                                <span className="text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60"> · {f.properties.city}</span>
                              )}
                            </button>
                          );
                        })}
                      </div>,
                      document.body
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 shrink-0">Radius:</label>
                  <select
                    value={radiusMiles}
                    onChange={(e) => setRadiusMiles(Number(e.target.value))}
                    className="flex-1 px-2 py-1.5 rounded text-sm bg-[#f8f4ed] dark:bg-[#1a1612] border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed]"
                  >
                    {RADIUS_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Category dropdown */}
          <MultiSelectDropdown
            label="Category"
            options={CATEGORY_OPTIONS}
            selected={categoryChecks}
            onToggle={toggleCategory}
            selectedLabels={activeCategories.map(
              (id) => CATEGORY_OPTIONS.find((o) => o.id === id)?.label || id
            )}
          />

          {/* Condition dropdown */}
          <MultiSelectDropdown
            label="Condition"
            options={CONDITION_OPTIONS}
            selected={conditionChecks}
            onToggle={toggleCondition}
            selectedLabels={activeConditions.map(
              (id) => CONDITION_OPTIONS.find((o) => o.id === id)?.label || id
            )}
          />

          {/* Price Range */}
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">
              Price Range ($)
            </p>
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

      {/* ── Center: Feed ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile: filter bar + create button */}
        <div className="md:hidden sticky top-[4.25rem] z-10 bg-[#f8f4ed] dark:bg-[#1a1612] border-b border-[#d4a017]/20 px-4 py-2 space-y-2">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-2 rounded-xl border-2 border-dashed border-[#d4a017]/40 hover:border-[#d4a017] hover:bg-[#d4a017]/5 transition-all flex items-center justify-center gap-2 text-[#d4a017] font-semibold text-sm"
          >
            <span className="text-base">+</span> Create New Listing
          </button>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#3d2c1e]/10 border border-[#d4a017]/20 cursor-pointer shrink-0"
              >
                <input
                  type="checkbox"
                  checked={!!categoryChecks[opt.id]}
                  onChange={() => toggleCategory(opt.id)}
                  className="rounded border-[#d4a017]/50 text-[#d4a017]"
                />
                <span className="text-xs text-[#1a1612] dark:text-[#f8f4ed] whitespace-nowrap">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto md:max-w-[42rem] w-full flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                Loading listings...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 px-6 text-center">
              <p className="text-2xl">⚠️</p>
              <p className="text-sm font-medium text-[#1a1612] dark:text-[#f8f4ed]">
                Could not load listings
              </p>
              <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                {error}
              </p>
              <button
                onClick={loadListings}
                className="mt-2 px-4 py-2 rounded-lg bg-[#d4a017] text-white text-sm font-medium hover:bg-[#b8860b]"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredListings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 px-6 text-center">
              <p className="text-4xl">🦉</p>
              <p className="text-sm font-medium text-[#1a1612] dark:text-[#f8f4ed]">
                {listings.length === 0
                  ? "No listings yet"
                  : "No listings match your filters"}
              </p>
              <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                {listings.length === 0
                  ? "Be the first to post something for sale!"
                  : "Try adjusting your filters or search query."}
              </p>
              {listings.length === 0 && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#d4a017] text-white text-sm font-bold hover:bg-[#b8860b] transition-colors"
                >
                  + Create listing
                </button>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            filteredListings.map((listing) => {
              const isLiked = likedPosts.has(listing.id);
              const sellerInitials = (listing.seller_name || "?")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const deliveryParts = (listing.delivery_option || "pickup").split(
                ","
              );
              const hasPickup = deliveryParts.includes("pickup");
              const hasDelivery = deliveryParts.includes("delivery");

              return (
                <article
                  key={listing.id}
                  className="border-b border-[#d4a017]/20"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => onPostClick(listing.seller_id)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-xs font-bold text-[#b8860b] shrink-0">
                        {sellerInitials}
                      </div>
                      <div className="text-left min-w-0">
                        <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f8f4ed] truncate">
                          {listing.seller_name || "Unknown seller"}
                          <span className="ml-1 text-[#d4a017]">✓</span>
                        </p>
                        {listing.neighbourhood && (
                          <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 truncate">
                            📍 {listing.neighbourhood}
                          </p>
                        )}
                      </div>
                    </button>
                    <button className="p-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#d4a017]">
                      ⋮
                    </button>
                  </div>

                  <button
                    onClick={() => onPostClick(listing.seller_id)}
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
                        <span className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">
                          No image
                        </span>
                      </div>
                    )}
                  </button>

                  <div className="flex items-center gap-4 px-4 py-2">
                    <button
                      onClick={() => toggleLike(listing.id)}
                      className="p-1 text-xl"
                    >
                      {isLiked ? "❤️" : "🤍"}
                    </button>
                    <button
                      onClick={() => onPostClick(listing.seller_id)}
                      className="p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                    >
                      💬
                    </button>
                    <button
                      onClick={() =>
                        onMessage?.({
                          id: listing.seller_id,
                          name: listing.seller_name,
                        })
                      }
                      className="p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                    >
                      ✉️
                    </button>
                    <button
                      onClick={() => onPostClick(listing.seller_id)}
                      className="ml-auto p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                    >
                      🔖
                    </button>
                  </div>

                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed]">
                        ${parseFloat(listing.price || 0).toFixed(2)}
                      </p>
                      {listing.condition && (
                        <span className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                          · {listing.condition}
                        </span>
                      )}
                      {hasPickup && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#d4a017]/15 text-[#b8860b]">
                          🤝 Pickup
                        </span>
                      )}
                      {hasDelivery && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">
                          📦 Delivery
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#1a1612] dark:text-[#f8f4ed] mt-0.5">
                      <span className="font-semibold mr-2">
                        {listing.seller_name}
                      </span>
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
                      onClick={() => onPostClick(listing.seller_id)}
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
