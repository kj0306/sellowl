import { useState, useRef } from "react";
import { createListing, scanImageWithAI, suggestPrice } from "../../lib/api";
import { uploadFile, storageProviderName } from "../../lib/storage"; // ← swap provider here

const CATEGORIES = ["Furniture", "Electronics", "Books", "Clothing", "Kitchen", "Sports", "Other"];
const CONDITIONS = ["Like New", "Good", "Fair"];
const DELIVERY_OPTIONS = [
  { id: "pickup",   label: "Pickup Only", icon: "🤝" },
  { id: "delivery", label: "Delivery",    icon: "📦" },
];

export default function CreateListing({ onClose, onCreated }) {
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("form");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "Other",
    condition: "Good",
    image_url: "",
    neighbourhood: "",
    delivery_options: ["pickup"],
  });

  const [upload,   setUpload]   = useState({ status: "idle", progress: 0, error: null });
  const [aiScan,   setAiScan]   = useState({ status: "idle", error: null });
  const [priceAI,  setPriceAI]  = useState({ status: "idle", data: null, error: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const set = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const toggleDelivery = (id) =>
    setForm((p) => {
      const next = p.delivery_options.includes(id)
        ? p.delivery_options.filter((x) => x !== id)
        : [...p.delivery_options, id];
      return { ...p, delivery_options: next.length ? next : [id] };
    });

  // ── Upload (via storage.js abstraction) ────────────────────────
  const handleFileSelect = async (file) => {
    if (!file) return;
    setUpload({ status: "uploading", progress: 0, error: null });
    setAiScan({ status: "idle", error: null });
    set("image_url", "");
    try {
      const url = await uploadFile(file, (p) =>
        setUpload({ status: "uploading", progress: p, error: null })
      );
      set("image_url", url);
      setUpload({ status: "done", progress: 100, error: null });
    } catch (e) {
      setUpload({ status: "error", progress: 0, error: e.message });
    }
  };

  // ── AI Scan ─────────────────────────────────────────────────────
  const handleAIScan = async () => {
    if (!form.image_url) return;
    setAiScan({ status: "loading", error: null });
    try {
      const res = await scanImageWithAI(form.image_url);
      if (res.data) {
        setForm((p) => ({
          ...p,
          title:       res.data.title       || p.title,
          description: res.data.description || p.description,
          category:    res.data.category    || p.category,
          condition:   res.data.condition   || p.condition,
        }));
        setAiScan({ status: "done", error: null });
      }
    } catch (e) {
      setAiScan({ status: "error", error: e.message });
    }
  };

  // ── Price Suggestion ─────────────────────────────────────────────
  const handleSuggestPrice = async () => {
    if (!form.title.trim()) {
      setPriceAI({ status: "error", data: null, error: "Add a title first" });
      return;
    }
    setPriceAI({ status: "loading", data: null, error: null });
    try {
      const res = await suggestPrice(form.title, form.description, form.category, form.condition);
      if (res.data) setPriceAI({ status: "done", data: res.data, error: null });
    } catch (e) {
      setPriceAI({ status: "error", data: null, error: e.message });
    }
  };

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) { setSubmitError("Title is required"); return; }
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) {
      setSubmitError("Enter a valid price"); return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createListing({
        title:           form.title.trim(),
        description:     form.description.trim(),
        price:           parseFloat(form.price),
        category:        form.category,
        condition:       form.condition,
        image_url:       form.image_url,
        neighbourhood:   form.neighbourhood.trim(),
        delivery_option: form.delivery_options.join(","),
      });
      onCreated();
    } catch (e) {
      setSubmitError(e.message);
      setSubmitting(false);
    }
  };

  const canPost = form.title.trim() && form.price && form.delivery_options.length > 0;

  // ── Preview Card ──────────────────────────────────────────────────
  const PreviewCard = () => (
    <div className="mx-4">
      <p className="text-xs text-center text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50 mb-3">
        How your listing will appear in the feed
      </p>
      <div className="rounded-xl border border-[#d4a017]/20 overflow-hidden bg-white dark:bg-[#221e1a] shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#d4a017]/10">
          <div className="w-7 h-7 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-xs font-bold text-[#b8860b]">Me</div>
          <div>
            <p className="text-xs font-semibold text-[#1a1612] dark:text-[#f8f4ed]">You</p>
            {form.neighbourhood && (
              <p className="text-[10px] text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">📍 {form.neighbourhood}</p>
            )}
          </div>
        </div>
        <div className="aspect-[4/3] bg-[#3d2c1e]/5 dark:bg-[#f8f4ed]/5 flex items-center justify-center">
          {form.image_url
            ? <img src={form.image_url} alt="preview" className="w-full h-full object-cover" />
            : <div className="flex flex-col items-center gap-2 text-[#3d2c1e]/20 dark:text-[#f8f4ed]/20">
                <span className="text-4xl">📷</span>
                <span className="text-xs">No photo yet</span>
              </div>
          }
        </div>
        <div className="px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-bold text-[#d4a017]">
              {form.price ? `$${parseFloat(form.price).toFixed(2)}` : "$—"}
            </p>
            <div className="flex gap-1 flex-wrap justify-end">
              {form.delivery_options.includes("pickup")   && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4a017]/15 text-[#b8860b] font-medium">🤝 Pickup</span>}
              {form.delivery_options.includes("delivery") && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 font-medium">📦 Delivery</span>}
            </div>
          </div>
          <p className="text-sm font-semibold text-[#1a1612] dark:text-[#f8f4ed] mt-0.5">
            {form.title || <span className="text-[#3d2c1e]/30 dark:text-[#f8f4ed]/30 font-normal italic">Item title…</span>}
          </p>
          {form.description && (
            <p className="text-xs text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 mt-1 line-clamp-2">{form.description}</p>
          )}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {form.category  && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3d2c1e]/8 dark:bg-[#f8f4ed]/8 text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 border border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10">{form.category}</span>}
            {form.condition && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3d2c1e]/8 dark:bg-[#f8f4ed]/8 text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 border border-[#3d2c1e]/10 dark:border-[#f8f4ed]/10">{form.condition}</span>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-[#f8f4ed] dark:bg-[#1a1612] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[95vh] shadow-2xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d4a017]/20 shrink-0">
          <button onClick={onClose} className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#d4a017] transition-colors font-medium">
            Cancel
          </button>
          <div className="flex gap-0.5 bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 rounded-lg p-0.5">
            {["form", "preview"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-white dark:bg-[#2a241e] text-[#1a1612] dark:text-[#f8f4ed] shadow-sm"
                    : "text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60"
                }`}>
                {tab === "form" ? "Edit" : "👁 Preview"}
              </button>
            ))}
          </div>
          <button onClick={handleSubmit} disabled={submitting || !canPost}
            className="text-sm font-bold text-[#d4a017] hover:text-[#b8860b] disabled:opacity-30 transition-colors">
            {submitting ? "Posting…" : "Post"}
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1">
          {activeTab === "preview" ? (
            <div className="py-4">
              <PreviewCard />
              <div className="mt-4 mx-4">
                <button onClick={() => setActiveTab("form")}
                  className="w-full py-2.5 rounded-xl border border-[#d4a017]/30 text-[#d4a017] text-sm font-medium hover:bg-[#d4a017]/5 transition-colors">
                  ← Back to editing
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-5">
              {submitError && (
                <div className="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  ⚠ {submitError}
                </div>
              )}

              {/* ── 1. Photo / Video ── */}
              <section>
                <p className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider mb-2">
                  Photo / Video
                </p>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files[0])} />

                <button onClick={() => fileInputRef.current?.click()}
                  className={`relative w-full rounded-xl border-2 border-dashed overflow-hidden transition-colors ${
                    upload.status === "done" ? "border-[#d4a017]" : "border-[#d4a017]/30 hover:border-[#d4a017]/60"
                  }`} style={{ minHeight: "10rem" }}>
                  {form.image_url ? (
                    <img src={form.image_url} alt="uploaded" className="w-full h-40 object-cover" />
                  ) : upload.status === "uploading" ? (
                    <div className="h-40 flex flex-col items-center justify-center gap-2 bg-[#3d2c1e]/5">
                      <div className="w-10 h-10 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 font-medium">
                        Uploading {upload.progress}%
                      </p>
                      <div className="w-32 h-1.5 bg-[#3d2c1e]/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#d4a017] rounded-full transition-all" style={{ width: `${upload.progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center gap-2 bg-[#3d2c1e]/5">
                      <span className="text-4xl">📷</span>
                      <p className="text-sm font-semibold text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
                        Tap to upload photo or video
                      </p>
                      <p className="text-xs text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40">
                        From camera roll or take a new photo
                      </p>
                    </div>
                  )}
                  {upload.status === "done" && (
                    <div className="absolute top-2 right-2 bg-[#d4a017] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      ✓ Uploaded
                    </div>
                  )}
                </button>
                {upload.error && <p className="text-xs text-red-500 mt-1.5">{upload.error}</p>}

                {/* ── 2. AI Auto-fill ── */}
                {form.image_url && (
                  <button onClick={handleAIScan} disabled={aiScan.status === "loading"}
                    className={`mt-2.5 w-full py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                      aiScan.status === "done"
                        ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                        : "border-[#d4a017] text-[#d4a017] hover:bg-[#d4a017]/10"
                    }`}>
                    {aiScan.status === "loading"
                      ? <><div className="w-4 h-4 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin" />Scanning image with AI…</>
                      : aiScan.status === "done"
                        ? "✓ Fields filled by AI — tap to re-scan"
                        : "✨ AI Auto-fill from image (Groq Llama)"}
                  </button>
                )}
                {aiScan.error && <p className="text-xs text-red-500 mt-1">{aiScan.error}</p>}
              </section>

              {/* ── 3. Title ── */}
              <section>
                <label className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider">
                  Title <span className="text-[#d4a017]">*</span>
                </label>
                <input type="text" placeholder="e.g. IKEA Kallax shelf, barely used"
                  value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={80}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none" />
                <p className="text-right text-xs text-[#3d2c1e]/30 dark:text-[#f8f4ed]/30 mt-0.5">{form.title.length}/80</p>
              </section>

              {/* ── 4. Description ── */}
              <section>
                <label className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider">
                  Description <span className="text-[#d4a017]">*</span>
                </label>
                <textarea placeholder="Describe the item — dimensions, colour, any flaws, reason for selling…"
                  value={form.description} onChange={(e) => set("description", e.target.value)}
                  rows={3} maxLength={500}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none resize-none" />
                <p className="text-right text-xs text-[#3d2c1e]/30 dark:text-[#f8f4ed]/30 mt-0.5">{form.description.length}/500</p>
              </section>

              {/* ── 5. Category ── */}
              <section>
                <label className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider block mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} onClick={() => set("category", cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        form.category === cat
                          ? "bg-[#d4a017] border-[#d4a017] text-white shadow-sm"
                          : "border-[#d4a017]/30 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:border-[#d4a017] bg-white dark:bg-[#221e1a]"
                      }`}>{cat}
                    </button>
                  ))}
                </div>
              </section>

              {/* Condition */}
              <section>
                <label className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider block mb-2">Condition</label>
                <div className="flex gap-2">
                  {CONDITIONS.map((c) => (
                    <button key={c} onClick={() => set("condition", c)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                        form.condition === c
                          ? "bg-[#d4a017] border-[#d4a017] text-white shadow-sm"
                          : "border-[#d4a017]/30 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:border-[#d4a017] bg-white dark:bg-[#221e1a]"
                      }`}>{c}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── 6. Price + AI Suggest ── */}
              <section>
                <label className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider">
                  Price ($) <span className="text-[#d4a017]">*</span>
                </label>
                <div className="flex gap-2 mt-1.5">
                  <input type="number" placeholder="0.00" value={form.price}
                    onChange={(e) => set("price", e.target.value)} min={0} step="0.01"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none" />
                  <button onClick={handleSuggestPrice}
                    disabled={priceAI.status === "loading" || !form.title.trim()}
                    title={!form.title.trim() ? "Add a title first" : "AI price estimate"}
                    className="px-3 py-2.5 rounded-xl border border-[#d4a017]/40 text-[#d4a017] text-xs font-bold hover:bg-[#d4a017]/10 disabled:opacity-40 transition-colors whitespace-nowrap bg-white dark:bg-[#221e1a]">
                    {priceAI.status === "loading"
                      ? <div className="w-4 h-4 border-2 border-[#d4a017] border-t-transparent rounded-full animate-spin mx-2" />
                      : "✨ Suggest"}
                  </button>
                </div>
                {priceAI.status === "done" && priceAI.data && (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#d4a017]/10 border border-[#d4a017]/25">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#b8860b]">
                          AI suggests: ${priceAI.data.price_range?.min} – ${priceAI.data.price_range?.max}
                        </p>
                        {priceAI.data.reasoning && (
                          <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-0.5">
                            {priceAI.data.reasoning}
                          </p>
                        )}
                      </div>
                      <button onClick={() => { set("price", String(priceAI.data.suggested_price)); setPriceAI((p) => ({ ...p, status: "applied" })); }}
                        className="ml-3 shrink-0 px-3 py-1.5 rounded-lg bg-[#d4a017] text-white text-xs font-bold hover:bg-[#b8860b] transition-colors">
                        Use ${priceAI.data.suggested_price}
                      </button>
                    </div>
                  </div>
                )}
                {priceAI.error && <p className="text-xs text-red-500 mt-1.5">{priceAI.error}</p>}
              </section>

              {/* ── 7. Neighbourhood ── */}
              <section>
                <label className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider">
                  Neighbourhood / Landmark
                </label>
                <input type="text" placeholder="e.g. Near Camp Randall, Langdon St, Sellery area…"
                  value={form.neighbourhood} onChange={(e) => set("neighbourhood", e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-[#221e1a] border border-[#d4a017]/20 text-[#1a1612] dark:text-[#f8f4ed] text-sm focus:ring-2 focus:ring-[#d4a017] focus:outline-none" />
              </section>

              {/* ── 8. Delivery Options ── */}
              <section>
                <label className="text-xs font-bold text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 uppercase tracking-wider block mb-2">
                  Delivery Options <span className="text-[#d4a017]">*</span>
                  <span className="ml-1 normal-case font-normal text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40">(select one or both)</span>
                </label>
                <div className="flex gap-3">
                  {DELIVERY_OPTIONS.map(({ id, label, icon }) => {
                    const checked = form.delivery_options.includes(id);
                    return (
                      <button key={id} onClick={() => toggleDelivery(id)}
                        className={`flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all ${
                          checked
                            ? "border-[#d4a017] bg-[#d4a017]/10 shadow-sm"
                            : "border-[#3d2c1e]/15 dark:border-[#f8f4ed]/15 hover:border-[#d4a017]/40 bg-white dark:bg-[#221e1a]"
                        }`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? "bg-[#d4a017] border-[#d4a017]" : "border-[#3d2c1e]/30 dark:border-[#f8f4ed]/30"
                        }`}>
                          {checked && <span className="text-white font-bold" style={{ fontSize: "9px" }}>✓</span>}
                        </div>
                        <span className="text-xl">{icon}</span>
                        <span className={`text-sm font-semibold ${checked ? "text-[#b8860b]" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70"}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* ── 9. Preview CTA ── */}
              <button onClick={() => setActiveTab("preview")}
                className="w-full py-3 rounded-xl border border-[#d4a017]/30 text-[#d4a017] text-sm font-semibold hover:bg-[#d4a017]/5 transition-colors">
                👁 Preview how this looks in the feed →
              </button>

              <div className="pb-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
