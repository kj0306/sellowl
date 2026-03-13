import { useState } from "react";
import { posts, getProfileById, universities, currentUser, getDistanceMiles } from "../data/dummyData";

const ZONE_OPTIONS = [
  { id: "products", label: "Products Zone" },
  { id: "sublease", label: "Sublease Zone" },
];
const LOCATION_OPTIONS = [
  { id: "campus", label: "Near Campus" },
  { id: "downtown", label: "Downtown" },
  { id: "area", label: "Area" },
];
const CATEGORY_OPTIONS = [
  { id: "furniture", label: "Furniture" },
  { id: "electronics", label: "Electronics" },
  { id: "books", label: "Books" },
  { id: "housing", label: "Sublease" },
];
const CONDITION_OPTIONS = [
  { id: "Like New", label: "Like New" },
  { id: "Good", label: "Good" },
  { id: "Fair", label: "Fair" },
];
const AVAILABILITY_OPTIONS = [
  { id: "asap", label: "ASAP" },
  { id: "flexible", label: "Flexible" },
  { id: "now", label: "Available Now" },
  { id: "dec2024", label: "Dec 2024" },
  { id: "jan2025", label: "Jan 2025" },
  { id: "spring2025", label: "Spring 2025" },
];
const DISTANCE_OPTIONS = [
  { id: 5, label: "5 mi" },
  { id: 10, label: "10 mi" },
  { id: 25, label: "25 mi" },
  { id: 50, label: "50 mi" },
  { id: 100, label: "100 mi" },
];

export default function Feed({ onPostClick, onMessage, searchQuery = "" }) {
  const [zoneChecks, setZoneChecks] = useState({});
  const [locationChecks, setLocationChecks] = useState({});
  const [categoryChecks, setCategoryChecks] = useState({});
  const [universityChecks, setUniversityChecks] = useState({});
  const [conditionChecks, setConditionChecks] = useState({});
  const [availabilityChecks, setAvailabilityChecks] = useState({});
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [distanceRadius, setDistanceRadius] = useState("");
  const [likedPosts, setLikedPosts] = useState(new Set());

  const toggleZone = (id) => setZoneChecks((p) => ({ ...p, [id]: !p[id] }));
  const toggleLocation = (id) => setLocationChecks((p) => ({ ...p, [id]: !p[id] }));
  const toggleCategory = (id) => setCategoryChecks((p) => ({ ...p, [id]: !p[id] }));
  const toggleUniversity = (id) => setUniversityChecks((p) => ({ ...p, [id]: !p[id] }));
  const toggleCondition = (id) => setConditionChecks((p) => ({ ...p, [id]: !p[id] }));
  const toggleAvailability = (id) => setAvailabilityChecks((p) => ({ ...p, [id]: !p[id] }));

  const activeZones = Object.entries(zoneChecks).filter(([, v]) => v).map(([k]) => k);
  const activeLocations = Object.entries(locationChecks).filter(([, v]) => v).map(([k]) => k);
  const activeCategories = Object.entries(categoryChecks).filter(([, v]) => v).map(([k]) => k);
  const activeUniversities = Object.entries(universityChecks).filter(([, v]) => v).map(([k]) => k);
  const activeConditions = Object.entries(conditionChecks).filter(([, v]) => v).map(([k]) => k);
  const activeAvailabilities = Object.entries(availabilityChecks).filter(([, v]) => v).map(([k]) => k);

  const filteredPosts = posts.filter((post) => {
    const profile = getProfileById(post.profileId);
    const matchZone = activeZones.length === 0 || activeZones.includes(post.zone);
    const matchLocation = activeLocations.length === 0 || activeLocations.includes(post.location);
    const matchCategory = activeCategories.length === 0 || activeCategories.includes(post.category);
    const matchUniversity = activeUniversities.length === 0 || (profile && activeUniversities.includes(profile.university));
    const matchCondition = activeConditions.length === 0 || (post.condition && activeConditions.includes(post.condition));
    const matchAvailability = activeAvailabilities.length === 0 || (post.availability && activeAvailabilities.includes(post.availability));
    const matchSearch = !searchQuery || post.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    const matchPrice = (!priceMin && !priceMax) || (
      (isNaN(min) || (post.priceMax ?? 0) >= min) && (isNaN(max) || (post.priceMin ?? 0) <= max)
    );
    const distMiles = profile?.lat != null ? getDistanceMiles(currentUser.lat, currentUser.lng, profile.lat, profile.lng) : 0;
    const matchDistance = !distanceRadius || distMiles <= parseInt(distanceRadius, 10);
    return matchZone && matchLocation && matchCategory && matchUniversity && matchCondition && matchAvailability && matchSearch && matchPrice && matchDistance;
  });

  const toggleLike = (postId) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  return (
    <div className="flex pb-8 min-h-[calc(100vh-4rem)]">
      {/* Left: Filters - LinkedIn style */}
      <aside className="hidden md:block w-60 shrink-0 sticky top-[4.25rem] self-start h-[calc(100vh-5rem)] overflow-y-auto border-r border-[#d4a017]/20 bg-[#f8f4ed] dark:bg-[#1a1612] py-4 pl-4 pr-2">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Type</p>
            {ZONE_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={!!zoneChecks[opt.id]} onChange={() => toggleZone(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]" />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">University</p>
            {universities.slice(0, 8).map((u) => (
              <label key={u} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={!!universityChecks[u]} onChange={() => toggleUniversity(u)} className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]" />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed] truncate">{u}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Location</p>
            {LOCATION_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={!!locationChecks[opt.id]} onChange={() => toggleLocation(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]" />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Price Range ($)</p>
            <div className="flex gap-2 items-center">
              <input type="number" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} min={0} className="w-16 px-2 py-1 rounded text-sm bg-[#3d2c1e]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed]" />
              <span className="text-[#3d2c1e]/50">–</span>
              <input type="number" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} min={0} className="w-16 px-2 py-1 rounded text-sm bg-[#3d2c1e]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed]" />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Product Category</p>
            {CATEGORY_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={!!categoryChecks[opt.id]} onChange={() => toggleCategory(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]" />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Condition</p>
            {CONDITION_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={!!conditionChecks[opt.id]} onChange={() => toggleCondition(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]" />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Availability</p>
            {AVAILABILITY_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={!!availabilityChecks[opt.id]} onChange={() => toggleAvailability(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017] focus:ring-[#d4a017]" />
                <span className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">{opt.label}</span>
              </label>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide mb-2">Distance Radius</p>
            <select value={distanceRadius} onChange={(e) => setDistanceRadius(e.target.value)} className="w-full px-2 py-1.5 rounded text-sm bg-[#3d2c1e]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed]">
              <option value="">Any distance</option>
              {DISTANCE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Center: feed */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile: filters bar when sidebars hidden */}
        <div className="md:hidden sticky top-[4.25rem] z-10 bg-[#f8f4ed] dark:bg-[#1a1612] border-b border-[#d4a017]/20 px-4 py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {ZONE_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#3d2c1e]/10 border border-[#d4a017]/20 cursor-pointer shrink-0">
                <input type="checkbox" checked={!!zoneChecks[opt.id]} onChange={() => toggleZone(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017]" />
                <span className="text-xs text-[#1a1612] dark:text-[#f8f4ed] whitespace-nowrap">{opt.label}</span>
              </label>
            ))}
            {LOCATION_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#3d2c1e]/10 border border-[#d4a017]/20 cursor-pointer shrink-0">
                <input type="checkbox" checked={!!locationChecks[opt.id]} onChange={() => toggleLocation(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017]" />
                <span className="text-xs text-[#1a1612] dark:text-[#f8f4ed] whitespace-nowrap">{opt.label}</span>
              </label>
            ))}
            {CATEGORY_OPTIONS.map((opt) => (
              <label key={opt.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#3d2c1e]/10 border border-[#d4a017]/20 cursor-pointer shrink-0">
                <input type="checkbox" checked={!!categoryChecks[opt.id]} onChange={() => toggleCategory(opt.id)} className="rounded border-[#d4a017]/50 text-[#d4a017]" />
                <span className="text-xs text-[#1a1612] dark:text-[#f8f4ed] whitespace-nowrap">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="max-w-2xl mx-auto md:max-w-[42rem] w-full flex-1">
        {filteredPosts.map((post) => {
          const profile = getProfileById(post.profileId);
          const isLiked = likedPosts.has(post.id);
          return (
            <article
              key={post.id}
              className="border-b border-[#d4a017]/20"
            >
              {/* Post header - like Instagram */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => onPostClick(post.profileId)}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-xs font-bold text-[#b8860b] shrink-0">
                    {profile?.initials}
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-sm text-[#1a1612] dark:text-[#f8f4ed] truncate">
                      {profile?.name}
                      {profile?.verified && (
                        <span className="ml-1 text-[#d4a017]">✓</span>
                      )}
                    </p>
                    <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 truncate">
                      {profile?.location}
                    </p>
                  </div>
                </button>
                <button className="p-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#d4a017]">
                  ⋮
                </button>
              </div>

              {/* Post image - larger */}
              <button
                onClick={() => onPostClick(post.profileId)}
                className="block w-full aspect-[4/3] bg-[#3d2c1e]/20 min-h-[280px] md:min-h-[320px]"
              >
                <img
                  src={post.coverImage}
                  alt="Listing"
                  className="w-full h-full object-cover"
                />
              </button>

              {/* Action bar - Instagram style */}
              <div className="flex items-center gap-4 px-4 py-2">
                <button
                  onClick={() => toggleLike(post.id)}
                  className="p-1 text-xl"
                >
                  {isLiked ? "❤️" : "🤍"}
                </button>
                <button
                  onClick={() => onPostClick(post.profileId)}
                  className="p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                >
                  💬
                </button>
                <button
                  onClick={() => onMessage?.(profile)}
                  className="p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                >
                  ✉️
                </button>
                <button
                  onClick={() => onPostClick(post.profileId)}
                  className="ml-auto p-1 text-xl text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
                >
                  🔖
                </button>
              </div>

              {/* Caption - like Instagram */}
              <div className="px-4 pb-3">
                <p className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">
                  <span className="font-semibold mr-2">{profile?.name}</span>
                  {post.caption}
                </p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
                  {post.items} item{post.items > 1 ? "s" : ""} • {post.zone === "sublease" ? "Sublease" : post.category}
                </p>
                <button
                  onClick={() => onPostClick(post.profileId)}
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
