import { getProfileById } from "../../data/dummyData";

export default function Notifications({ notifications, onMarkRead }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - centered like profile, vertical padding on both sides */}
      <div className="shrink-0">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
          <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
            Notifications
          </h2>
        </div>
      </div>
      {/* Body - centered, padded like profile */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-[#3d2c1e]/20 dark:divide-[#f8f4ed]/20">
              {notifications.map((n) => {
                const profile = getProfileById(n.fromId);
                return (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead?.(n.id)}
                    className={`py-4 flex gap-4 cursor-pointer first:pt-0 ${!n.read ? "bg-[#d4a017]/10 rounded-lg" : ""}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#d4a017]/30 flex items-center justify-center text-sm font-bold text-[#1a1612] shrink-0">
                      {profile?.initials ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1a1612] dark:text-[#f8f4ed]">
                        {n.message}
                      </p>
                      <p className="text-xs text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 mt-1">
                        {n.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
