import { useState } from "react";
import { createListing } from "../../lib/api";

const CATEGORIES = ["Furniture", "Electronics", "Books", "Clothing", "Kitchen", "Sports", "Other"];
const CONDITIONS = ["Like New", "Good", "Fair"];

export default function CreateListing({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Other",
    condition: "Good",
    image_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price))) { setError("Valid price is required"); return; }
    setLoading(true);
    setError(null);
    try {
      await createListing({
        ...form,
        price: parseFloat(form.price),
      });
      onCreated();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-lg bg-[#f8f4ed] dark:bg-[#1a1612] rounded-t-2xl sm:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d4a017]/20">
          <button onClick={onClose} className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#d4a017]">
            Cancel
          </button>
          <h2 className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed]">New Listing</h2>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-sm font-semibold text-[#d4a017] hover:text-[#b8860b] disabled:opacity-50"
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide">
              Title *
            </label>
            <input
              type="text"
              placeholder="e.g. IKEA desk, barely used"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
            />
          </div>

          {/* Price + Condition row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide">
                Price ($) *
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                min={0}
                step="0.01"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide">
                Condition
              </label>
              <select
                value={form.condition}
                onChange={(e) => set("condition", e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
              >
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide">
              Category
            </label>
            <div className="mt-1 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => set("category", cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.category === cat
                      ? "bg-[#d4a017] border-[#d4a017] text-white"
                      : "border-[#d4a017]/30 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:border-[#d4a017]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide">
              Description
            </label>
            <textarea
              placeholder="Describe the item, dimensions, pickup location hint..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="text-xs font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 uppercase tracking-wide">
              Image URL <span className="normal-case font-normal">(optional — paste a link for now)</span>
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={form.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
