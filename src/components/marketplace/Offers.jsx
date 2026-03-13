import { getProfileById } from "../data/dummyData";

export default function Offers({ offers, onAccept, onReject, onBack }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1 -ml-1 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#1a1612] dark:hover:text-[#f8f4ed] text-xl"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] flex-1 font-['Playfair_Display']">
            Order Requests
          </h2>
        </div>
        <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
          Accept or reject offers from buyers
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {offers.length === 0 ? (
          <div className="p-8 text-center text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
            No pending offers
          </div>
        ) : (
          <div className="divide-y divide-[#3d2c1e]/20 dark:divide-[#f8f4ed]/20">
            {offers.map((offer) => {
              const buyer = getProfileById(offer.buyerId);
              const status = offer.status;
              return (
                <div
                  key={offer.id}
                  className={`p-4 ${status === "pending" ? "bg-[#d4a017]/10" : ""}`}
                >
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-sm font-bold text-[#1a1612] shrink-0">
                      {buyer?.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1a1612] dark:text-[#f8f4ed]">
                        {buyer?.name}
                      </p>
                      <p className="text-sm text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
                        {offer.items} for ${offer.total}
                      </p>
                      <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
                        {offer.time}
                      </p>
                      {status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => onAccept(offer)}
                            className="px-4 py-2 rounded-lg bg-[#1a1612] dark:bg-[#f8f4ed] text-[#f8f4ed] dark:text-[#1a1612] text-sm font-medium"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => onReject(offer)}
                            className="px-4 py-2 rounded-lg border border-[#3d2c1e]/30 text-[#1a1612] dark:text-[#f8f4ed] text-sm font-medium"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {status === "accepted" && (
                        <span className="inline-block mt-2 text-sm text-green-600 dark:text-green-400">
                          Accepted
                        </span>
                      )}
                      {status === "rejected" && (
                        <span className="inline-block mt-2 text-sm text-red-600 dark:text-red-400">
                          Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
