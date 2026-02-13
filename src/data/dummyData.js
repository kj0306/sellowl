// 20 dummy profiles for Sell OWL - Instagram-style with bio, location, stats
export const profiles = [
  { id: 1, name: "alex.chen", university: "Stanford University", initials: "AC", verified: true, bio: "Graduating senior. Moving out sale! DM for deals", location: "Stanford, CA", itemsCount: 12, soldCount: 8, lat: 37.43, lng: -122.17 },
  { id: 2, name: "jordan.smith", university: "MIT", initials: "JS", verified: true, bio: "Co-op in NYC - selling everything before the move", location: "Cambridge, MA", itemsCount: 6, soldCount: 3, lat: 42.36, lng: -71.09 },
  { id: 3, name: "emma.wilson", university: "UC Berkeley", initials: "EW", verified: false, bio: "Study abroad spring 2025 • Sublease available", location: "Berkeley, CA", itemsCount: 4, soldCount: 1, lat: 37.87, lng: -122.26 },
  { id: 4, name: "marcus.johnson", university: "Harvard University", initials: "MJ", verified: true, bio: "Furniture + electronics | OBO | Pickup near campus", location: "Boston, MA", itemsCount: 10, soldCount: 15, lat: 42.37, lng: -71.11 },
  { id: 5, name: "sofia.rodriguez", university: "Stanford University", initials: "SR", verified: true, bio: "Medical student moving for residency", location: "Palo Alto, CA", itemsCount: 7, soldCount: 5, lat: 37.43, lng: -122.17 },
  { id: 6, name: "tyler.kim", university: "UCLA", initials: "TK", verified: false, bio: "Room for sublease - furnished, utilities included", location: "Westwood, CA", itemsCount: 1, soldCount: 0, lat: 34.07, lng: -118.45 },
  { id: 7, name: "olivia.martinez", university: "NYU", initials: "OM", verified: true, bio: "NYC student • Electronics & books", location: "New York, NY", itemsCount: 9, soldCount: 12, lat: 40.73, lng: -73.99 },
  { id: 8, name: "noah.patel", university: "MIT", initials: "NP", verified: true, bio: "Internship in Seattle - need to clear out dorm", location: "Cambridge, MA", itemsCount: 8, soldCount: 6, lat: 42.36, lng: -71.09 },
  { id: 9, name: "ava.thompson", university: "Columbia University", initials: "AT", verified: false, bio: "Graduate student | Everything must go", location: "Morningside Heights, NY", itemsCount: 5, soldCount: 2, lat: 40.81, lng: -73.96 },
  { id: 10, name: "liam.brown", university: "UC Berkeley", initials: "LB", verified: true, bio: "Study abroad next semester", location: "Berkeley, CA", itemsCount: 11, soldCount: 4, lat: 37.87, lng: -122.26 },
  { id: 11, name: "mia.davis", university: "Stanford University", initials: "MD", verified: true, bio: "Computer science major | Desk setup for sale", location: "Stanford, CA", itemsCount: 6, soldCount: 9, lat: 37.43, lng: -122.17 },
  { id: 12, name: "ethan.lee", university: "UCLA", initials: "EL", verified: true, bio: "Moving to grad school - furniture in great condition", location: "Los Angeles, CA", itemsCount: 4, soldCount: 7, lat: 34.07, lng: -118.45 },
  { id: 13, name: "isabella.garcia", university: "Harvard University", initials: "IG", verified: false, bio: "Exchange student leaving in Dec", location: "Cambridge, MA", itemsCount: 6, soldCount: 1, lat: 42.37, lng: -71.11 },
  { id: 14, name: "lucas.anderson", university: "MIT", initials: "LA", verified: true, bio: "Sublease: Jan–May 2025 • 2 min from campus", location: "Boston, MA", itemsCount: 1, soldCount: 2, lat: 42.36, lng: -71.09 },
  { id: 15, name: "charlotte.taylor", university: "Yale University", initials: "CT", verified: true, bio: "Senior year cleanout", location: "New Haven, CT", itemsCount: 8, soldCount: 11, lat: 41.31, lng: -73.96 },
  { id: 16, name: "mason.white", university: "Princeton University", initials: "MW", verified: false, bio: "Textbooks + furniture", location: "Princeton, NJ", itemsCount: 5, soldCount: 3, lat: 40.35, lng: -74.66 },
  { id: 17, name: "amelia.harris", university: "Stanford University", initials: "AH", verified: true, bio: "Internship in SF - subletting my room", location: "Stanford, CA", itemsCount: 3, soldCount: 6, lat: 37.43, lng: -122.17 },
  { id: 18, name: "james.clark", university: "UC Berkeley", initials: "JC", verified: true, bio: "Moving to Denver for job | All furniture OBO", location: "Berkeley, CA", itemsCount: 9, soldCount: 4, lat: 37.87, lng: -122.26 },
  { id: 19, name: "harper.lewis", university: "Duke University", initials: "HL", verified: false, bio: "Study abroad spring • Sublease available", location: "Durham, NC", itemsCount: 2, soldCount: 0, lat: 36.00, lng: -78.94 },
  { id: 20, name: "benjamin.walker", university: "MIT", initials: "BW", verified: true, bio: "Co-op fall 2025 - selling dorm setup", location: "Cambridge, MA", itemsCount: 7, soldCount: 10, lat: 42.36, lng: -71.09 },
];

// Captions for posts (Instagram-style)
const postCaptions = [
  "Move-out sale! Everything must go",
  "Furniture in great condition - moving for internship",
  "Sublease available Jan–May • Furnished • Utilities included",
  "Desk, chair, lamp - complete study setup",
  "Textbooks for fall semester - half price",
  "Room for sublease near campus - DM for details",
  "Electronics + furniture bundle deal",
  "Graduating - selling everything! OBO",
  "Study abroad next sem - need to clear out",
  "Sublease: Downtown, 2BR, available now",
  "Full bedroom set - bed, desk, dresser",
  "Monitor + stand - barely used",
  "Coffee table + bookshelf - great condition",
  "Sublease: Campus area, furnished",
  "Engineering textbooks - like new",
  "Gaming setup - PC sold separately",
  "Moving sale - make an offer!",
  "Sublease: Walking distance to campus",
  "IKEA furniture - easy to disassemble",
  "Laptop stand + monitor arm",
];

// Post-level data for filtering (price range, condition, availability from products)
const postMeta = [
  { priceMin: 45, priceMax: 180, condition: "Good", availability: "asap" },
  { priceMin: 80, priceMax: 220, condition: "Like New", availability: "flexible" },
  { priceMin: 850, priceMax: 1200, condition: "Like New", availability: "jan2025" },
  { priceMin: 25, priceMax: 95, condition: "Fair", availability: "asap" },
  { priceMin: 15, priceMax: 65, condition: "Good", availability: "spring2025" },
  { priceMin: 900, priceMax: 1100, condition: "Like New", availability: "jan2025" },
  { priceMin: 30, priceMax: 150, condition: "Good", availability: "flexible" },
  { priceMin: 40, priceMax: 200, condition: "Like New", availability: "dec2024" },
  { priceMin: 20, priceMax: 120, condition: "Fair", availability: "asap" },
  { priceMin: 1100, priceMax: 1400, condition: "Good", availability: "now" },
  { priceMin: 55, priceMax: 250, condition: "Like New", availability: "flexible" },
  { priceMin: 75, priceMax: 180, condition: "Good", availability: "asap" },
  { priceMin: 35, priceMax: 90, condition: "Fair", availability: "dec2024" },
  { priceMin: 950, priceMax: 1150, condition: "Like New", availability: "jan2025" },
  { priceMin: 10, priceMax: 80, condition: "Good", availability: "spring2025" },
  { priceMin: 50, priceMax: 200, condition: "Like New", availability: "flexible" },
  { priceMin: 400, priceMax: 750, condition: "Good", availability: "asap" },
  { priceMin: 800, priceMax: 1000, condition: "Like New", availability: "spring2025" },
  { priceMin: 60, priceMax: 280, condition: "Fair", availability: "flexible" },
  { priceMin: 90, priceMax: 240, condition: "Good", availability: "asap" },
];

// 20 dummy posts (feed items) - each post = one seller's listing
export const posts = [
  { id: 1, profileId: 1, zone: "products", location: "campus", category: "furniture", items: 4, coverImage: "https://picsum.photos/seed/101/600/600", caption: postCaptions[0], ...postMeta[0] },
  { id: 2, profileId: 2, zone: "products", location: "area", category: "electronics", items: 3, coverImage: "https://picsum.photos/seed/102/600/600", caption: postCaptions[1], ...postMeta[1] },
  { id: 3, profileId: 3, zone: "sublease", location: "campus", category: "housing", items: 1, coverImage: "https://picsum.photos/seed/103/600/600", caption: postCaptions[2], ...postMeta[2] },
  { id: 4, profileId: 4, zone: "products", location: "campus", category: "furniture", items: 6, coverImage: "https://picsum.photos/seed/104/600/600", caption: postCaptions[3], ...postMeta[3] },
  { id: 5, profileId: 5, zone: "products", location: "downtown", category: "books", items: 2, coverImage: "https://picsum.photos/seed/105/600/600", caption: postCaptions[4], ...postMeta[4] },
  { id: 6, profileId: 6, zone: "sublease", location: "campus", category: "housing", items: 1, coverImage: "https://picsum.photos/seed/106/600/600", caption: postCaptions[5], ...postMeta[5] },
  { id: 7, profileId: 7, zone: "products", location: "campus", category: "electronics", items: 5, coverImage: "https://picsum.photos/seed/107/600/600", caption: postCaptions[6], ...postMeta[6] },
  { id: 8, profileId: 8, zone: "products", location: "downtown", category: "furniture", items: 4, coverImage: "https://picsum.photos/seed/108/600/600", caption: postCaptions[7], ...postMeta[7] },
  { id: 9, profileId: 9, zone: "products", location: "campus", category: "books", items: 3, coverImage: "https://picsum.photos/seed/109/600/600", caption: postCaptions[8], ...postMeta[8] },
  { id: 10, profileId: 10, zone: "sublease", location: "area", category: "housing", items: 1, coverImage: "https://picsum.photos/seed/110/600/600", caption: postCaptions[9], ...postMeta[9] },
  { id: 11, profileId: 11, zone: "products", location: "campus", category: "furniture", items: 7, coverImage: "https://picsum.photos/seed/111/600/600", caption: postCaptions[10], ...postMeta[10] },
  { id: 12, profileId: 12, zone: "products", location: "campus", category: "electronics", items: 2, coverImage: "https://picsum.photos/seed/112/600/600", caption: postCaptions[11], ...postMeta[11] },
  { id: 13, profileId: 13, zone: "products", location: "downtown", category: "furniture", items: 4, coverImage: "https://picsum.photos/seed/113/600/600", caption: postCaptions[12], ...postMeta[12] },
  { id: 14, profileId: 14, zone: "sublease", location: "campus", category: "housing", items: 1, coverImage: "https://picsum.photos/seed/114/600/600", caption: postCaptions[13], ...postMeta[13] },
  { id: 15, profileId: 15, zone: "products", location: "campus", category: "books", items: 5, coverImage: "https://picsum.photos/seed/115/600/600", caption: postCaptions[14], ...postMeta[14] },
  { id: 16, profileId: 16, zone: "products", location: "downtown", category: "electronics", items: 3, coverImage: "https://picsum.photos/seed/116/600/600", caption: postCaptions[15], ...postMeta[15] },
  { id: 17, profileId: 17, zone: "products", location: "campus", category: "furniture", items: 4, coverImage: "https://picsum.photos/seed/117/600/600", caption: postCaptions[16], ...postMeta[16] },
  { id: 18, profileId: 18, zone: "sublease", location: "area", category: "housing", items: 1, coverImage: "https://picsum.photos/seed/118/600/600", caption: postCaptions[17], ...postMeta[17] },
  { id: 19, profileId: 19, zone: "products", location: "campus", category: "furniture", items: 6, coverImage: "https://picsum.photos/seed/119/600/600", caption: postCaptions[18], ...postMeta[18] },
  { id: 20, profileId: 20, zone: "products", location: "campus", category: "electronics", items: 4, coverImage: "https://picsum.photos/seed/120/600/600", caption: postCaptions[19], ...postMeta[19] },
];

// Product items for each profile (for profile grid)
const productCategories = ["furniture", "electronics", "books", "misc"];
const productNames = ["Desk", "Chair", "Lamp", "Bed Frame", "Bookshelf", "Monitor", "Laptop Stand", "Textbook", "Coffee Table", "Wardrobe", "Sublease Room"];

export const getProfileProducts = (profileId, itemCount) => {
  const products = [];
  for (let i = 0; i < itemCount; i++) {
    products.push({
      id: `${profileId}-${i}`,
      title: productNames[i % productNames.length],
      price: Math.floor(Math.random() * 150) + 20,
      condition: ["Like New", "Good", "Fair"][i % 3],
      category: productCategories[i % productCategories.length],
      image: `https://picsum.photos/seed/${profileId}${i}/400/400`,
    });
  }
  return products;
};

export const getPostByProfileId = (profileId) => posts.find(p => p.profileId === profileId);
export const getProfileById = (id) => profiles.find(p => p.id === id);

// Unique universities for filters
export const universities = [...new Set(profiles.map(p => p.university))].sort();

// Haversine distance in miles
export function getDistanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Current user (the logged-in user)
export const currentUser = {
  id: 0,
  name: "you",
  university: "Stanford University",
  initials: "YU",
  verified: true,
  bio: "CS major. Love sustainability and student deals.",
  location: "Stanford, CA",
  itemsCount: 5,
  soldCount: 12,
  lat: 37.43,
  lng: -122.17,
};

// Dummy offers (order requests as seller)
export const dummyOffers = [
  { id: 1, buyerId: 2, items: "Desk, Chair", total: 120, status: "pending", time: "2m ago" },
  { id: 2, buyerId: 4, items: "Lamp", total: 25, status: "pending", time: "1h ago" },
  { id: 3, buyerId: 7, items: "Monitor, Stand", total: 85, status: "accepted", time: "Yesterday" },
  { id: 4, buyerId: 9, items: "Bookshelf", total: 45, status: "rejected", time: "3d ago" },
];

// Dummy notifications
export const dummyNotifications = [
  { id: 1, type: "offer_accepted", fromId: 7, message: "Olivia Martinez accepted your order request for Monitor, Stand ($85)", time: "Yesterday", read: false },
  { id: 2, type: "offer_rejected", fromId: 9, message: "Ava Thompson rejected your order request for Bookshelf", time: "3d ago", read: true },
  { id: 3, type: "offer_received", fromId: 2, message: "Jordan Smith placed an order request for Desk, Chair ($120)", time: "2m ago", read: false },
  { id: 4, type: "offer_received", fromId: 4, message: "Marcus Johnson placed an order request for Lamp ($25)", time: "1h ago", read: false },
  { id: 5, type: "bid_accepted", fromId: 11, message: "Mia Davis accepted your bid on Desk + Chair", time: "Last week", read: true },
];
