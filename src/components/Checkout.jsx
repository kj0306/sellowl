export default function Checkout({ items, seller, onBack, onPlaceOrder, isBag }) {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="pb-8">
      <div className="p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">{isBag ? "Your Bag" : "Order Request"}</h2>
        <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
          Seller: {seller?.name} • {seller?.university}
        </p>
      </div>

      <div className="divide-y divide-[#3d2c1e]/20 dark:divide-[#f8f4ed]/20">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 p-4">
            <img
              src={item.image}
              alt={item.title}
              className="w-20 h-20 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-[#1a1612] dark:text-[#f8f4ed]">{item.title}</h3>
              <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">{item.condition}</p>
              <p className="text-[#d4a017] font-semibold">${item.price}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 space-y-4">
        <div className="flex justify-between text-lg">
          <span className="text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">Total</span>
          <span className="font-bold text-[#1a1612] dark:text-[#f8f4ed]">${total}</span>
        </div>
        <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
          In-person payment only (cash / peer-to-peer). No in-app payment in MVP.
        </p>
        <button
          onClick={onPlaceOrder}
          className="w-full py-3 rounded-xl bg-[#d4a017] hover:bg-[#b8860b] text-white font-semibold transition-colors"
        >
          Place Order Request
        </button>
        <button
          onClick={onBack}
          className="w-full py-2 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 text-sm"
        >
          ← Back to {isBag ? "Home" : "Profile"}
        </button>
      </div>
    </div>
  );
}
