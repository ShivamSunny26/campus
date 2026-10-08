/**
 * Campus Hustle - Frontend Controller & Application State
 * Seamless SPA Router, Real-time Listings, Photo Uploads, Bargaining Chat,
 * Handover PIN & QR verification, PDF/CSV Exports, and FastAPI Bindings.
 */

// Application Global State
const STORAGE_KEYS = {
  saved: "campus_hustle_saved_ids",
  campus: "campus_hustle_active_campus",
  deals: "campus_hustle_deals"
};

function loadPersistedSet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : null;
  } catch (e) { return null; }
}

function persistSet(key, set) {
  try { localStorage.setItem(key, JSON.stringify([...set])); } catch (e) {}
}

function daysAgoISO(days, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// Seeded settlement history → drives profile stats, seller dashboard, chart & CSV
const SEED_DEALS = [
  { txId: "TX-8104-CAL", date: daysAgoISO(0, 10), itemTitle: "Calculus: Early Transcendentals (Stewart 9th)", category: "Books", buyerName: "Sarah Miller", buyerEmail: "sarah@berkeley.edu", sellerName: "Alex Chen", sellerEmail: "alex.chen@berkeley.edu", amount: 40.00, location: "Moffitt Library 3rd Floor Safe Zone", qty: 1, status: "settled" },
  { txId: "TX-8092-CAL", date: daysAgoISO(1, 14), itemTitle: "Sony WH-1000XM4 Headphones", category: "Electronics", buyerName: "Dev Anand", buyerEmail: "dev@berkeley.edu", sellerName: "Alex Chen", sellerEmail: "alex.chen@berkeley.edu", amount: 140.00, location: "Student Union Quad", qty: 1, status: "settled" },
  { txId: "TX-8041-CAL", date: daysAgoISO(2, 11), itemTitle: "TI-84 Plus CE Graphing Calculator", category: "Electronics", buyerName: "Chloe Zhang", buyerEmail: "chloe@berkeley.edu", sellerName: "Alex Chen", sellerEmail: "alex.chen@berkeley.edu", amount: 65.00, location: "Campus Library Main Entrance", qty: 1, status: "settled" },
  { txId: "TX-7990-CAL", date: daysAgoISO(3, 16), itemTitle: "Dorm Mini Fridge 3.2 Cu. Ft.", category: "Dorm Comfort", buyerName: "Marcus Vance", buyerEmail: "marcus@berkeley.edu", sellerName: "Alex Chen", sellerEmail: "alex.chen@berkeley.edu", amount: 75.00, location: "Unit 1 Dorm Courtyard", qty: 1, status: "settled" },
  { txId: "TX-7912-CAL", date: daysAgoISO(5, 13), itemTitle: "DBMS Complete Study Notes", category: "Books", buyerName: "Rahul Sharma", buyerEmail: "rahul@berkeley.edu", sellerName: "Alex Chen", sellerEmail: "alex.chen@berkeley.edu", amount: 25.00, location: "Sproul Plaza Sather Gate", qty: 1, status: "settled" },
  { txId: "TX-7855-CAL", date: daysAgoISO(9, 15), itemTitle: "Trek FX 2 Commuter Bike", category: "Bikes & Wheels", buyerName: "Maya Patel", buyerEmail: "maya@berkeley.edu", sellerName: "Alex Chen", sellerEmail: "alex.chen@berkeley.edu", amount: 180.00, location: "Campus Bike Co-op Safe Zone", qty: 1, status: "settled" }
];

const state = {
  currentView: "home",
  listings: [],
  selectedListing: null,
  activeCategory: "all",
  searchQuery: "",
  sortBy: "newest",
  maxPrice: 360,
  verifiedOnly: true,
  savedIds: loadPersistedSet(STORAGE_KEYS.saved) || new Set(["d4be1705-4b73-4313-8445-191dde1e17f1", "f812a344-9911-4cd2-8bb1-e1248c849201"]),
  photos: [],
  deals: SEED_DEALS.slice(),
  lastSettledDeal: null,
  sellerStats: { rating: 4.9, reviews: 22 },
  currentDeal: null,
  currentDealListing: null,
  chatListing: null,
  notifications: [
    { id: "n1", tone: "secondary", icon: "✓", title: "Deal confirmed with Sarah Miller", body: "Calculus textbook ready for PIN exchange at Moffitt.", time: "5 min ago", read: false },
    { id: "n2", tone: "primary", icon: "★", title: "New Offer from Chloe Zhang ($40)", body: "Full asking price offered with instant escrow deposit.", time: "24 min ago", read: false }
  ],
  offers: [],
  activeCampus: localStorage.getItem(STORAGE_KEYS.campus) || "UC Berkeley"
};

// Seed offers bound to the Calculus listing (offers are contextual to a listing)
function seedOffers() {
  const calc = (window.SEED_LISTINGS || []).find(l => l.title.startsWith("Calculus"));
  const listingId = calc ? calc.id : ((window.SEED_LISTINGS || [])[0] || {}).id;
  const askPrice = calc ? calc.price : 40;
  state.offers = [
    {
      id: "o1", listingId,
      buyerName: "Chloe Zhang", buyerMajor: "Cognitive Science '26", buyerRating: 4.9,
      buyerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNYiVbFPMLFn3bhkaaOoWDcJwJuAwCZemgktsTo-z5Y-wcLLNMsEPZY1IhyAq3TbqL4IF3cDT6ESqlXkoavtlQTsrYiePK-IptMSWZZ_ba7I12TNnZurNR1TQnfl5t202i0fjdannsGkU_f7aqdMdoQCNSCW3g4uOALByeBoYi4N0r5EyknOFdWRdBXtJ9lCXGwccRMQzOCJIxiR9zhoAlcuRPmbYs6Mro4qtgkjk",
      amount: askPrice, kind: "top",
      message: "Hi! Can meet today at 4:30 PM at Moffitt Library front entrance. Have cash or Venmo ready!",
      expires: "Auto-expires in 2h 45m", active: true
    },
    {
      id: "o2", listingId,
      buyerName: "Marcus Vance", buyerMajor: "Economics '25", buyerRating: 4.8,
      buyerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuQi1ZABRLQVM-9Kh1xfE_1Szwlnkc3DE2_uSWVTbOMMVdLRERvcjL_FQ3k7piRckukcrPtmElsHTSN1g3fZGqoyYIqEYdhuRh65bqx5rRx3_jWuXiIiVD3tA8bnzWgNI8akdqNhtwYfXHbX-Vi6Q2t8eTuRFyeODKVIHOw_Yu6qc988VVtiwUyBAFQ6DRgi3dVqenhcTyLGTZN4TG4xXonu5UBxg5oqsj4Rv2Fs4",
      amount: Math.max(1, Math.round((askPrice - 4) * 100) / 100), kind: "counter",
      message: "Can grab it right now at Unit 1 courtyard if you can do it for a bit less.",
      expires: "Counter offer", active: true
    }
  ];
}

// ============================================================================
// INITIALIZATION & LIFECYCLE
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  seedOffers();
  initRouter();
  initUserSessionUI();
  await loadListings();
  testBackendConnection();
  bindGlobalEvents();
  renderDynamicUI();
});

function initRouter() {
  window.addEventListener("hashchange", handleHashChange);
  const initialHash = window.location.hash.replace("#", "") || "home";
  navigateTo(initialHash, {}, false);
}

function handleHashChange() {
  const hash = window.location.hash.replace("#", "") || "home";
  const [viewName, queryStr] = hash.split("?");
  const params = {};
  if (queryStr) {
    new URLSearchParams(queryStr).forEach((v, k) => { params[k] = v; });
  }
  navigateTo(viewName, params, false);
}

function navigateTo(viewName, params = {}, updateHash = true) {
  // Validate view exists
  const targetSection = document.getElementById(`view-${viewName}`);
  if (!targetSection) {
    viewName = "home";
  }

  state.currentView = viewName;

  // Toggle active view panel
  document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
  const viewEl = document.getElementById(`view-${viewName}`);
  if (viewEl) viewEl.classList.add("active");

  // Update bottom navigation bar
  document.querySelectorAll(".nav-tab").forEach(tab => {
    const isCurrent = tab.dataset.view === viewName;
    tab.classList.toggle("active", isCurrent);
    tab.classList.toggle("text-primary", isCurrent);
    tab.classList.toggle("font-bold", isCurrent);
    tab.classList.toggle("text-on-surface-variant", !isCurrent);
  });

  // Handle view-specific initializations
  if (viewName === "detail" && params.id) {
    loadListingDetail(params.id);
  } else if (viewName === "seller") {
    renderSellerStudio();
    renderSellerDashboard();
  } else if (viewName === "profile") {
    renderProfileView();
  } else if (viewName === "offers") {
    renderOffersView();
  } else if (viewName === "chat") {
    renderChatContext();
  } else if (viewName === "handover-pin") {
    renderHandoverView();
  } else if (viewName === "receipt") {
    renderReceiptView();
  } else if (viewName === "create") {
    renderPhotoSlots();
    updateFormPreview();
  } else if (viewName === "home" || viewName === "explore") {
    renderFeedStats();
    renderFilterBadges();
  }

  // Update URL hash without extra history spam
  if (updateHash) {
    let hashStr = `#${viewName}`;
    if (params.id) hashStr += `?id=${params.id}`;
    window.location.hash = hashStr;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================================================================
// BACKEND API & DATA LOADING
// ============================================================================
async function loadListings(category = null) {
  try {
    const list = await window.campusApi.getListings(category);
    state.listings = list;
    renderAllListingGrids();
  } catch (err) {
    console.error("Error loading listings:", err);
    state.listings = window.SEED_LISTINGS || [];
    renderAllListingGrids();
  }
  renderDynamicUI();
}

// ============================================================================
// DYNAMIC UI HELPERS & MASTER RENDER
// ============================================================================
function fmtMoney(n) {
  const value = Number(n) || 0;
  return `$${value.toFixed(2)}`;
}

function fmtMoneyShort(n) {
  const value = Number(n) || 0;
  return Number.isInteger(value) ? `$${value}` : `$${value.toFixed(2)}`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function initialsOf(name) {
  return String(name || "ST")
    .split(" ")
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function generateTxId() {
  return `TX-${Math.floor(1000 + Math.random() * 9000)}-CAL`;
}

function dealTotals() {
  const total = state.deals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  return { total, count: state.deals.length };
}

function activeOffers() {
  return state.offers.filter(o => o.active);
}

// Master renderer — keeps every bound surface in sync with live state
function renderDynamicUI() {
  renderFeedStats();
  renderFilterBadges();
  renderProfileView();
  renderSellerDashboard();
  renderOffersView();
  renderChatContext();
  renderHandoverView();
  renderReceiptView();
  renderPdfModal();
  renderCsvModal();
  renderNotifications();
  renderNavBadges();
  renderPhotoSlots();
}

function renderFeedStats() {
  setText("campus-feed-subtext", `${state.activeCampus} • ${state.listings.length} listings live today`);
  setText("header-campus-name", state.activeCampus);
}

function renderNavBadges() {
  const badge = document.getElementById("nav-chat-badge");
  const count = activeOffers().length;
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }
}

async function refreshListings() {
  showToast("Syncing with live campus database...");
  await loadListings(state.activeCategory);
  showToast("Listings up to date! ✓");
}

async function testBackendConnection() {
  const pill = document.getElementById("backend-status-pill");
  const dot = document.getElementById("backend-dot");
  const text = document.getElementById("backend-text");
  const profStatus = document.getElementById("profile-backend-status");

  if (!pill) return;

  const result = await window.campusApi.checkHealth();
  if (result.ok) {
    dot.className = "w-2 h-2 rounded-full bg-secondary animate-pulse";
    text.textContent = `Render API • ${result.latency}ms`;
    if (profStatus) profStatus.textContent = `200 OK • Online (${result.latency}ms)`;
  } else {
    dot.className = "w-2 h-2 rounded-full bg-tertiary";
    text.textContent = "Connecting to Render...";
    if (profStatus) profStatus.textContent = "Connecting (Waking up Render free instance)";
  }
}

// ============================================================================
// UI RENDERING - LISTINGS & CARDS
// ============================================================================
function renderAllListingGrids() {
  renderHomeListings();
  renderExploreListings();
}

function getFilteredListings() {
  return state.listings.filter(item => {
    // Category match
    if (state.activeCategory && state.activeCategory !== "all") {
      const catMatch = item.category.toLowerCase().includes(state.activeCategory.toLowerCase()) ||
                       state.activeCategory.toLowerCase().includes(item.category.toLowerCase());
      if (!catMatch) return false;
    }

    // Search query match
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const text = `${item.title} ${item.description} ${item.category} ${item.pickup_location}`.toLowerCase();
      if (!text.includes(q)) return false;
    }

    // Price ceiling
    if (state.maxPrice && item.price > state.maxPrice) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (state.sortBy === "price_asc") return a.price - b.price;
    if (state.sortBy === "price_desc") return b.price - a.price;
    if (state.sortBy === "rating") return (b.seller_rating || 0) - (a.seller_rating || 0);
    return 0; // default newest
  });
}

function createListingCardHTML(item) {
  const isSaved = state.savedIds.has(item.id);
  const photoUrl = (item.images && item.images.length > 0)
    ? item.images[0]
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuC3WtJjASTuugCYgHxZOGqKfPpqUcvguhWieK5Mvm5tCcbyQ7bKB7kz7szTviyEXkFwIdfZNx1KQ6F4zopOxfeYXE3jj_htHbD5L-DvL91sAnKSD5qhu407HtLDf9uJfOezId41tlx3YLEAMX-cAMSl8epYEspo_nPaSZxaCofubqop7dS3fmSPtLZkN3WpS-ACRq-qNQm5dxrBv1TtDuue_VYClj_JbeLFkssfFAo";

  return `
    <article class="listing-card-lift bg-surface-container-lowest rounded-2xl overflow-hidden shadow-xs border border-border-subtle cursor-pointer flex flex-col justify-between" onclick="openListingDetail('${item.id}')">
      <!-- Image Thumbnail Slot -->
      <div class="relative w-full aspect-[4/3] bg-surface-container-low overflow-hidden">
        <img src="${photoUrl}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy"/>
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1">
          <span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-campus-emerald-dark font-bold text-[10px] shadow-xs">
            <span class="material-symbols-outlined text-xs text-secondary filled">school</span>
            <span>.edu</span>
          </span>
          <span class="px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md text-on-surface font-semibold text-[10px] shadow-xs">
            ${item.category}
          </span>
        </div>
        <button type="button" aria-label="Save item" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center text-outline hover:text-error transition-all shadow-xs" onclick="toggleSaveListing(event, '${item.id}')">
          <span class="material-symbols-outlined text-base ${isSaved ? 'text-error filled' : ''}">favorite</span>
        </button>
      </div>

      <!-- Card Body Content -->
      <div class="p-3.5 flex flex-col justify-between flex-1 gap-2">
        <div>
          <!-- Seller micro-badge -->
          <div class="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
            <span class="font-bold flex items-center gap-1 text-campus-emerald-dark truncate max-w-[140px]">
              <span class="material-symbols-outlined text-xs filled text-secondary">verified</span>
              <span>${item.seller_name || 'Alex Chen'}</span>
            </span>
            <span class="text-tertiary font-bold flex items-center gap-0.5">
              <span>★</span><span>${item.seller_rating || '4.9'}</span>
            </span>
          </div>

          <h3 class="font-bold text-sm text-on-surface line-clamp-1 leading-snug">${item.title}</h3>
          <p class="text-xs text-on-surface-variant line-clamp-1 mt-0.5">${item.description}</p>
        </div>

        <!-- Price & Distance Footer -->
        <div class="flex items-baseline justify-between pt-1 border-t border-border-subtle/50">
          <div class="flex items-baseline gap-1">
            <span class="text-lg font-extrabold text-primary">$${Number(item.price).toFixed(0)}</span>
            <span class="text-[11px] text-outline font-semibold">${item.price_unit || '/item'}</span>
          </div>
          <span class="text-[11px] text-outline font-semibold flex items-center gap-0.5">
            <span class="material-symbols-outlined text-xs text-secondary">pin_drop</span>
            <span>${item.distance || '0.3 mi'}</span>
          </span>
        </div>
      </div>
    </article>
  `;
}

function renderHomeListings() {
  const container = document.getElementById("home-listings-grid");
  if (!container) return;

  const items = getFilteredListings();
  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-surface-container-lowest rounded-2xl border border-border-subtle">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
        <h3 class="font-bold text-base text-on-surface">No campus listings found</h3>
        <p class="text-xs text-on-surface-variant mt-1">Try resetting your search query or category filters.</p>
        <button type="button" class="mt-3 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold" onclick="resetFilters()">Reset Filters</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(createListingCardHTML).join("");
}

function renderExploreListings() {
  const container = document.getElementById("explore-listings-grid");
  if (!container) return;

  const items = getFilteredListings();
  if (items.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-surface-container-lowest rounded-2xl border border-border-subtle">
        <span class="material-symbols-outlined text-4xl text-outline mb-2">filter_alt_off</span>
        <h3 class="font-bold text-base text-on-surface">No listings match your criteria</h3>
        <p class="text-xs text-on-surface-variant mt-1">Try increasing max price or searching all categories.</p>
        <button type="button" class="mt-3 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold" onclick="resetFilters()">Reset All</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(createListingCardHTML).join("");
}

// ============================================================================
// LISTING DETAIL VIEW & INTERACTIVE CAROUSEL
// ============================================================================
let currentCarouselIndex = 0;
let currentDetailImages = [];

function openListingDetail(listingId) {
  const item = state.listings.find(l => l.id === listingId);
  if (!item) return;

  state.selectedListing = item;
  navigateTo("detail", { id: listingId });
}

function loadListingDetail(listingId) {
  let item = state.listings.find(l => l.id === listingId);
  if (!item && window.SEED_LISTINGS) {
    item = window.SEED_LISTINGS.find(l => l.id === listingId);
  }
  if (!item) return;

  state.selectedListing = item;

  // Title, price, category
  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-price").textContent = `$${Number(item.price).toFixed(0)}`;
  document.getElementById("detail-price-unit").textContent = item.price_unit || "/item";
  document.getElementById("detail-category-badge").textContent = item.category;
  document.getElementById("detail-location").textContent = item.pickup_location;
  document.getElementById("detail-desc").textContent = item.description;

  // Original price & savings (dynamic — hidden when no retail reference exists)
  const origEl = document.getElementById("detail-orig-price");
  const savingsEl = document.getElementById("detail-savings-text");
  const originalPrice = Number(item.original_price) || 0;
  if (origEl) {
    if (originalPrice > Number(item.price)) {
      origEl.textContent = `${fmtMoneyShort(originalPrice)} retail`;
      origEl.classList.remove("hidden");
    } else {
      origEl.classList.add("hidden");
    }
  }
  if (savingsEl) {
    if (originalPrice > Number(item.price)) {
      savingsEl.textContent = `Save ${fmtMoneyShort(originalPrice - Number(item.price))} vs buying new`;
      savingsEl.classList.remove("hidden");
    } else {
      savingsEl.classList.add("hidden");
    }
  }

  // Seller reputation stats
  setText("detail-seller-rating", `★ ${item.seller_rating != null ? item.seller_rating : state.sellerStats.rating}`);
  setText("detail-seller-deals", `${item.seller_deals != null ? item.seller_deals : 0} completed sales`);

  if (document.getElementById("detail-condition-tag")) {
    document.getElementById("detail-condition-tag").textContent = item.condition || "Inspected • Excellent";
  }
  if (document.getElementById("detail-time-ago")) {
    document.getElementById("detail-time-ago").innerHTML = `
      <span class="material-symbols-outlined text-xs">schedule</span>
      <span>${item.time_ago || '1 hour ago'}</span>
    `;
  }

  // Seller info
  if (document.getElementById("detail-seller-name")) {
    document.getElementById("detail-seller-name").textContent = item.seller_name || "Alex Chen";
  }
  if (document.getElementById("detail-seller-campus")) {
    document.getElementById("detail-seller-campus").textContent = item.seller_campus || "UC Berkeley '25";
  }
  if (item.seller_avatar && document.getElementById("detail-seller-avatar")) {
    document.getElementById("detail-seller-avatar").src = item.seller_avatar;
  }

  // Heart state
  const isSaved = state.savedIds.has(item.id);
  const heartBtn = document.getElementById("detail-heart-btn");
  if (heartBtn) {
    heartBtn.innerHTML = `<span class="material-symbols-outlined text-2xl ${isSaved ? 'text-error filled' : ''}">favorite</span>`;
  }

  // Setup Image Carousel
  currentDetailImages = (item.images && item.images.length > 0)
    ? item.images
    : ["https://lh3.googleusercontent.com/aida-public/AB6AXuCH9J_nhk_6YInUuaOuZk7oBn551ty6kpkII0M8cDGaWXuM7OIPXQLNtd4pwaQ30I5fNebvV53Fi7yYabmGU7Rkz1OOf1EYwenZ-lqV_Wc0McYSEv9kxUgHE4cleDM5OvYPFTXA0UofI0FlAyufxmQYSzYDsfqEA8zkrHg7Y7QFdFxyaihVRR2xsxLX_NdoFcdxeTSMP0-9iJNjfBaMhtYHZQRr5C-vcELnPpw40l4"];

  currentCarouselIndex = 0;
  renderCarouselTrack();
}

function renderCarouselTrack() {
  const track = document.getElementById("detail-carousel-track");
  const dotsContainer = document.getElementById("detail-carousel-dots");
  const indicator = document.getElementById("detail-carousel-indicator");

  if (!track) return;

  track.innerHTML = currentDetailImages.map(img => `
    <div class="w-full h-full flex-shrink-0 relative">
      <img src="${img}" alt="Product Photo" class="w-full h-full object-cover"/>
    </div>
  `).join("");

  track.style.transform = `translateX(-${currentCarouselIndex * 100}%)`;

  if (dotsContainer) {
    dotsContainer.innerHTML = currentDetailImages.map((_, i) => `
      <button type="button" aria-label="Slide ${i+1}" class="h-1.5 rounded-full transition-all ${i === currentCarouselIndex ? 'w-5 bg-primary' : 'w-1.5 bg-surface-container-lowest/80'}" onclick="setCarouselSlide(${i})"></button>
    `).join("");
  }

  if (indicator) {
    indicator.textContent = `${currentCarouselIndex + 1} / ${currentDetailImages.length}`;
  }
}

function setCarouselSlide(index) {
  if (index < 0) index = currentDetailImages.length - 1;
  if (index >= currentDetailImages.length) index = 0;
  currentCarouselIndex = index;
  renderCarouselTrack();
}

// Carousel Next / Prev Click
document.addEventListener("click", e => {
  if (e.target.closest("#carousel-prev-btn")) {
    setCarouselSlide(currentCarouselIndex - 1);
  } else if (e.target.closest("#carousel-next-btn")) {
    setCarouselSlide(currentCarouselIndex + 1);
  }
});

function toggleDetailSave() {
  if (!state.selectedListing) return;
  const id = state.selectedListing.id;
  const isSaved = state.savedIds.has(id);
  if (isSaved) {
    state.savedIds.delete(id);
    showToast("Removed from wishlist");
  } else {
    state.savedIds.add(id);
    showToast("Saved to your campus wishlist ❤️");
  }
  persistSet(STORAGE_KEYS.saved, state.savedIds);
  const heartBtn = document.getElementById("detail-heart-btn");
  if (heartBtn) {
    heartBtn.innerHTML = `<span class="material-symbols-outlined text-2xl ${!isSaved ? 'text-error filled' : ''}">favorite</span>`;
  }
  renderAllListingGrids();
  renderProfileView();
}

function toggleSaveListing(e, id) {
  e.stopPropagation();
  if (state.savedIds.has(id)) {
    state.savedIds.delete(id);
    showToast("Removed from saved items");
  } else {
    state.savedIds.add(id);
    showToast("Saved to campus wishlist ❤️");
  }
  persistSet(STORAGE_KEYS.saved, state.savedIds);
  renderAllListingGrids();
  renderProfileView();
}

function shareCurrentListing() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
    showToast("Listing link copied to clipboard! 📋");
  } else {
    showToast("Share: " + window.location.href);
  }
}

// ============================================================================
// CREATE LISTING FORM & LIVE PREVIEW
// ============================================================================
function updateFormPreview() {
  const title = document.getElementById("create-title")?.value.trim() || "Your listing title";
  const cat = document.getElementById("create-category")?.value || "Electronics";
  const price = document.getElementById("create-price")?.value.trim() || "0";
  const loc = document.getElementById("create-location")?.value.trim() || "Campus pickup spot";
  const qty = document.getElementById("create-quantity")?.value || "1";

  const pTitle = document.getElementById("form-live-preview-title");
  const pCat = document.getElementById("form-live-preview-cat");
  const pPrice = document.getElementById("form-live-preview-price");
  const pLoc = document.getElementById("form-live-preview-loc-text");
  const pQty = document.getElementById("form-live-preview-qty");

  if (pTitle) pTitle.textContent = title;
  if (pCat) pCat.textContent = cat;
  if (pPrice) pPrice.textContent = `$${price}`;
  if (pLoc) pLoc.textContent = loc;
  if (pQty) pQty.textContent = `Qty: ${qty}`;
}

// Dynamic photo slots (up to 5 photos with cover badge & removal)
function renderPhotoSlots() {
  const grid = document.getElementById("photo-slots-grid");
  if (!grid) return;

  const photosHtml = state.photos.map((src, i) => `
    <div class="relative aspect-square rounded-xl bg-surface-container-high overflow-hidden shadow-xs border border-border-subtle">
      <img src="${src}" alt="Photo ${i + 1}" class="w-full h-full object-cover"/>
      ${i === 0 ? '<span class="absolute bottom-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1.5 rounded">Cover</span>' : ""}
      <button type="button" aria-label="Remove photo" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-inverse-surface/80 text-inverse-on-surface flex items-center justify-center" onclick="removePhoto(${i})">
        <span class="material-symbols-outlined text-xs">close</span>
      </button>
    </div>
  `).join("");

  const addSlot = state.photos.length < 5 ? `
    <label class="cursor-pointer aspect-square rounded-xl bg-surface-container-low hover:bg-surface-container border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 text-primary transition-all shadow-xs">
      <input type="file" accept="image/*" class="hidden" onchange="handlePhotoUpload(event)"/>
      <span class="material-symbols-outlined text-2xl">add_photo_alternate</span>
      <span class="text-[11px] font-bold">Add</span>
    </label>
  ` : "";

  const placeholders = Array.from({ length: Math.max(0, 4 - state.photos.length - (addSlot ? 1 : 0)) })
    .map((_, i) => `<div class="aspect-square rounded-xl bg-surface-container-low/50 border border-border-subtle/50 flex items-center justify-center text-outline/40 text-xs font-semibold">${state.photos.length + i + 1}</div>`)
    .join("");

  grid.innerHTML = photosHtml + addSlot + placeholders;

  const badge = document.getElementById("photo-count-badge");
  if (badge) badge.textContent = `${state.photos.length} / 5 added`;

  const previewImg = document.getElementById("form-live-preview-img");
  const previewPlaceholder = document.getElementById("form-live-preview-placeholder");
  if (previewImg) {
    if (state.photos.length > 0) {
      previewImg.src = state.photos[0];
      previewImg.classList.remove("hidden");
      if (previewPlaceholder) previewPlaceholder.classList.add("hidden");
    } else {
      previewImg.classList.add("hidden");
      previewImg.removeAttribute("src");
      if (previewPlaceholder) previewPlaceholder.classList.remove("hidden");
    }
  }
}

function removePhoto(index) {
  state.photos.splice(index, 1);
  renderPhotoSlots();
  showToast("Photo removed");
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (state.photos.length >= 5) {
    showToast("Maximum 5 photos per listing");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    state.photos.push(e.target.result);
    renderPhotoSlots();
    showToast("Photo attached successfully! 📷");
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

async function handleCreateListingSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("create-title").value;
  const category = document.getElementById("create-category").value;
  const price = parseFloat(document.getElementById("create-price").value);
  const location = document.getElementById("create-location").value;
  const quantity = parseInt(document.getElementById("create-quantity").value) || 1;
  const description = document.getElementById("create-description").value;

  const btn = document.getElementById("create-submit-btn");
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined text-base animate-spin">progress_activity</span><span>Publishing to Campus API...</span>`;

  try {
    const newListing = await window.campusApi.createListing({
      title,
      category,
      price,
      price_unit: "/item",
      pickup_location: location,
      quantity,
      description,
      images: state.photos.slice()
    });

    state.listings.unshift(newListing);
    pushNotification("secondary", "✓", `Listing published: ${title}`, "Live on your campus marketplace right now.", "Just now");
    state.photos = [];
    renderPhotoSlots();
    document.getElementById("create-listing-form")?.reset();
    updateFormPreview();
    renderAllListingGrids();
    renderDynamicUI();
    showToast("🎉 Listing published to campus marketplace!");
    setTimeout(() => {
      navigateTo("detail", { id: newListing.id });
    }, 500);
  } catch (err) {
    console.error("Listing publish error:", err);
    // If auth required, open auth view with notice
    if (err.message.includes("sign in")) {
      showToast("Please sign in with your student account first");
      navigateTo("auth");
    } else {
      showToast("Notice: " + err.message);
      // Fallback save to local listings array for presentation
      const fallbackItem = {
        id: "loc-" + Date.now(),
        seller_id: "demo-user-1",
        title,
        category,
        price,
        price_unit: "/item",
        pickup_location: location,
        quantity,
        description,
        status: "active",
        verified_seller: true,
        seller_name: window.campusApi.user?.full_name || "You",
        seller_rating: 5.0,
        seller_deals: 1,
        seller_campus: "UC Berkeley",
        time_ago: "Just now",
        distance: "0.1 mi",
        images: state.photos.length > 0 ? state.photos.slice() : [
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC3WtJjASTuugCYgHxZOGqKfPpqUcvguhWieK5Mvm5tCcbyQ7bKB7kz7szTviyEXkFwIdfZNx1KQ6F4zopOxfeYXE3jj_htHbD5L-DvL91sAnKSD5qhu407HtLDf9uJfOezId41tlx3YLEAMX-cAMSl8epYEspo_nPaSZxaCofubqop7dS3fmSPtLZkN3WpS-ACRq-qNQm5dxrBv1TtDuue_VYClj_JbeLFkssfFAo"
        ]
      };
      state.listings.unshift(fallbackItem);
      state.photos = [];
      renderPhotoSlots();
      renderAllListingGrids();
      renderDynamicUI();
      showToast("Listing created locally and queued! ✓");
      setTimeout(() => navigateTo("seller"), 500);
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span class="material-symbols-outlined text-lg">publish</span><span>Publish Listing to Campus</span>`;
  }
}

// ============================================================================
// STUDENT AUTH (SIGN IN & REGISTER)
// ============================================================================
function switchAuthTab(tab) {
  const signinTab = document.getElementById("auth-tab-signin");
  const regTab = document.getElementById("auth-tab-register");
  const signinBox = document.getElementById("auth-signin-box");
  const regBox = document.getElementById("auth-register-box");

  if (tab === "signin") {
    signinTab.className = "py-2.5 px-3 rounded-lg transition-all duration-200 bg-surface-container-lowest text-primary shadow-xs flex items-center justify-center gap-1.5";
    regTab.className = "py-2.5 px-3 rounded-lg transition-all duration-200 text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5";
    signinBox.classList.remove("hidden");
    regBox.classList.add("hidden");
  } else {
    regTab.className = "py-2.5 px-3 rounded-lg transition-all duration-200 bg-surface-container-lowest text-primary shadow-xs flex items-center justify-center gap-1.5";
    signinTab.className = "py-2.5 px-3 rounded-lg transition-all duration-200 text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1.5";
    regBox.classList.remove("hidden");
    signinBox.classList.add("hidden");
  }
}

function quickFillDemoStudent() {
  document.getElementById("signin-email").value = "alex.chen@berkeley.edu";
  document.getElementById("signin-password").value = "CampusHustle2026!Secure";
  showToast("Pre-filled official student test account ⚡");
}

async function handleSignInSubmit() {
  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;
  const btn = document.getElementById("signin-submit-btn");

  if (!email || !password) {
    showToast("Please enter student email and password");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined text-base animate-spin">progress_activity</span><span>Authenticating with Render API...</span>`;

  try {
    const { user } = await window.campusApi.login(email, password);
    showToast(`Welcome back, ${user.full_name || 'Student'}! 👋`);
    initUserSessionUI();
    renderDynamicUI();
    setTimeout(() => navigateTo("home"), 500);
  } catch (err) {
    console.error("Login error:", err);
    showToast("Login error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Sign In to Campus Hustle</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
  }
}

async function handleRegisterSubmit() {
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const campus = document.getElementById("reg-campus").value;
  const btn = document.getElementById("register-submit-btn");

  if (!name || !email || !password) {
    showToast("Please complete all registration fields");
    return;
  }

  if (password.length < 12) {
    showToast("Password must be at least 12 characters (FastAPI requirement)");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined text-base animate-spin">progress_activity</span><span>Registering student account...</span>`;

  try {
    await window.campusApi.register(email, password, name, campus);
    showToast("Account created! Logging in...");
    await window.campusApi.login(email, password);
    initUserSessionUI();
    renderDynamicUI();
    setTimeout(() => navigateTo("home"), 600);
  } catch (err) {
    console.error("Registration error:", err);
    showToast("Registration error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Create Student Account</span><span class="material-symbols-outlined text-base">check</span>`;
  }
}

function handleLogout() {
  window.campusApi.logout();
  initUserSessionUI();
  renderDynamicUI();
  showToast("Signed out of Campus Hustle");
  navigateTo("home");
}

function initUserSessionUI() {
  renderProfileView();
}

// ============================================================================
// STUDENT PROFILE VIEW (fully state-driven)
// ============================================================================
function renderProfileView() {
  const user = window.campusApi.user;
  const initialsEl = document.getElementById("header-avatar-initials");
  const profName = document.getElementById("profile-name");
  const profEmail = document.getElementById("profile-email");
  const profCampus = document.getElementById("profile-campus");

  const displayName = user?.full_name || "Guest Student";
  const displayEmail = user?.email || "Not signed in";
  const displayCampus = user?.campus_name || state.activeCampus;

  if (initialsEl) initialsEl.textContent = initialsOf(user ? (user.full_name || user.email) : "AC");
  if (profName) profName.textContent = displayName;
  if (profEmail) profEmail.textContent = displayEmail;
  if (profCampus) profCampus.textContent = user
    ? `${displayCampus} • Verified Student`
    : `${displayCampus} • Browse as guest`;

  // Verified badge reflects real session state
  const badge = document.getElementById("profile-verified-badge");
  if (badge) badge.classList.toggle("hidden", !user);

  // Trust metrics derived from live deals + wishlist
  const { total, count } = dealTotals();
  setText("profile-total-earned", fmtMoney(total));
  setText("profile-deals-completed", String(count));
  setText("profile-trust-rating", `${state.sellerStats.rating} ★`);
  setText("profile-saved-count", String(state.savedIds.size));
  setText("profile-seller-subtitle", `${fmtMoneyShort(total)} Milestone & Listings`);
  setText("profile-offers-subtitle", `${activeOffers().length} Competing Student Offers`);

  // Token / session inspector
  setText("profile-token-status", window.campusApi.token ? "Active JWT" : "No session");
}

// ============================================================================
// SELLER STUDIO & DASHBOARD (stats, milestone, chart, own listings)
// ============================================================================
function getMyListings() {
  const user = window.campusApi.user;
  if (user) {
    const mine = state.listings.filter(l =>
      l.seller_id === user.id || String(l.id).startsWith("loc-") || l.seller_name === user.full_name
    );
    if (mine.length > 0) return mine;
  }
  const seededMine = state.listings.filter(l => (l.seller_name || "Alex Chen") === "Alex Chen");
  return seededMine.length > 0 ? seededMine : state.listings.slice(0, 4);
}

function renderSellerDashboard() {
  const { total, count } = dealTotals();
  const myToday = state.deals
    .filter(d => new Date(d.date).toDateString() === new Date().toDateString())
    .reduce((s, d) => s + (Number(d.amount) || 0), 0);

  setText("seller-revenue", fmtMoney(total));
  setHTML("seller-revenue-delta", `<span class="material-symbols-outlined text-xs">trending_up</span> ${myToday > 0 ? `+${fmtMoneyShort(myToday)} today` : "No sales today"}`);
  setText("seller-sold-trades", String(count));
  setText("seller-active-count", String(getMyListings().length));
  setText("seller-rating", `${state.sellerStats.rating} ★`);
  setText("seller-reviews", `from ${state.sellerStats.reviews} reviews`);

  // Milestone banner (level thresholds driven by real revenue)
  const tiers = [
    { min: 500, title: "Campus Legend ($500+ Club)", level: "Level Unlocked" },
    { min: 250, title: "Campus Grinder ($250+ Club)", level: "Level Unlocked" },
    { min: 100, title: "Hustle Starter ($100+ Club)", level: "Level Up" },
    { min: 0, title: "New Campus Seller", level: "Getting Started" }
  ];
  const tier = tiers.find(t => total >= t.min) || tiers[tiers.length - 1];
  setText("seller-milestone-level", tier.level);
  setText("seller-milestone-title", tier.title);
  setHTML("seller-milestone-text", `Milestone reached: <strong class="text-on-primary">${count} completed sales & ${fmtMoney(total)} earned</strong> on campus! Keep selling to unlock the next honor badge & priority explore placement.`);

  renderSellerChart();
}

function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function renderSellerChart() {
  const days = lastNDays(7);
  const dayTotals = days.map(day =>
    state.deals
      .filter(d => new Date(d.date).toDateString() === day.toDateString())
      .reduce((s, d) => s + (Number(d.amount) || 0), 0)
  );

  const labels = document.getElementById("seller-chart-labels");
  if (labels) {
    const dayName = d => d.toLocaleDateString(undefined, { weekday: "short" });
    labels.innerHTML = days.map((day, i) => `<span>${dayName(day)} (${fmtMoneyShort(dayTotals[i])})</span>`).join("");
  }

  const line = document.getElementById("seller-chart-line");
  const area = document.getElementById("seller-chart-area");
  if (!line || !area) return;

  const W = 600, H = 160, pad = 12;
  const max = Math.max(...dayTotals, 1);
  const step = dayTotals.length > 1 ? (W - pad * 2) / (dayTotals.length - 1) : 0;
  const points = dayTotals.map((v, i) => [pad + i * step, H - pad - (v / max) * (H - pad * 2)]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

  line.setAttribute("d", path);
  area.setAttribute("d", `${path} L${(pad + (points.length - 1) * step).toFixed(1)} ${H} L${pad} ${H} Z`);

  // Week-over-week trend
  const thisWeek = dayTotals.reduce((s, v) => s + v, 0);
  const priorDeals = state.deals.filter(d => {
    const t = new Date(d.date).getTime();
    return t < days[0].getTime() && t >= days[0].getTime() - 7 * 86400000;
  });
  const lastWeek = priorDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const trendEl = document.getElementById("seller-chart-trend");
  if (trendEl) {
    if (lastWeek > 0) {
      const pct = ((thisWeek - lastWeek) / lastWeek) * 100;
      trendEl.textContent = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% vs last week`;
      trendEl.className = `text-xs font-bold px-2.5 py-1 rounded-full ${pct >= 0 ? "bg-campus-emerald-light text-campus-emerald-dark" : "bg-error-container text-on-error-container"}`;
    } else {
      trendEl.textContent = `${fmtMoneyShort(thisWeek)} this week`;
      trendEl.className = "text-xs bg-campus-emerald-light text-campus-emerald-dark font-bold px-2.5 py-1 rounded-full";
    }
  }
}

// ============================================================================
// SELLER STUDIO & DASHBOARD
// ============================================================================
function renderSellerStudio() {
  const container = document.getElementById("seller-listings-table");
  if (!container) return;

  const items = getMyListings().slice(0, 6);
  if (items.length === 0) {
    container.innerHTML = `
      <div class="py-8 text-center bg-surface-container-low rounded-xl border border-border-subtle/40">
        <span class="material-symbols-outlined text-3xl text-outline mb-1">storefront</span>
        <p class="text-sm font-bold text-on-surface">No active listings yet</p>
        <p class="text-xs text-on-surface-variant mt-0.5">Publish your first item to start earning on campus.</p>
        <button type="button" class="mt-3 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold" onclick="navigateTo('create')">Create Listing</button>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="bg-surface-container-low p-3.5 rounded-xl flex items-center justify-between gap-3 border border-border-subtle/40">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${(item.images && item.images[0]) || ''}" alt="${item.title}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-surface-container"/>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-xs text-on-surface truncate">${item.title}</span>
            <span class="px-1.5 py-0.2 rounded-full bg-campus-emerald-light text-campus-emerald-dark text-[9px] font-bold">${item.status === 'active' ? 'Active' : item.status}</span>
          </div>
          <p class="text-xs text-primary font-extrabold mt-0.5">$${Number(item.price).toFixed(0)} <span class="text-outline font-normal text-[11px]">${item.price_unit || ''}</span></p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <button type="button" class="h-8 px-2.5 rounded-lg bg-surface-container text-primary text-xs font-bold hover:bg-surface-container-high transition-colors" onclick="quickPriceDrop('${item.id}')">
          -$5 Drop
        </button>
        <button type="button" class="h-8 px-2.5 rounded-lg bg-surface-container text-error text-xs font-bold hover:bg-surface-container-high transition-colors" onclick="deleteSellerItem('${item.id}')">
          Remove
        </button>
      </div>
    </div>
  `).join("");
}

async function quickPriceDrop(id) {
  const item = state.listings.find(l => l.id === id);
  if (!item || item.price <= 5) return;

  const oldPrice = item.price;
  item.price = Math.max(1, item.price - 5);

  try {
    await window.campusApi.updateListing(id, {
      title: item.title,
      description: item.description,
      category: item.category,
      price: item.price,
      price_unit: item.price_unit,
      pickup_location: item.pickup_location,
      quantity: item.quantity
    });
  } catch (e) {
    // Offline / not signed in → keep optimistic local price
    console.warn("Price drop synced locally only:", e.message);
  }

  renderSellerStudio();
  renderAllListingGrids();
  renderDynamicUI();
  showToast(`Price dropped ${fmtMoneyShort(oldPrice)} → ${fmtMoneyShort(item.price)} to boost campus visibility! ⚡`);
}

async function deleteSellerItem(id) {
  if (confirm("Remove this listing from campus marketplace?")) {
    try {
      await window.campusApi.deleteListing(id);
    } catch (e) {}
    state.listings = state.listings.filter(l => l.id !== id);
    renderSellerStudio();
    renderAllListingGrids();
    renderDynamicUI();
    showToast("Listing removed successfully");
  }
}

// ============================================================================
// OFFERS VIEW (contextual rendering from live listing state)
// ============================================================================
const OFFER_PERSONAS = [
  {
    suffix: "top", buyerName: "Chloe Zhang", buyerMajor: "Cognitive Science '26", buyerRating: 4.9,
    buyerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNYiVbFPMLFn3bhkaaOoWDcJwJuAwCZemgktsTo-z5Y-wcLLNMsEPZY1IhyAq3TbqL4IF3cDT6ESqlXkoavtlQTsrYiePK-IptMSWZZ_ba7I12TNnZurNR1TQnfl5t202i0fjdannsGkU_f7aqdMdoQCNSCW3g4uOALByeBoYi4N0r5EyknOFdWRdBXtJ9lCXGwccRMQzOCJIxiR9zhoAlcuRPmbYs6Mro4qtgkjk",
    kind: "top", expires: "Auto-expires in 2h 45m",
    message: "Hi! Can meet today at 4:30 PM at the campus library front entrance. Have cash or Venmo ready!"
  },
  {
    suffix: "counter", buyerName: "Marcus Vance", buyerMajor: "Economics '25", buyerRating: 4.8,
    buyerAvatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuQi1ZABRLQVM-9Kh1xfE_1Szwlnkc3DE2_uSWVTbOMMVdLRERvcjL_FQ3k7piRckukcrPtmElsHTSN1g3fZGqoyYIqEYdhuRh65bqx5rRx3_jWuXiIiVD3tA8bnzWgNI8akdqNhtwYfXHbX-Vi6Q2t8eTuRFyeODKVIHOw_Yu6qc988VVtiwUyBAFQ6DRgi3dVqenhcTyLGTZN4TG4xXonu5UBxg5oqsj4Rv2Fs4",
    kind: "counter", expires: "Counter offer",
    message: "Can grab it right now at the dorm courtyard if you can do it for a bit less."
  }
];

function findListingById(id) {
  if (!id) return null;
  return state.listings.find(l => l.id === id)
    || (window.SEED_LISTINGS || []).find(l => l.id === id)
    || null;
}

function getOfferListing() {
  return findListingById(state.selectedListing?.id)
    || findListingById(state.chatListing?.id)
    || (window.SEED_LISTINGS || []).find(l => l.title.startsWith("Calculus"))
    || state.listings[0]
    || null;
}

function bindOffersToListing(listing) {
  if (!listing) return;
  if (state.offers.length > 0 && state.offers[0].listingId === listing.id) return;

  const ask = Number(listing.price) || 40;
  state.offers = OFFER_PERSONAS.map((p, i) => ({
    id: `offer-${listing.id}-${p.suffix}`,
    listingId: listing.id,
    amount: i === 0 ? ask : Math.max(1, Math.round((ask - 4) * 100) / 100),
    active: true,
    ...p
  }));
}

function renderOffersView() {
  const badge = document.getElementById("offers-count-badge");
  const pinned = document.getElementById("offers-pinned-listing");
  const list = document.getElementById("offers-list");
  if (!pinned || !list) return;

  const listing = getOfferListing();
  bindOffersToListing(listing);
  const offers = activeOffers().filter(o => !listing || o.listingId === listing.id);

  if (badge) badge.textContent = `${offers.length} Active`;

  if (!listing) {
    pinned.innerHTML = `<p class="text-xs text-on-surface-variant">No listing selected for offers.</p>`;
    list.innerHTML = "";
    return;
  }

  const ask = Number(listing.price) || 0;
  const photo = (listing.images && listing.images[0]) || "";
  const shortCat = String(listing.category || "").split(" ")[0].toUpperCase();

  pinned.innerHTML = `
    <div class="relative w-16 h-20 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
      ${photo ? `<img src="${photo}" alt="${listing.title}" class="w-full h-full object-cover"/>` : `<span class="material-symbols-outlined text-3xl text-outline w-full h-full flex items-center justify-center">image</span>`}
      <span class="absolute top-1 left-1 bg-primary text-on-primary text-[9px] font-bold px-1 rounded">${escapeHTML(shortCat)}</span>
    </div>
    <div class="flex flex-col min-w-0 flex-1">
      <div class="flex items-center gap-1.5">
        <span class="px-2 py-0.5 rounded-full bg-campus-emerald-light text-campus-emerald-dark text-[10px] font-bold">● Live & Re-listed</span>
        ${offers.length > 1 ? `<span class="px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary text-[10px] font-bold">⚡ High Demand</span>` : ""}
      </div>
      <h3 class="font-bold text-sm text-on-surface truncate mt-1">${escapeHTML(listing.title)}</h3>
      <p class="text-xs text-on-surface-variant truncate">${escapeHTML(listing.category)} • ${escapeHTML(listing.pickup_location)}</p>
      <div class="flex items-baseline gap-2 mt-0.5">
        <span class="text-base font-extrabold text-primary">${fmtMoney(listing.price)}</span>
        ${listing.original_price ? `<span class="text-xs text-outline line-through">MSRP ${fmtMoneyShort(listing.original_price)}</span>` : ""}
      </div>
    </div>
  `;

  if (offers.length === 0) {
    list.innerHTML = `
      <div class="py-8 text-center bg-surface-container-lowest rounded-2xl border border-border-subtle">
        <span class="material-symbols-outlined text-3xl text-outline mb-1">local_offer</span>
        <p class="text-sm font-bold text-on-surface">No active offers</p>
        <p class="text-xs text-on-surface-variant mt-0.5">Share your listing to attract campus buyers.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = offers.map(o => {
    const pct = ask > 0 ? Math.round((o.amount / ask) * 100) : 100;
    const isTop = o.kind === "top";
    const atAsking = o.amount >= ask;
    return `
      <div class="rounded-2xl bg-surface-container-lowest p-4 shadow-sm ${isTop ? "border border-secondary/30 relative" : "border border-border-subtle"}">
        ${isTop ? `
          <div class="flex items-center justify-between mb-2.5">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-electric-indigo-light text-primary text-xs font-bold">★ TOP STUDENT OFFER</span>
            <span class="text-xs font-semibold text-outline">${escapeHTML(o.expires)}</span>
          </div>` : ""}
        <div class="flex items-start justify-between gap-3 mb-3 ${isTop ? "" : "pt-1"}">
          <div class="flex items-center gap-3">
            <img src="${o.buyerAvatar}" alt="${o.buyerName}" class="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"/>
            <div>
              <p class="font-bold text-sm text-on-surface">${escapeHTML(o.buyerName)}</p>
              <p class="text-xs text-on-surface-variant">${escapeHTML(o.buyerMajor)} • ${o.buyerRating} ★</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-xl font-extrabold ${atAsking ? "text-secondary" : "text-primary"}">${fmtMoney(o.amount)}</span>
            <span class="text-[10px] font-bold block ${atAsking ? "text-secondary" : "text-outline"}">${atAsking ? "100% of Asking" : `${pct}% of Asking`}</span>
          </div>
        </div>
        <p class="text-xs text-on-surface bg-surface-container-low p-2.5 rounded-xl mb-3">“${escapeHTML(o.message)}”</p>
        <div class="flex items-center gap-2">
          <button type="button" class="flex-1 h-11 rounded-xl ${atAsking ? "bg-secondary text-on-secondary" : "bg-surface-container text-primary"} font-bold text-xs shadow-xs hover:opacity-90 transition-colors" onclick="acceptOffer('${o.id}')">
            ${atAsking ? `Accept & Lock Escrow (${fmtMoneyShort(o.amount)})` : `Accept Counter (${fmtMoneyShort(o.amount)})`}
          </button>
          <button type="button" class="h-11 px-3.5 rounded-xl bg-surface-container text-on-surface-variant font-bold text-xs hover:bg-surface-container-high transition-colors" onclick="openOfferChat('${o.id}')">
            Chat
          </button>
          <button type="button" class="h-11 px-3.5 rounded-xl bg-surface-container text-error font-bold text-xs hover:bg-surface-container-high transition-colors" onclick="declineOffer('${o.id}')">
            Decline
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function declineOffer(offerId) {
  const offer = state.offers.find(o => o.id === offerId);
  if (offer) offer.active = false;
  renderOffersView();
  renderNavBadges();
  showToast("Offer declined");
}

// ============================================================================
// DEAL LIFECYCLE — listing + offer → escrow deal → PIN → settlement
// ============================================================================
function createDealFromListing(listing, buyerName, amount) {
  const user = window.campusApi.user;
  const deal = {
    txId: generateTxId(),
    date: new Date().toISOString(),
    itemTitle: listing?.title || "Campus marketplace item",
    category: listing?.category || "Electronics",
    buyerName: buyerName || "Campus Buyer",
    buyerEmail: `${String(buyerName || "buyer").split(" ")[0].toLowerCase()}@berkeley.edu`,
    sellerName: user?.full_name || listing?.seller_name || "Alex Chen",
    sellerEmail: user?.email || "alex.chen@berkeley.edu",
    amount: Number(amount) || Number(listing?.price) || 0,
    qty: listing?.quantity || 1,
    location: listing?.pickup_location || "Campus Safe Zone",
    pin: generatePin(),
    status: "escrow"
  };
  state.currentDeal = deal;
  state.currentDealListing = listing || null;
  return deal;
}

function activeDeal() {
  return state.lastSettledDeal || state.currentDeal || state.deals[0] || null;
}

function acceptOffer(offerId) {
  const offer = state.offers.find(o => o.id === offerId);
  if (!offer) return;

  const listing = findListingById(offer.listingId);
  offer.active = false;

  createDealFromListing(listing, offer.buyerName, offer.amount);
  pushNotification("primary", "★", `Offer accepted from ${offer.buyerName}`, `${fmtMoney(offer.amount)} escrow locked for ${listing?.title || "your item"}.`, "Just now");
  renderDynamicUI();

  showToast(`Offer accepted for ${fmtMoney(offer.amount)}! Locking escrow...`);
  setTimeout(() => navigateTo("handover-pin"), 600);
}

function lockDealHandover() {
  const listing = state.selectedListing || state.chatListing || getOfferListing();
  const listingChanged = listing && (!state.currentDealListing || state.currentDealListing.id !== listing.id);
  if (!state.currentDeal || listingChanged) {
    const bestOffer = activeOffers().find(o => !listing || o.listingId === listing.id);
    createDealFromListing(listing, bestOffer?.buyerName, bestOffer?.amount || listing?.price);
  }
  renderDynamicUI();
  showToast("Escrow deposit locked! Generating safe handover code...");
  setTimeout(() => navigateTo("handover-pin"), 500);
}

function openMakeOfferModal() {
  const listing = state.selectedListing || getOfferListing();
  if (!listing) {
    showToast("Select a listing first");
    return;
  }
  state.chatListing = listing;
  navigateTo("offers");
  showToast(`Make an offer on: ${listing.title}`);
}

function openChatWithContext() {
  if (state.selectedListing) state.chatListing = state.selectedListing;
  navigateTo("chat");
}

function openOfferChat(offerId) {
  const offer = state.offers.find(o => o.id === offerId);
  if (!offer) return;
  state.chatListing = findListingById(offer.listingId);
  state.chatPeer = { name: offer.buyerName, meta: `${offer.buyerMajor} • Active Now` };
  navigateTo("chat");
}

function sendChatMessage() {
  const input = document.getElementById("chat-text-input");
  const text = input?.value.trim();
  if (!text) return;

  const container = document.getElementById("chat-messages-container");
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Append user bubble
  const userMsg = document.createElement("div");
  userMsg.className = "flex items-end gap-2 max-w-[85%] ml-auto justify-end";
  userMsg.innerHTML = `
    <div class="bg-primary text-on-primary p-3 rounded-2xl rounded-br-sm text-sm shadow-xs">
      ${escapeHTML(text)}
      <span class="block text-[10px] text-on-primary/70 mt-1 text-right">${timeStr} • Sent</span>
    </div>
  `;
  container.appendChild(userMsg);
  input.value = "";
  container.scrollTop = container.scrollHeight;

  // Simulated peer reply after short delay
  const peer = state.chatPeer || { name: "Sarah Miller" };
  const peerInitials = initialsOf(peer.name);
  setTimeout(() => {
    const reply = document.createElement("div");
    reply.className = "flex items-end gap-2 max-w-[85%] self-start";
    reply.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">${peerInitials}</div>
      <div class="bg-surface-container-lowest p-3 rounded-2xl rounded-bl-sm text-sm text-on-surface shadow-xs border border-border-subtle">
        Sounds great! I'll be at the campus safe zone entrance by the benches. See you there! 🤝
        <span class="block text-[10px] text-outline mt-1 text-right">${timeStr}</span>
      </div>
    `;
    container.appendChild(reply);
    container.scrollTop = container.scrollHeight;
  }, 900);
}

function sendQuickChatMessage(msg) {
  const input = document.getElementById("chat-text-input");
  if (input) {
    input.value = msg;
    sendChatMessage();
  }
}

// Chat view context (peer header + pinned item snapshot)
function renderChatContext() {
  const listing = state.chatListing || state.selectedListing || getOfferListing();

  if (listing) {
    const peer = state.chatPeer || {
      name: listing.seller_name || "Sarah Miller",
      meta: `${listing.seller_campus || state.activeCampus} • Active Now`
    };
    setText("chat-peer-name", peer.name);
    setText("chat-peer-campus", peer.meta || "Active Now");
    setText("chat-peer-initials", initialsOf(peer.name));

    setText("chat-pinned-title", listing.title);
    setText("chat-pinned-price", fmtMoney(listing.price));
    const origEl = document.getElementById("chat-pinned-orig");
    if (origEl) {
      if (listing.original_price) {
        origEl.textContent = `${fmtMoneyShort(listing.original_price)} original`;
        origEl.classList.remove("hidden");
      } else {
        origEl.classList.add("hidden");
      }
    }
    const imgEl = document.getElementById("chat-pinned-img");
    if (imgEl && listing.images && listing.images[0]) imgEl.src = listing.images[0];
  }
}

function copyHandoverPin() {
  const pin = state.currentDeal?.pin || activeDeal()?.pin || generatePin();
  if (navigator.clipboard) {
    navigator.clipboard.writeText(pin);
    showToast(`Handover PIN (${pin}) copied to clipboard! 📋`);
  } else {
    showToast("PIN is: " + pin);
  }
}

// ============================================================================
// HANDOVER PIN, REVIEW & PAYOUT (rendered from deal state)
// ============================================================================
function renderHandoverView() {
  const deal = state.currentDeal || activeDeal();
  if (!deal) return;

  setText("handover-tx-id", `#${deal.txId}`);
  setText("handover-buyer-name", deal.buyerName);
  setText("handover-amount", fmtMoney(deal.amount));

  const grid = document.getElementById("handover-pin-grid");
  const pin = String(deal.pin || "0000").padStart(4, "0");
  if (grid) {
    grid.innerHTML = pin.split("").map(d => `
      <div class="aspect-square rounded-xl bg-surface-container flex items-center justify-center text-3xl font-extrabold text-primary shadow-inner">${d}</div>
    `).join("");
  }
  setText("handover-pin-copy", `Copy PIN (${pin})`);
  setText("review-rating-label", `Rate ${deal.buyerName}'s student reputation`);
}

// ============================================================================
// HANDOVER CONFIRMATION & REVIEW MODAL
// ============================================================================
function openHandoverReviewModal() {
  document.getElementById("modal-review")?.classList.remove("hidden");
}
function closeReviewModal() {
  document.getElementById("modal-review")?.classList.add("hidden");
}

function submitHandoverReview() {
  closeReviewModal();

  const deal = state.currentDeal;
  if (deal) {
    const settled = { ...deal, status: "settled", date: new Date().toISOString() };
    state.deals.unshift(settled);
    state.lastSettledDeal = settled;
    state.currentDeal = null;
    pushNotification("secondary", "✓", `Deal settled: ${settled.itemTitle}`, `${fmtMoney(settled.amount)} released with $0 platform fees.`, "Just now");
    renderDynamicUI();
    renderSellerStudio();
  }

  showToast("Review submitted & Verified! Releasing escrow...");
  setTimeout(() => {
    setText("payout-amount-text", fmtMoney(state.lastSettledDeal?.amount || 0));
    document.getElementById("modal-payout-settled")?.classList.remove("hidden");
  }, 400);
}

function closePayoutModal() {
  document.getElementById("modal-payout-settled")?.classList.add("hidden");
}

// ============================================================================
// RECEIPT, PDF & CSV EXPORTS (all derived from deal state)
// ============================================================================
function renderReceiptView() {
  const deal = activeDeal();
  if (!deal) return;

  setText("receipt-tx-id", `#${deal.txId}`);
  setText("receipt-item", deal.itemTitle);
  setText("receipt-location", deal.location);
  setText("receipt-buyer", `${deal.buyerName} (${deal.buyerEmail || "berkeley.edu"})`);
  setText("receipt-seller", `${deal.sellerName} (${deal.sellerEmail || "berkeley.edu"})`);
  setText("receipt-price", fmtMoney(deal.amount));
  setText("receipt-total", fmtMoney(deal.amount));
}

function renderPdfModal() {
  const deal = activeDeal();
  if (!deal) return;

  setText("pdf-modal-title", `#${deal.txId}`);
  setText("pdf-tx-id", `#${deal.txId}`);
  setText("pdf-buyer-name", deal.buyerName);
  setText("pdf-buyer-email", deal.buyerEmail || "—");
  setText("pdf-seller-name", deal.sellerName);
  setText("pdf-seller-email", deal.sellerEmail || "—");
  setText("pdf-item", deal.itemTitle);
  setText("pdf-qty", String(deal.qty || 1));
  setText("pdf-amount", fmtMoney(deal.amount));
  setText("pdf-total", fmtMoney(deal.amount));
}

function renderCsvModal() {
  const { total, count } = dealTotals();
  const year = new Date().getFullYear();
  setText("csv-modal-title", `${year} Sales & Tax Ledger Export`);
  setText("csv-gross-label", `Gross Sales (${count} Deal${count === 1 ? "" : "s"}):`);
  setText("csv-gross-amount", fmtMoney(total));
}

// ============================================================================
// PDF & CSV EXPORT ENGINES
// ============================================================================
function openPdfPreviewModal() {
  document.getElementById("modal-pdf-preview")?.classList.remove("hidden");
}
function closePdfModal() {
  document.getElementById("modal-pdf-preview")?.classList.add("hidden");
}

function openCsvExportModal() {
  document.getElementById("modal-csv-export")?.classList.remove("hidden");
}
function closeCsvModal() {
  document.getElementById("modal-csv-export")?.classList.add("hidden");
}

function downloadActualCsvFile() {
  const header = "Transaction ID,Date,Item Title,Category,Buyer Name,Seller Name,Amount (USD),Fee (USD),Status,Handover Zone";
  const rows = state.deals.map(d => [
    d.txId,
    new Date(d.date).toISOString().slice(0, 10),
    `"${String(d.itemTitle).replace(/"/g, '""')}"`,
    d.category,
    d.buyerName,
    d.sellerName,
    Number(d.amount).toFixed(2),
    "0.00",
    d.status === "settled" ? "Settled" : "In Escrow",
    `"${String(d.location).replace(/"/g, '""')}"`
  ].join(","));
  const csvContent = [header, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Campus_Hustle_Tax_Ledger_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast(`Spreadsheet downloaded: ${state.deals.length} deals exported 📊`);
  closeCsvModal();
}

// ============================================================================
// DISPUTE RESOLUTION
// ============================================================================
function submitDispute() {
  const category = document.getElementById("dispute-category")?.value || "General issue";
  const details = document.getElementById("dispute-desc")?.value.trim();

  if (!details) {
    showToast("Please describe what happened first");
    return;
  }

  pushNotification("primary", "⚖", `Dispute filed: ${category}`, "Submitted to the Student Honor Board for peer mediation.", "Just now");
  showToast("Dispute submitted to Cal Student Honor Board for mediation");
  navigateTo("home");
}

// ============================================================================
// FILTER MODAL & CATEGORY PILLS
// ============================================================================
function openFiltersModal() {
  document.getElementById("modal-filters")?.classList.remove("hidden");
}
function closeFiltersModal() {
  document.getElementById("modal-filters")?.classList.add("hidden");
}

function applyFilters() {
  const range = document.getElementById("filter-price-range");
  if (range) state.maxPrice = parseFloat(range.value);
  const verifiedToggle = document.getElementById("filter-verified-only");
  if (verifiedToggle) state.verifiedOnly = verifiedToggle.checked;
  renderAllListingGrids();
  renderFilterBadges();
  showToast(`Filters applied: Max $${state.maxPrice}${state.verifiedOnly ? " • Verified only" : ""}`);
}

function resetFilters() {
  state.activeCategory = "all";
  state.searchQuery = "";
  state.maxPrice = 600;
  state.verifiedOnly = false;
  state.sortBy = "newest";

  const s1 = document.getElementById("home-search-input");
  const s2 = document.getElementById("explore-search-input");
  if (s1) s1.value = "";
  if (s2) s2.value = "";

  const range = document.getElementById("filter-price-range");
  if (range) range.value = "600";
  const display = document.getElementById("filter-price-display");
  if (display) display.textContent = "$600";
  const verifiedToggle = document.getElementById("filter-verified-only");
  if (verifiedToggle) verifiedToggle.checked = false;

  document.querySelectorAll(".cat-pill, .exp-cat").forEach(p => {
    const isAll = p.dataset.cat === "all";
    p.classList.toggle("active", isAll);
    p.classList.toggle("bg-primary", isAll);
    p.classList.toggle("text-on-primary", isAll);
  });

  renderAllListingGrids();
  renderFilterBadges();
  showToast("All filters reset");
}

function removeFilter(type) {
  if (type === "price") state.maxPrice = 600;
  if (type === "verified") state.verifiedOnly = false;
  if (type === "search") {
    state.searchQuery = "";
    const s1 = document.getElementById("home-search-input");
    const s2 = document.getElementById("explore-search-input");
    const c1 = document.getElementById("home-search-clear");
    const c2 = document.getElementById("explore-clear-search");
    if (s1) s1.value = "";
    if (s2) s2.value = "";
    if (c1) c1.classList.add("hidden");
    if (c2) c2.classList.add("hidden");
  }
  if (type === "category") {
    state.activeCategory = "all";
    document.querySelectorAll(".cat-pill, .exp-cat").forEach(p => {
      const isAll = p.dataset.cat === "all";
      p.classList.toggle("active", isAll);
      p.classList.toggle("bg-primary", isAll);
      p.classList.toggle("text-on-primary", isAll);
    });
  }
  renderAllListingGrids();
  renderFilterBadges();
}

// Active filter chips + counters rendered from state
function renderFilterBadges() {
  const chips = [];
  if (state.verifiedOnly) chips.push({ key: "verified", label: "Verified Students Only", cls: "bg-primary-fixed text-on-primary-fixed-variant", hover: "hover:text-primary" });
  if (state.maxPrice < 600) chips.push({ key: "price", label: `Max: $${state.maxPrice}`, cls: "bg-secondary-container text-on-secondary-container", hover: "hover:text-secondary" });
  if (state.activeCategory && state.activeCategory !== "all") chips.push({ key: "category", label: state.activeCategory, cls: "bg-electric-indigo-light text-primary", hover: "hover:text-primary" });
  if (state.searchQuery) chips.push({ key: "search", label: `“${state.searchQuery}”`, cls: "bg-surface-container-high text-on-surface-variant", hover: "hover:text-primary" });

  const count = chips.length;
  ["active-filter-count", "explore-filter-count"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = count;
    el.classList.toggle("hidden", count === 0);
  });

  const bar = document.getElementById("active-filters-bar");
  if (!bar) return;

  if (count === 0) {
    bar.innerHTML = `<span class="text-xs text-on-surface-variant px-1.5 font-semibold">No active filters</span>`;
    return;
  }

  bar.innerHTML = chips.map(chip => `
    <div class="flex items-center gap-1 px-2.5 py-1 rounded-full ${chip.cls} text-xs font-semibold">
      <span>${escapeHTML(chip.label)}</span>
      <button type="button" class="${chip.hover} flex items-center ml-0.5" onclick="removeFilter('${chip.key}')">
        <span class="material-symbols-outlined text-xs">close</span>
      </button>
    </div>
  `).join("") + `
    <button type="button" class="text-on-surface-variant hover:text-primary text-xs underline px-1.5 font-semibold" onclick="resetFilters()">
      Reset all
    </button>
  `;
}

// ============================================================================
// NOTIFICATIONS & CAMPUS SELECT MODALS
// ============================================================================
function pushNotification(tone, icon, title, body, time) {
  state.notifications.unshift({
    id: `n-${Date.now()}`,
    tone: tone || "primary",
    icon: icon || "•",
    title,
    body,
    time: time || "Just now",
    read: false
  });
  renderNotifications();
  renderNavBadges();
}

function renderNotifications() {
  const list = document.getElementById("notifications-list");
  if (list) {
    if (state.notifications.length === 0) {
      list.innerHTML = `<p class="text-xs text-on-surface-variant text-center py-6">You're all caught up! 🎓</p>`;
    } else {
      list.innerHTML = state.notifications.map(n => `
        <div class="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5 ${n.read ? "opacity-70" : ""}">
          <span class="w-7 h-7 rounded-full bg-${n.tone === "secondary" ? "secondary text-on-secondary" : "primary text-on-primary"} flex items-center justify-center text-xs flex-shrink-0 mt-0.5">${escapeHTML(n.icon)}</span>
          <div>
            <p class="text-xs font-bold text-on-surface">${escapeHTML(n.title)}</p>
            <p class="text-[11px] text-on-surface-variant">${escapeHTML(n.body)}</p>
            <span class="text-[10px] text-outline">${escapeHTML(n.time)}</span>
          </div>
        </div>
      `).join("");
    }
  }

  const badge = document.getElementById("notification-badge");
  const hasUnread = state.notifications.some(n => !n.read);
  if (badge) badge.classList.toggle("hidden", !hasUnread);
}

function openNotificationsModal() {
  document.getElementById("modal-notifications")?.classList.remove("hidden");
  state.notifications.forEach(n => { n.read = true; });
  renderNotifications();
}
function closeNotificationsModal() {
  document.getElementById("modal-notifications")?.classList.add("hidden");
}

function openCampusModal() {
  document.getElementById("modal-campus-select")?.classList.remove("hidden");
}
function closeCampusModal() {
  document.getElementById("modal-campus-select")?.classList.add("hidden");
}

function setCampus(campusName) {
  state.activeCampus = campusName;
  try { localStorage.setItem(STORAGE_KEYS.campus, campusName); } catch (e) {}
  renderFeedStats();
  closeCampusModal();
  showToast(`Switched active hub to ${campusName}`);
}

// ============================================================================
// TOAST NOTIFICATIONS & HELPERS
// ============================================================================
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast-msg bg-inverse-surface text-inverse-on-surface px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold transition-all";
  toast.innerHTML = `
    <span class="material-symbols-outlined text-secondary-fixed text-base">verified</span>
    <span>${escapeHTML(message)}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

function bindGlobalEvents() {
  // Category pill handlers
  document.querySelectorAll(".cat-pill, .exp-cat").forEach(pill => {
    pill.addEventListener("click", () => {
      const cat = pill.dataset.cat;
      state.activeCategory = cat;

      document.querySelectorAll(".cat-pill, .exp-cat").forEach(p => {
        const isSelected = p.dataset.cat === cat;
        p.classList.toggle("active", isSelected);
        if (isSelected) {
          p.classList.add("bg-primary", "text-on-primary");
          p.classList.remove("bg-surface-container-low", "bg-surface-container-lowest", "text-on-surface-variant");
        } else {
          p.classList.remove("bg-primary", "text-on-primary");
          p.classList.add("bg-surface-container-low", "text-on-surface-variant");
        }
      });

      renderAllListingGrids();
      renderFilterBadges();
    });
  });

  // Home search live input
  const homeSearch = document.getElementById("home-search-input");
  const homeClear = document.getElementById("home-search-clear");
  if (homeSearch) {
    homeSearch.addEventListener("input", e => {
      state.searchQuery = e.target.value.trim();
      homeClear.classList.toggle("hidden", !state.searchQuery);
      renderAllListingGrids();
      renderFilterBadges();
    });
    homeClear.addEventListener("click", () => {
      homeSearch.value = "";
      state.searchQuery = "";
      homeClear.classList.add("hidden");
      renderAllListingGrids();
      renderFilterBadges();
    });
  }

  // Explore search live input
  const expSearch = document.getElementById("explore-search-input");
  const expClear = document.getElementById("explore-clear-search");
  if (expSearch) {
    expSearch.addEventListener("input", e => {
      state.searchQuery = e.target.value.trim();
      expClear.classList.toggle("hidden", !state.searchQuery);
      renderAllListingGrids();
      renderFilterBadges();
    });
    expClear.addEventListener("click", () => {
      expSearch.value = "";
      state.searchQuery = "";
      expClear.classList.add("hidden");
      renderAllListingGrids();
      renderFilterBadges();
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", e => {
      state.sortBy = e.target.value;
      renderAllListingGrids();
    });
  }

  // Notifications trigger
  document.getElementById("notifications-btn")?.addEventListener("click", openNotificationsModal);

  // Campus trigger
  document.getElementById("campus-picker-btn")?.addEventListener("click", openCampusModal);

  // Close modals on Escape key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeFiltersModal();
      closeReviewModal();
      closePayoutModal();
      closePdfModal();
      closeCsvModal();
      closeNotificationsModal();
      closeCampusModal();
    }
  });
}
