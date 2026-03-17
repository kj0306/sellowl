import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import LoadingScreen from "./components/shared/LoadingScreen";
import LoginPage from "./components/auth/LoginPage";
import SignupPage from "./components/auth/SignupPage";
import Feed from "./components/marketplace/Feed";
import Profile from "./components/profile/Profile";
import MyProfile from "./components/profile/MyProfile";
import Checkout from "./components/marketplace/Checkout";
import CheckoutLoading from "./components/marketplace/CheckoutLoading";
import Messages from "./components/messaging/Messages";
import ChatThread from "./components/messaging/ChatThread";
import Notifications from "./components/shared/Notifications";
import Offers from "./components/marketplace/Offers";
import Chatbot from "./components/messaging/Chatbot";
import { getMe, logout as apiLogout, fetchUnreadCount } from "./lib/api";
import { auth } from "./lib/firebase";
import { signOut } from "firebase/auth";
import { dummyOffers, dummyNotifications, getProfileById } from "./data/dummyData";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState(null);
  const [checkoutSeller, setCheckoutSeller] = useState(null);
  const [bagItems, setBagItems] = useState([]);
  const [bagSeller, setBagSeller] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [offers, setOffers] = useState(dummyOffers);
  const [notifications, setNotifications] = useState(dummyNotifications);
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showSignup, setShowSignup] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null);
  const [profileDropdownRect, setProfileDropdownRect] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest("[data-profile-dropdown]")) return;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (profileDropdownOpen && profileButtonRef.current) {
      const rect = profileButtonRef.current.getBoundingClientRect();
      setProfileDropdownRect({ top: rect.bottom + 4, right: window.innerWidth - rect.right, width: 160 });
    } else {
      setProfileDropdownRect(null);
    }
  }, [profileDropdownOpen]);

  const path = location.pathname;
  const isFeed = path === "/" || path === "/feed";
  const isProfile = path.startsWith("/profile/");
  const profileId = isProfile ? path.replace("/profile/", "") : null;
  const isMessages = path === "/messages";
  const isChat = path === "/chat";
  const isMyProfile = path === "/my-profile";
  const isNotifications = path === "/notifications";
  const isOffers = path === "/offers";
  const isBag = path === "/bag";
  const isCheckout = path === "/checkout";

  const handleLoadingComplete = async () => {
    try {
      await getMe();
      setLoggedIn(true);
    } catch {
      setLoggedIn(false);
    }
    setLoading(false);
  };

  // Poll unread message count every 30 seconds
  useEffect(() => {
    if (!loggedIn) return;
    const refresh = () => fetchUnreadCount().then((d) => setUnreadMessages(d.unread_count || 0)).catch(() => {});
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  // Reset unread count when Messages page is opened
  const handleOpenMessages = () => {
    handleMessageClick(null);
    setUnreadMessages(0);
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

  const handlePostClick = (id) => {
    navigate(`/profile/${id}`);
  };

  const showPage = (page) => {
    if (page === "feed") navigate("/");
    else if (page === "messages") navigate("/messages");
    else if (page === "myprofile") navigate("/my-profile");
    else if (page === "notifications") navigate("/notifications");
    else if (page === "offers") navigate("/offers");
    else if (page === "bag") navigate("/bag");
  };

  const handleOpenChat = (msg) => {
    navigate("/chat", { state: { profile: { ...msg.profile, conversationId: msg.conversationId }, isNewChat: false } });
  };

  const handleMessageClick = (profile) => {
    if (profile) {
      navigate("/chat", { state: { profile, isNewChat: true } });
    } else {
      navigate("/messages");
    }
  };

  const handleCheckout = (items, seller) => {
    setCheckoutItems(items);
    setCheckoutSeller(seller);
    navigate("/checkout", { state: { items, seller } });
  };

  const handleAddToBag = (items, seller) => {
    setBagItems(items);
    setBagSeller(seller);
    navigate("/bag", { state: { items, seller } });
  };

  const handleBagToCheckout = () => {
    setCheckoutItems(bagItems);
    setCheckoutSeller(bagSeller);
    navigate("/checkout");
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
      navigate("/");
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
        <nav className="sticky top-0 z-20 border-b border-[#d4a017]/20 dark:border-[#d4a017]/20 bg-[#f8f4ed]/95 dark:bg-[#1a1612]/95 backdrop-blur-sm">
            <div className="flex items-center gap-4 px-4 py-2">
              {/* Left: Sell OWL (clickable - goes to home) */}
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
              >
                <img src="/Logos/LOGO.png" alt="" className="h-10 w-auto object-contain" />
                <h1 className="text-lg font-bold text-[#d4a017] font-['Playfair_Display']">Sell OWL</h1>
              </button>
              {/* Center: Search bar - takes remaining space */}
              <div className="flex-1 min-w-0 px-2">
                <div className="relative max-w-xl mx-auto">
                  {!searchQuery && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#3d2c1e]/50 dark:text-[#f8f4ed]/50">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full py-1.5 rounded-lg bg-[#3d2c1e]/10 dark:bg-[#f8f4ed]/10 text-[#1a1612] dark:text-[#f8f4ed] placeholder-[#3d2c1e]/50 text-sm border border-[#d4a017]/20 focus:ring-2 focus:ring-[#d4a017] focus:outline-none ${searchQuery ? "pl-3 pr-9" : "pl-9 pr-3"}`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#3d2c1e]/60 dark:text-[#f8f4ed]/60 hover:text-[#d4a017] hover:bg-[#d4a017]/10 transition-colors"
                      aria-label="Clear search"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-2.72 2.72a.75.75 0 1 0 1.06 1.06L10 11.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L11.06 10l2.72-2.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 6.22Z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {/* Right: Messages, Bag, Notifications, Profile dropdown - space on both sides */}
              <div className="flex items-center gap-2 shrink-0 pl-6 pr-4">
                <button
                  onClick={handleOpenMessages}
                  className={`relative p-2 rounded-lg text-sm font-medium transition-colors ${isMessages ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5"}`}
                >
                  Messages
                  {unreadMessages > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d4a017] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => bagItems.length > 0 && navigate("/bag")}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${bagItems.length > 0 ? (isBag ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5") : "text-[#3d2c1e]/40 dark:text-[#f8f4ed]/40 cursor-default"}`}
                  disabled={bagItems.length === 0}
                >
                  Bag{bagItems.length > 0 ? ` (${bagItems.length})` : ""}
                </button>
                <button
                  onClick={() => navigate("/notifications")}
                  className={`p-2 rounded-lg text-sm font-medium transition-colors ${isNotifications ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5"}`}
                >
                  Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
                </button>
                {/* Profile dropdown: Profile, Settings, Logout - uses portal */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    ref={profileButtonRef}
                    onClick={() => setProfileDropdownOpen((o) => !o)}
                    className={`p-2 rounded-lg transition-colors ${isMyProfile ? "text-[#d4a017] bg-[#d4a017]/10" : "text-[#3d2c1e]/70 dark:text-[#f8f4ed]/70 hover:bg-[#d4a017]/5"}`}
                    title="Profile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {profileDropdownRect &&
                    profileDropdownOpen &&
                    createPortal(
                      <div
                        data-profile-dropdown
                        className="fixed z-[9999] py-1 rounded-lg border border-[#d4a017]/20 bg-[#f8f4ed] dark:bg-[#1a1612] shadow-xl"
                        style={{
                          top: profileDropdownRect.top,
                          right: profileDropdownRect.right,
                          width: profileDropdownRect.width,
                        }}
                      >
                        <button
                          onClick={() => {
                            navigate("/my-profile");
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[#1a1612] dark:text-[#f8f4ed] hover:bg-[#d4a017]/10"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            toggleDarkMode();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[#1a1612] dark:text-[#f8f4ed] hover:bg-[#d4a017]/10"
                        >
                          {darkMode ? "Light mode" : "Dark mode"}
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        >
                          Logout
                        </button>
                      </div>,
                      document.body
                    )}
                </div>
              </div>
            </div>
          </nav>

        <main>
          {isFeed && (
            <Feed
              onPostClick={handlePostClick}
              onMessage={(p) => handleMessageClick(p)}
              searchQuery={searchQuery}
            />
          )}
          {isProfile && profileId && (
            <Profile
              profileId={profileId}
              onMessage={(p) => handleMessageClick(p)}
              onCheckout={handleCheckout}
              onAddToBag={handleAddToBag}
            />
          )}
          {isMyProfile && (
            <MyProfile
              onMessage={() => handleMessageClick(null)}
              onOffers={() => navigate("/offers")}
              offersCount={pendingOffersCount}
            />
          )}
          {isBag && bagItems.length > 0 && bagSeller && (
            <div className="p-4">
              <Checkout
                items={bagItems}
                seller={bagSeller}
                onPlaceOrder={() => handlePlaceOrder(bagItems, bagSeller)}
                isBag
              />
            </div>
          )}
          {isCheckout && checkoutItems && checkoutSeller && (
            <div className="p-4">
              <Checkout
                items={checkoutItems}
                seller={checkoutSeller}
                onPlaceOrder={handlePlaceOrder}
              />
            </div>
          )}
          {isMessages && (
            <Messages onOpenChat={handleOpenChat} />
          )}
          {isChat && !location.state?.profile && <Navigate to="/messages" replace />}
          {isChat && location.state?.profile && (
            <ChatThread
              profile={location.state.profile}
              isNewChat={location.state.isNewChat ?? false}
              conversationId={location.state.profile.conversationId || null}
            />
          )}
          {isNotifications && (
            <Notifications
              notifications={notifications}
              onMarkRead={(id) =>
                setNotifications((prev) =>
                  prev.map((n) => (n.id === id ? { ...n, read: true } : n))
                )
              }
            />
          )}
          {isOffers && (
            <Offers
              offers={offers}
              onAccept={handleAcceptOffer}
              onReject={handleRejectOffer}
            />
          )}
        </main>

        {/* Floating chatbot - visible when logged in */}
        {loggedIn && !loading && !checkoutLoading && <Chatbot />}
      </div>
    </div>
  );
}
