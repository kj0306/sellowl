import { useState } from "react";
import { currentUser, getProfileProducts } from "../data/dummyData";

export default function MyProfile({ onMessage, onOffers, offersCount = 0 }) {
  const profile = currentUser;
  const products = getProfileProducts(0, profile?.itemsCount || 5);

  const [selectedItems, setSelectedItems] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const toggleItem = (product) => {
    setSelectedItems((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  return (
    <div className="pb-8">
      <div className="px-4 py-6 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <div className="flex gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-3xl font-bold text-[#1a1612] shrink-0">
            {profile.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">{profile.name}</h2>
            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">{profile.itemsCount}</p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">items</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-[#1a1612] dark:text-[#f8f4ed]">{profile.soldCount}</p>
                <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">sold</p>
              </div>
            </div>
          </div>
        </div>
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
        <div className="flex gap-2 mt-4">
          <button
            onClick={onOffers}
            className="flex-1 py-2 rounded-lg bg-[#1a1612] dark:bg-[#f8f4ed] text-[#f8f4ed] dark:text-[#1a1612] font-medium text-sm"
          >
            Order Requests
          </button>
          <button
            onClick={() => onMessage?.(null)}
            className="flex-1 py-2 rounded-lg border border-[#3d2c1e]/30 text-[#1a1612] dark:text-[#f8f4ed] font-medium text-sm"
          >
            Messages
          </button>
        </div>
      </div>

      {/* Tabs - All | Offers (only on your profile) */}
      <div className="flex border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "all"
              ? "text-[#d4a017] border-b-2 border-[#d4a017]"
              : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={`flex-1 py-3 text-sm font-medium ${
            activeTab === "offers"
              ? "text-[#d4a017] border-b-2 border-[#d4a017]"
              : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"
          }`}
        >
          {offersCount} Offers
        </button>
      </div>

      <div className="mt-4 px-4">
        {activeTab === "all" ? (
          <>
            <h3 className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed] mb-2">Your listings</h3>
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
          </>
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
