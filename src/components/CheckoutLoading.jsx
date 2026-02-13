export default function CheckoutLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f8f4ed] dark:bg-[#1a1612]">
      <div className="owl-loader animate-owl-pulse">
        <img src="/Logos/FULL.png" alt="Sell OWL" className="w-40 h-40 md:w-48 md:h-48 object-contain" />
      </div>
      <p className="mt-6 text-lg font-semibold text-[#d4a017] font-['Playfair_Display']">Order Request</p>
      <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">Processing your request...</p>
      <div className="mt-8 flex gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4a017] animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4a017] animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2.5 h-2.5 rounded-full bg-[#d4a017] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
