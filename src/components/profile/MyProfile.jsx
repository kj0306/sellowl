import { useState, useEffect } from "react";
import { getMe, fetchUserAllListings, deleteListing } from "../../lib/api";
import CreateListing from "../marketplace/CreateListing";
import ListingEngagement from "../marketplace/ListingEngagement";

// ─── Delete Confirmation Sheet ───────────────────────────────────
function DeleteConfirm({ listing, onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#f8f4ed] dark:bg-[#1a1612] rounded-t-2xl p-5 shadow-2xl">
        <div className="w-10 h-1 rounded-full bg-[#3d2c1e]/20 dark:bg-[#f8f4ed]/20 mx-auto mb-4" />
        <div className="flex gap-3 items-start mb-4">
          {listing.image_url && (
            <img src={listing.image_url} alt={listing.title}
              className="w-14 h-14 rounded-xl object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1612] dark:text-[#f8f4ed] line-clamp-2">{listing.title}</p>
            <p className="text-sm text-[#d4a017] font-semibold mt-0.5">
              ${parseFloat(listing.price || 0).toFixed(2)}
            </p>
          </div>
        </div>
        <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mb-5 text-center">
          Remove this listing? It will be hidden from the feed but kept in our records.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-3 rounded-xl border-2 border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 text-[#1a1612] dark:text-[#f8f4ed] font-semibold text-sm disabled:opacity-50">
            Keep it
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {deleting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Removing…</>
              : "Remove listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Listing Detail Modal (own listing) ─────────────────────────
function MyListingDetail({ listing, onClose, onDelete, currentUserId, onListingUpdate }) {
  const deliveryParts = (listing.delivery_option || "pickup").split(",");
  const hasPickup   = deliveryParts.includes("pickup");
  const hasDelivery = deliveryParts.includes("delivery");

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#f8f4ed] dark:bg-[#1a1612] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl">

        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d4a017]/20 shrink-0">
          <button onClick={onClose}
            className="text-sm font-medium text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#d4a017] transition-colors">
            ← Back
          </button>
          <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Your listing</p>
          <div className="w-12" />
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="aspect-[4/3] bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/5 flex items-center justify-center">
            {listing.image_url
              ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
              : <div className="flex flex-col items-center gap-2 text-[#3d2c1e]/20 dark:text-[#f8f4ed]/20">
                  <span className="text-5xl">📦</span>
                  <span className="text-sm">No photo</span>
                </div>
            }
          </div>

          <div className="px-4 py-4 space-y-4">
            <div>
              <p className="text-2xl font-bold text-[#d4a017]">
                ${parseFloat(listing.price || 0).toFixed(2)}
              </p>
              <p className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] mt-1">
                {listing.title}
              </p>
            </div>

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

            {listing.neighbourhood && (
              <div className="flex items-center gap-2 text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
                <span>📍</span><span>{listing.neighbourhood}</span>
              </div>
            )}

            {listing.created_at && (
              <p className="text-xs text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40">
                Posted {new Date(listing.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            )}

            <div className="pt-2 border-t border-[#d4a017]/15">
              <p className="text-xs font-bold text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 uppercase tracking-wide mb-2">
                Likes & comments
              </p>
              <ListingEngagement
                listing={listing}
                currentUserId={currentUserId}
                onMessage={null}
                hideDirectMessage
                onStatsChange={onListingUpdate}
              />
            </div>
          </div>
        </div>

        {/* Remove listing button / SOLD banner */}
        <div className="px-4 py-3 border-t border-[#d4a017]/20 shrink-0">
          {listing.is_available !== true ? (
            <div className="flex items-center justify-center gap-3 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <img src="/sold-stamp.svg" alt="Sold" className="w-10 h-10 shrink-0" />
              <span className="text-sm font-bold text-red-600 dark:text-red-400">This item has been sold</span>
            </div>
          ) : (
            <button
              onClick={() => { onClose(); onDelete(listing); }}
              className="w-full py-3 rounded-xl border-2 border-red-400 text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              🗑 Remove this listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main MyProfile ───────────────────────────────────────────────
export default function MyProfile({ onMessage, onOffers, offersCount = 0 }) {
  const [user, setUser]         = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showCreate, setShowCreate]       = useState(false);
  const [detailListing, setDetailListing] = useState(null); // listing detail modal
  const [deleteTarget, setDeleteTarget]   = useState(null); // listing pending delete confirm
  const [deleting, setDeleting]           = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const meData = await getMe();
      setUser(meData.user);
      const listingsData = await fetchUserAllListings(meData.user.id);
      setListings(listingsData.listings || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreated = () => {
    setShowCreate(false);
    loadData();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteListing(deleteTarget.id);
      setListings((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert("Could not remove listing: " + e.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={loadData} className="text-xs text-[#d4a017] hover:underline">Retry</button>
      </div>
    );
  }

  const initials = (user?.display_name || user?.email || "?").slice(0, 2).toUpperCase();

  return (
    <div className="pb-10 max-w-xl mx-auto px-4 sm:px-6">
      {/* Modals */}
      {showCreate && (
        <CreateListing onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
      {detailListing && !deleteTarget && (
        <MyListingDetail
          listing={detailListing}
          onClose={() => setDetailListing(null)}
          onDelete={(l) => { setDetailListing(null); setDeleteTarget(l); }}
          currentUserId={user?.id}
          onListingUpdate={(patch) => {
            setDetailListing((prev) => (prev ? { ...prev, ...patch } : null));
            const id = detailListing?.id;
            if (id) setListings((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
          }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          listing={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}

      {/* ── Profile header ── */}
      <div className="px-0 py-6 border-b border-[#3d2c1e]/15 dark:border-[#f8f4ed]/15">
        <div className="flex gap-5 items-start">
          <div className="w-20 h-20 rounded-full bg-[#d4a017]/25 flex items-center justify-center text-2xl font-bold text-[#b8860b] shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
              {user?.display_name || user?.email?.split("@")[0] || "You"}
            </h2>
            <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 mt-0.5">{user?.email}</p>
            <div className="flex gap-5 mt-3">
              <div className="text-center">
                <p className="font-bold text-[#1a1612] dark:text-[#f8f4ed]">{listings.length}</p>
                <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60">listings</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={() => setShowCreate(true)}
            className="flex-1 py-2.5 rounded-xl bg-[#d4a017] text-white text-sm font-bold hover:bg-[#b8860b] transition-colors">
            + New Listing
          </button>
          <button onClick={onOffers}
            className="px-4 py-2.5 rounded-xl border border-[#d4a017] text-[#d4a017] text-sm font-semibold hover:bg-[#d4a017]/10 transition-colors relative">
            Offers
            {offersCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#d4a017] text-white text-[10px] font-bold flex items-center justify-center">
                {offersCount}
              </span>
            )}
          </button>
          <button onClick={onMessage}
            className="px-4 py-2.5 rounded-xl border border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 text-sm font-semibold hover:border-[#d4a017]/40 transition-colors">
            Messages
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="pt-1">
        {listings.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center px-4">
            <span className="text-5xl">🦉</span>
            <p className="text-sm font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">No listings yet</p>
            <p className="text-xs text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">Create your first listing to start selling</p>
            <button onClick={() => setShowCreate(true)}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#d4a017] text-white text-sm font-bold hover:bg-[#b8860b] transition-colors">
              + Create listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {listings.map((listing) => (
              <button
                key={listing.id}
                onClick={() => setDetailListing(listing)}
                className="aspect-square relative overflow-hidden group"
              >
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.title}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${listing.is_available !== true ? "opacity-40 grayscale" : ""}`} />
                ) : (
                  <div className="w-full h-full bg-[#3d2c1e]/8 dark:bg-[#f8f4ed]/8 flex items-center justify-center">
                    <span className="text-2xl opacity-30">📦</span>
                  </div>
                )}

                {(!!listing.like_count || !!listing.comment_count) && (
                  <div className="absolute top-1 left-1 flex flex-wrap gap-1 pointer-events-none z-[1]">
                    {!!listing.like_count && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/55 text-white font-medium">
                        ❤️ {listing.like_count}
                      </span>
                    )}
                    {!!listing.comment_count && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/55 text-white font-medium">
                        💬 {listing.comment_count}
                      </span>
                    )}
                  </div>
                )}

                {/* SOLD stamp overlay (transparent SVG — listing photo stays visible) */}
                {listing.is_available !== true && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <img
                      src="/sold-stamp.svg"
                      alt="Sold"
                      className="w-4/5 max-w-[140px] drop-shadow-lg select-none"
                    />
                  </div>
                )}

                {/* Price overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5">
                  <p className="text-white text-xs font-bold">
                    ${parseFloat(listing.price || 0).toFixed(2)}
                  </p>
                </div>

                {/* Hover overlay — only for available listings */}
                {listing.is_available === true && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow bg-black/40 px-2 py-1 rounded-full">
                      View
                    </span>
                  </div>
                )}

                {/* Quick delete — top right corner, visible on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(listing); }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/50 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove listing"
                >
                  <span className="text-white text-xs leading-none">🗑</span>
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}