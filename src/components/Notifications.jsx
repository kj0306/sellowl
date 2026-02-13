import { getProfileById } from "../data/dummyData";

export default function Notifications({ notifications, onBack, onMarkRead }) {
  return (
    <div className="min-h-screen flex">
      {/* Left: back button only - gives more space for content */}
      <aside className="w-14 shrink-0 flex flex-col items-center py-4 border-r border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20">
        <button
          onClick={onBack}
          className="p-2 text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#1a1612] dark:hover:text-[#f8f4ed] text-2xl hover:bg-[#d4a017]/10 rounded-lg transition-colors"
          title="Back"
        >
          ←
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-[#3d2c1e]/20 dark:border-[#f8f4ed]/20 shrink-0">
          <h2 className="text-lg font-semibold text-[#1a1612] dark:text-[#f8f4ed] font-['Playfair_Display']">
            Notifications
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70">
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
                  className={`p-4 flex gap-4 cursor-pointer ${!n.read ? "bg-[#d4a017]/10" : ""}`}
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
