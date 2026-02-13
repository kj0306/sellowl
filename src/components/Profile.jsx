import { useState } from "react";
import { getProfileById, getProfileProducts, getPostByProfileId } from "../data/dummyData";

export default function Profile({ profileId, onMessage, onCheckout, onAddToBag }) {
  const profile = getProfileById(profileId);
  const post = getPostByProfileId(profileId);
  const products = getProfileProducts(profileId, post?.items || 6);
  
  const [selectedItems, setSelectedItems] = useState([]);

  const toggleItem = (product) => {
    setSelectedItems((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const selectAll = () => {
    if (selectedItems.length === products.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...products]);
    }
  };

  const handleCheckout = () => {
    if (selectedItems.length > 0) {
      onCheckout(selectedItems, profile);
    }
  };

  if (!profile) return <div className="p-8 text-center">Profile not found</div>;

  return (
    <div className="pb-8">
      {/* Profile header - Instagram style with bio, stats */}
      <div className="px-4 py-6 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <div className="flex gap-6 items-start">
          {/* Profile pic */}
          <div className="w-24 h-24 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-3xl font-bold text-[#1a1612] shrink-0">
            {profile.initials}
          </div>
          {/* Stats - like Instagram */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">{profile.name}</h2>
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">{profile.itemsCount ?? products.length}</p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">items</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">{profile.soldCount ?? 0}</p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">sold</p>
              </div>
            </div>
          </div>
        </div>
        {/* Bio */}
        <div className="mt-4">
          <p className="font-medium text-[#1a1612] dark:text-[#f8f4ed] text-sm">{profile.bio}</p>
          <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">{profile.location}</p>
          <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-0.5">{profile.university}</p>
          {profile.verified && (
            <span className="inline-flex items-center gap-1 mt-2 text-[#d4a017] text-sm">
              ✓ Verified
            </span>
          )}
        </div>
        {/* Message button */}
        <button
          onClick={() => onMessage(profile)}
          className="w-full mt-4 py-2 rounded-lg bg-[#3d2c1e]/10 hover:bg-[#3d2c1e]/20 dark:hover:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm transition-colors"
        >
          Message
        </button>
      </div>

      {/* Profile grid - Instagram style */}
      <div className="mt-4">
        <div className="grid grid-cols-3 gap-1 p-1">
          {products.map((product) => {
            const isSelected = selectedItems.some((p) => p.id === product.id);
            return (
              <button
                key={product.id}
                onClick={() => toggleItem(product)}
                className={`aspect-square relative overflow-hidden ${isSelected ? "ring-4 ring-[#d4a017] ring-inset" : ""}`}
              >
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                {isSelected && (
                  <div className="absolute inset-0 bg-[#d4a017]/40 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">✓</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
                  <p className="text-white text-xs font-medium truncate">${product.price}</p>
                </div>
            </button>
          );
        })}
        </div>
      </div>

      {/* Action bar - only show when items selected */}
      {selectedItems.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#f8f4ed] dark:bg-[#1a1612] border-t border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 z-20">
          <div className="flex gap-2 max-w-lg mx-auto">
            <button
              onClick={selectAll}
              className="flex-1 py-2.5 rounded-lg border-2 border-[#3d2c1e]/30 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm"
            >
              {selectedItems.length === products.length ? "Deselect All" : "Select All"}
            </button>
            {onAddToBag && (
              <button
                onClick={() => onAddToBag(selectedItems, profile)}
                className="flex-1 py-2.5 rounded-lg border-2 border-[#d4a017] text-[#d4a017] font-medium text-sm hover:bg-[#d4a017]/10 transition-colors"
              >
                Add to Bag ({selectedItems.length})
              </button>
            )}
            <button
              onClick={handleCheckout}
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
