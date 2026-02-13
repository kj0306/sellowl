import { useState, useEffect } from "react";
import LoadingScreen from "./components/LoadingScreen";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import MyProfile from "./components/MyProfile";
import Checkout from "./components/Checkout";
import CheckoutLoading from "./components/CheckoutLoading";
import Messages from "./components/Messages";
import ChatThread from "./components/ChatThread";
import Notifications from "./components/Notifications";
import Offers from "./components/Offers";
import Chatbot from "./components/Chatbot";
import { getMe, logout as apiLogout } from "./lib/api";
import { auth } from "./lib/firebase";
import { signOut } from "firebase/auth";
import { dummyOffers, dummyNotifications, getProfileById } from "./data/dummyData";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState("feed");
  const [viewingProfileId, setViewingProfileId] = useState(null);
  const [checkoutItems, setCheckoutItems] = useState(null);
  const [checkoutSeller, setCheckoutSeller] = useState(null);
  const [bagItems, setBagItems] = useState([]);
  const [bagSeller, setBagSeller] = useState(null);
  const [chatProfile, setChatProfile] = useState(null);
  const [isNewChat, setIsNewChat] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [offers, setOffers] = useState(dummyOffers);
  const [notifications, setNotifications] = useState(dummyNotifications);
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleLoadingComplete = async () => {
    try {
      await getMe();
      setLoggedIn(true);
    } catch {
      setLoggedIn(false);
    }
    setLoading(false);
  };
  const handleLogin = () => setLoggedIn(true);
  const handleLogout = async () => {
    try {
      await apiLogout();
      await signOut(auth);
    } catch (e) {
      console.error("Logout error:", e);
    }
    setLoggedIn(false);
  };

  const handlePostClick = (profileId) => {
    setViewingProfileId(profileId);
    setCurrentPage("profile");
  };

  const showPage = (page) => {
    setCurrentPage(page);
    if (page === "feed") setViewingProfileId(null);
    if (page !== "chat") setChatProfile(null);
  };

  const handleOpenChat = (msg) => {
    setChatProfile(msg.profile);
    setIsNewChat(false);
    setCurrentPage("chat");
  };

  const handleMessageClick = (profile) => {
    if (profile) {
      setChatProfile(profile);
      setIsNewChat(true);
      setCurrentPage("chat");
    } else {
      setCurrentPage("messages");
    }
  };

  const handleCheckout = (items, seller) => {
    setCheckoutItems(items);
    setCheckoutSeller(seller);
    setCurrentPage("checkout");
  };

  const handleAddToBag = (items, seller) => {
    setBagItems(items);
    setBagSeller(seller);
    setCurrentPage("bag");
  };

  const handleBagToCheckout = () => {
    setCheckoutItems(bagItems);
    setCheckoutSeller(bagSeller);
    setCurrentPage("checkout");
  };

  const handlePlaceOrder = (items, seller) => {
    const orderItems = items ?? checkoutItems;
    const orderSeller = seller ?? checkoutSeller;
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      setCheckoutItems(null);
      setCheckoutSeller(null);
      setBagItems([]);
      setBagSeller(null);
      setCurrentPage("feed");
      setViewingProfileId(null);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "order_sent",
          fromId: orderSeller?.id,
          message: `Order request sent to ${orderSeller?.name}. Waiting for response.`,
          time: "Just now",
          read: false,
        },
        ...prev,
      ]);
    }, 2500);
  };

  const handleAcceptOffer = (offer) => {
    const buyer = getProfileById(offer.buyerId);
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, status: "accepted" } : o))
    );
    setNotifications((prev) => [
      {
        id: Date.now(),
        type: "offer_accepted",
        fromId: offer.buyerId,
        message: `You accepted ${buyer?.name}'s order request. They have been notified.`,
        time: "Just now",
        read: false,
      },
      ...prev,
    ]);
  };

  const handleRejectOffer = (offer) => {
    const buyer = getProfileById(offer.buyerId);
    setOffers((prev) =>
      prev.map((o) => (o.id === offer.id ? { ...o, status: "rejected" } : o))
    );
    setNotifications((prev) => [
      {
        id: Date.now(),
        type: "offer_rejected",
        fromId: offer.buyerId,
        message: `You rejected ${buyer?.name}'s order request. They have been notified.`,
        time: "Just now",
        read: false,
      },
      ...prev,
    ]);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const pendingOffersCount = offers.filter((o) => o.status === "pending").length;

  if (loading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (!loggedIn) {
    if (showSignup) {
      return <SignupPage onBack={() => setShowSignup(false)} />;
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onShowSignup={() => setShowSignup(true)}
      />
    );
  }

  if (checkoutLoading) {
    return <CheckoutLoading />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-[#f8f4ed] dark:bg-[#1a1612] text-[#1a1612] dark:text-[#f8f4ed]">
        {/* Top nav: Left=Sell OWL | Center=Search | Right=Home, Messages, Bag, Notifications, Mode, Profile */}
        {currentPage !== "chat" && currentPage !== "notifications" && currentPage !== "offers" && (
          <nav className="sticky top-0 z-20 border-b border-[#d4a017]/20 dark:border-[#d4a017]/20 bg-[#f8f4ed]/95 dark:bg-[#1a1612]/95 backdrop-blur-sm">
            <div className="flex items-center gap-4 px-4 py-2">
              {/* Left: Sell OWL */}
              <div className="flex items-center gap-2 shrink-0">
                {(currentPage === "profile" || currentPage === "checkout" || currentPage === "bag") && (
                  <button
                    onClick={() => {
                      if (currentPage === "checkout") setCurrentPage("profile");
                      else showPage("feed");
                    }}
                    className="text-sm font-medium text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:text-[#1a1612] dark:hover:text-[#f8f4ed]"
                  >
                    Back
                  </button>
                )}
                <img src="/Logos/LOGO.png" alt="" className="h-7 w-auto" />
                <h1 className="text-lg font-bold text-[#d4a017] font-['Playfair_Display']">Sell OWL</h1>
              </div>
              {/* Center: Search bar - takes remaining space */}
              <div className="flex-1 min-w-0 px-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-xl mx-auto block px-3 py-1.5 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 text-sm border border-[#d4a017]/20 focus:ring-2 focus:ring-[#d4a017] focus:outline-none"
                />
              </div>
              {/* Right: Home, Messages, Bag, Notifications, Mode, Profile */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => showPage("feed")}
                  className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "feed" ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5"}`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleMessageClick(null)}
                  className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "messages" ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5"}`}
                >
                  Messages
                </button>
                <button
                  onClick={() => bagItems.length > 0 && setCurrentPage("bag")}
                  className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${bagItems.length > 0 ? (currentPage === "bag" ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5") : "text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40 cursor-default"}`}
                  disabled={bagItems.length === 0}
                >
                  Bag{bagItems.length > 0 ? ` (${bagItems.length})` : ""}
                </button>
                <button
                  onClick={() => setCurrentPage("notifications")}
                  className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "notifications" ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5"}`}
                >
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </button>
                <button
                  onClick={() => toggleDarkMode()}
                  className="px-2 py-1.5 rounded-lg text-sm font-medium text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5 transition-colors"
                >
                  {darkMode ? "Light" : "Dark"}
                </button>
                <button
                  onClick={() => setCurrentPage("myprofile")}
                  className={`px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === "myprofile" ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5"}`}
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="px-2 py-1.5 rounded-lg text-sm font-medium text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </nav>
        )}

        <main>
          {currentPage === "feed" && (
            <Feed
              onPostClick={handlePostClick}
              onMessage={(p) => handleMessageClick(p)}
              searchQuery={searchQuery}
            />
          )}
          {currentPage === "profile" && viewingProfileId && (
            <Profile
              profileId={viewingProfileId}
              onMessage={(p) => handleMessageClick(p)}
              onCheckout={handleCheckout}
              onAddToBag={handleAddToBag}
            />
          )}
          {currentPage === "myprofile" && (
            <MyProfile
              onMessage={() => handleMessageClick(null)}
              onOffers={() => setCurrentPage("offers")}
              offersCount={pendingOffersCount}
            />
          )}
          {currentPage === "bag" && bagItems.length > 0 && bagSeller && (
            <div className="p-4">
              <Checkout
                items={bagItems}
                seller={bagSeller}
                onBack={() => showPage("feed")}
                onPlaceOrder={() => handlePlaceOrder(bagItems, bagSeller)}
                isBag
              />
            </div>
          )}
          {currentPage === "checkout" && checkoutItems && checkoutSeller && (
            <div className="p-4">
              <Checkout
                items={checkoutItems}
                seller={checkoutSeller}
                onBack={() => setCurrentPage("profile")}
                onPlaceOrder={handlePlaceOrder}
              />
            </div>
          )}
          {currentPage === "messages" && (
            <Messages onBack={() => showPage("feed")} onOpenChat={handleOpenChat} />
          )}
          {currentPage === "chat" && chatProfile && (
            <ChatThread
              profile={chatProfile}
              onBack={() => setCurrentPage("messages")}
              isNewChat={isNewChat}
            />
          )}
          {currentPage === "notifications" && (
            <Notifications
              notifications={notifications}
              onBack={() => showPage("feed")}
              onMarkRead={(id) =>
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                )
              }
            />
          )}
          {currentPage === "offers" && (
            <Offers
              offers={offers}
              onAccept={handleAcceptOffer}
              onReject={handleRejectOffer}
              onBack={() => setCurrentPage("myprofile")}
            />
          )}
        </main>

        {/* Floating chatbot - visible when logged in */}
        {loggedIn && !loading && !checkoutLoading && <Chatbot />}
      </div>
    </div>
  );
}
