import { useEffect, useState } from "react";

export default function LoadingScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f8f4ed] dark:bg-[#1a1612] transition-opacity duration-300">
      <div className="owl-loader animate-bounce">
        <img src="/Logos/FULL.png" alt="Sell OWL" className="w-48 h-48 md:w-64 md:h-64 object-contain" />
      </div>
      <p className="mt-6 text-2xl font-bold text-[#d4a017] font-['Playfair_Display']">Sell OWL</p>
      <p className="text-sm text-[#3d2c1e]/80 dark:text-[#f8f4ed]/80 mt-1">Student Marketplace</p>
    </div>
  );
}
