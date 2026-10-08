/**
 * Campus Hustle - API Client & Backend Integration Layer
 * Connects directly to FastAPI backend on Render: https://campus-cdti.onrender.com/
 * Automatically handles JWT access/refresh tokens, CORS fallbacks, and Vercel rewrites.
 */

// Primary backend endpoint provided by the user
const REMOTE_BACKEND_URL = "https://campus-cdti.onrender.com";

// Determine API base url:
// When deployed on Vercel with rewrites, '/api/v1' acts as same-origin proxy (0 CORS issues).
// In local development or direct access, uses REMOTE_BACKEND_URL + '/api/v1'.
const API_BASE = (window.location.hostname.includes("vercel.app") || window.location.port === "3000")
  ? "/api/v1"
  : `${REMOTE_BACKEND_URL}/api/v1`;

const HEALTH_URL = (window.location.hostname.includes("vercel.app") || window.location.port === "3000")
  ? "/health"
  : `${REMOTE_BACKEND_URL}/health`;

// Storage keys
const TOKEN_KEY = "campus_hustle_access_token";
const REFRESH_KEY = "campus_hustle_refresh_token";
const USER_KEY = "campus_hustle_user";

// Seed/Curated Campus Listings matching UI/UX pictures
const SEED_LISTINGS = [
  {
    id: "d4be1705-4b73-4313-8445-191dde1e17f1",
    seller_id: "ed4a118e-4fcd-4c67-b0d3-3c14ec7658ed",
    title: "Sony WH-1000XM4 Wireless Noise-Canceling Headphones",
    description: "Matte black wireless noise-canceling headphones in pristine condition. Includes case, USB-C cable and 3.5mm jack. Excellent battery health.",
    category: "Electronics",
    price: 140.00,
    price_unit: "/item",
    original_price: 249.00,
    pickup_location: "Moffitt Library 3rd Floor Safe Zone",
    status: "active",
    quantity: 1,
    verified_seller: true,
    condition: "Inspected • Excellent",
    seller_name: "Alex Chen",
    seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuQi1ZABRLQVM-9Kh1xfE_1Szwlnkc3DE2_uSWVTbOMMVdLRERvcjL_FQ3k7piRckukcrPtmElsHTSN1g3fZGqoyYIqEYdhuRh65bqx5rRx3_jWuXiIiVD3tA8bnzWgNI8akdqNhtwYfXHbX-Vi6Q2t8eTuRFyeODKVIHOw_Yu6qc988VVtiwUyBAFQ6DRgi3dVqenhcTyLGTZN4TG4xXonu5UBxg5oqsj4Rv2Fs4",
    seller_rating: 4.9,
    seller_deals: 19,
    seller_campus: "UC Berkeley '25",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCH9J_nhk_6YInUuaOuZk7oBn551ty6kpkII0M8cDGaWXuM7OIPXQLNtd4pwaQ30I5fNebvV53Fi7yYabmGU7Rkz1OOf1EYwenZ-lqV_Wc0McYSEv9kxUgHE4cleDM5OvYPFTXA0UofI0FlAyufxmQYSzYDsfqEA8zkrHg7Y7QFdFxyaihVRR2xsxLX_NdoFcdxeTSMP0-9iJNjfBaMhtYHZQRr5C-vcELnPpw40l4",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC2IvhFVQn-G7IgtPxgeFcSnoOexVK1fPi85ec3cvKm4IgnW3D1r5Wq0VniS_qH6s7gpNmvKAUwKLtXioCfdI4AnAsCJuEiWvxJC7EKbAkI1WpdkyD_uDt7tFmV8ABXQH7W-8b231fQHxvU7JtRbySnzSOsGmOqUNmbwW2jRG2dmnlVlAq94MG5ZlfLQnYCDLXEPtdKtGtjhoAYl9c4H-PVrmaMN1oHkCJDcENwVgE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAi3I9UDJicsLkxPUtGYp9mecjFrmlk9WzCIluCrqeT4K2M2kAw_M4r0B2AQHXXXjUaS0ERMseNfJiAJUDg4aB7wwJMAF2Tm9b1mXG3c7wL9FACIs0akzzw6hW39ArgNs6nM2xQ5GHAxB_oGot3DAiAi77gcv0NcRRAQZy2QFYIcy57SCah9-A1qwnps9ZASXKWDZECoQJsSS2gkd9z1hDOkhdQaGxtqUCI-rbjTj0"
    ],
    time_ago: "2 hours ago",
    distance: "0.3 miles"
  },
  {
    id: "f812a344-9911-4cd2-8bb1-e1248c849201",
    seller_id: "c812a344-9911-4cd2-8bb1-e1248c849202",
    title: "Calculus: Early Transcendentals (Stewart 9th Edition)",
    description: "Required for Math 1A/1B and Math 53. Pristine hardcover, zero highlighted or torn pages. Saved me $140 compared to student bookstore.",
    category: "Books",
    price: 40.00,
    price_unit: "/item",
    original_price: 184.00,
    pickup_location: "Moffitt Library Front Entrance",
    status: "active",
    quantity: 1,
    verified_seller: true,
    condition: "Like New • Crisp",
    seller_name: "Sarah Miller",
    seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNYiVbFPMLFn3bhkaaOoWDcJwJuAwCZemgktsTo-z5Y-wcLLNMsEPZY1IhyAq3TbqL4IF3cDT6ESqlXkoavtlQTsrYiePK-IptMSWZZ_ba7I12TNnZurNR1TQnfl5t202i0fjdannsGkU_f7aqdMdoQCNSCW3g4uOALByeBoYi4N0r5EyknOFdWRdBXtJ9lCXGwccRMQzOCJIxiR9zhoAlcuRPmbYs6Mro4qtgkjk",
    seller_rating: 4.95,
    seller_deals: 14,
    seller_campus: "UC Berkeley '26",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCt3l8YGxD6PfYwNlgcOxWxTFzel78BbX-Wh49HftRdpnlSt63bGFDDUIcaqDeXiupF0UUOy0oFxJQwfL-Q1S50tqGLDujQq0hALyO9Vr3OUzMNHyX4GTd6RiR-E80eo46jin5CSGBOn9Lq99X4psMzMhJGBtbC9ur03POKzNNgClfLaE2V1fC7KYiVHS_1bVW0ZChm9l7kN1tZGq0aGIf44GuP7PcOqATWIcEhc8I",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB5fdEpQMlfdiz8wl1oVwb5tgNXns8Na__KimQ6zht5A6dqpKffnIltM3EAsVzWXQ92FkrPAv0TGc2Pq4dZ1fqPPY1Vhf_RPCqXS-p0kd-CNIvNmNK0Da4JS2abdpR0i3ao4FC6slrmF3mNQEgiVvLSTYpVwLhB8JNIAdVp6aaEYY04Mevct6rlAFjgLJemYpNvDXlQL5ID6HKzqnpStD-LXoiC3qv7grtZRlkwGD0",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAtBiPKTQxJb1p5QAHTQZedngzZ87b2SO1kT9t7JoYWh0jFwqDxNu7Sr9gLej63EfPTeUHlh3Gl6cCboYebfar_oiFIMpgszNhxmrBr7Wa59oi8IhqEKH_AoEgtAEwL4T3ZZ1ydDDzLgqeS8-pK1G7dosfsNpfH-SA0ccaPBAGe0hVrKjfyLoxbCNY3Q4ZbAir5XB52fOZgsX1MB2qJ7rSKDidSILFYbazm63Bpc0M"
    ],
    time_ago: "Just now",
    distance: "0.2 miles"
  },
  {
    id: "a123b456-c789-0123-4567-89abcdef0123",
    seller_id: "ed4a118e-4fcd-4c67-b0d3-3c14ec7658ed",
    title: "TI-84 Plus CE Color Graphing Calculator",
    description: "Sleek TI-84 Plus CE in rose gold / black. Rechargeable battery, cable included. Pre-loaded with essential engineering & math programs.",
    category: "Electronics",
    price: 65.00,
    price_unit: "/item",
    original_price: 139.00,
    pickup_location: "Campus Library Main Entrance",
    status: "active",
    quantity: 1,
    verified_seller: true,
    condition: "Excellent • Works Great",
    seller_name: "Alex Chen",
    seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuQi1ZABRLQVM-9Kh1xfE_1Szwlnkc3DE2_uSWVTbOMMVdLRERvcjL_FQ3k7piRckukcrPtmElsHTSN1g3fZGqoyYIqEYdhuRh65bqx5rRx3_jWuXiIiVD3tA8bnzWgNI8akdqNhtwYfXHbX-Vi6Q2t8eTuRFyeODKVIHOw_Yu6qc988VVtiwUyBAFQ6DRgi3dVqenhcTyLGTZN4TG4xXonu5UBxg5oqsj4Rv2Fs4",
    seller_rating: 4.9,
    seller_deals: 19,
    seller_campus: "UC Berkeley '25",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3WtJjASTuugCYgHxZOGqKfPpqUcvguhWieK5Mvm5tCcbyQ7bKB7kz7szTviyEXkFwIdfZNx1KQ6F4zopOxfeYXE3jj_htHbD5L-DvL91sAnKSD5qhu407HtLDf9uJfOezId41tlx3YLEAMX-cAMSl8epYEspo_nPaSZxaCofubqop7dS3fmSPtLZkN3WpS-ACRq-qNQm5dxrBv1TtDuue_VYClj_JbeLFkssfFAo",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCMvKnsJYJhiv9SlleJx3HbqjeXX-8l69cyTtOJtnLVdBvcfRuhMLj6Zh1ZztBMh57KF_Xre5Y4na8Z6eRCwYOlAXE6mzVZH70wHRP83i8xXiOkAuK4xl-R0SizOarEfyZxjGaPxD-MEBw1F-N_mnSggeBlQTfI1aMng5qgc6bhLYuPoFht7QjXFLStPG2YhDnVNenyes4YfX-FMbHM3yu4F2jSo3SCQnOwq9P2MEk"
    ],
    time_ago: "35m ago",
    distance: "0.1 miles"
  },
  {
    id: "b234c567-d890-1234-5678-9abcdef01234",
    seller_id: "c812a344-9911-4cd2-8bb1-e1248c849202",
    title: "iPad Air 5th Gen (M1, 64GB Space Gray) + Pencil",
    description: "Flawless screen, AppleCare+ active for 4 more months. Comes with Apple Pencil 2nd gen and magnetic paper-feel screen protector. Ideal for note-taking.",
    category: "Electronics",
    price: 360.00,
    price_unit: "/item",
    original_price: 599.00,
    pickup_location: "Student Union Eshleman Hall",
    status: "active",
    quantity: 1,
    verified_seller: true,
    condition: "Mint • Flawless",
    seller_name: "Sarah Miller",
    seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNYiVbFPMLFn3bhkaaOoWDcJwJuAwCZemgktsTo-z5Y-wcLLNMsEPZY1IhyAq3TbqL4IF3cDT6ESqlXkoavtlQTsrYiePK-IptMSWZZ_ba7I12TNnZurNR1TQnfl5t202i0fjdannsGkU_f7aqdMdoQCNSCW3g4uOALByeBoYi4N0r5EyknOFdWRdBXtJ9lCXGwccRMQzOCJIxiR9zhoAlcuRPmbYs6Mro4qtgkjk",
    seller_rating: 4.95,
    seller_deals: 14,
    seller_campus: "UC Berkeley '26",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCH9J_nhk_6YInUuaOuZk7oBn551ty6kpkII0M8cDGaWXuM7OIPXQLNtd4pwaQ30I5fNebvV53Fi7yYabmGU7Rkz1OOf1EYwenZ-lqV_Wc0McYSEv9kxUgHE4cleDM5OvYPFTXA0UofI0FlAyufxmQYSzYDsfqEA8zkrHg7Y7QFdFxyaihVRR2xsxLX_NdoFcdxeTSMP0-9iJNjfBaMhtYHZQRr5C-vcELnPpw40l4"
    ],
    time_ago: "1 hour ago",
    distance: "0.4 miles"
  },
  {
    id: "c345d678-e901-2345-6789-abcdef012345",
    seller_id: "d923a111-8822-4fe1-7cc2-f2359d950311",
    title: "Compact Dorm Mini Fridge (3.2 Cu. Ft. with Freezer)",
    description: "Whisper quiet, energy star certified dorm fridge. Deep cleaned, sanitized, and ready for move-in. Fits perfectly under standard dorm bed risers.",
    category: "Dorm Comfort",
    price: 75.00,
    price_unit: "/item",
    original_price: 189.00,
    pickup_location: "Unit 1 Courtyard Dorms",
    status: "active",
    quantity: 1,
    verified_seller: true,
    condition: "Good • Deep Cleaned",
    seller_name: "Marcus Vance",
    seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuQi1ZABRLQVM-9Kh1xfE_1Szwlnkc3DE2_uSWVTbOMMVdLRERvcjL_FQ3k7piRckukcrPtmElsHTSN1g3fZGqoyYIqEYdhuRh65bqx5rRx3_jWuXiIiVD3tA8bnzWgNI8akdqNhtwYfXHbX-Vi6Q2t8eTuRFyeODKVIHOw_Yu6qc988VVtiwUyBAFQ6DRgi3dVqenhcTyLGTZN4TG4xXonu5UBxg5oqsj4Rv2Fs4",
    seller_rating: 4.8,
    seller_deals: 8,
    seller_campus: "UC Berkeley '25",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC3WtJjASTuugCYgHxZOGqKfPpqUcvguhWieK5Mvm5tCcbyQ7bKB7kz7szTviyEXkFwIdfZNx1KQ6F4zopOxfeYXE3jj_htHbD5L-DvL91sAnKSD5qhu407HtLDf9uJfOezId41tlx3YLEAMX-cAMSl8epYEspo_nPaSZxaCofubqop7dS3fmSPtLZkN3WpS-ACRq-qNQm5dxrBv1TtDuue_VYClj_JbeLFkssfFAo"
    ],
    time_ago: "4 hours ago",
    distance: "0.5 miles"
  },
  {
    id: "d456e789-f012-3456-789a-bcdef0123456",
    seller_id: "e034b222-9933-5ff2-8dd3-03460e061422",
    title: "Trek FX 2 Disc Commuter Bike + U-Lock",
    description: "Smooth 18-speed commuter bicycle tuned up last week at campus bike co-op. Includes heavy-duty Kryptonite U-Lock and front/rear LED lights.",
    category: "Bikes & Wheels",
    price: 180.00,
    price_unit: "/item",
    original_price: 450.00,
    pickup_location: "Sproul Plaza / Sather Gate",
    status: "active",
    quantity: 1,
    verified_seller: true,
    condition: "Good • Freshly Tuned",
    seller_name: "Maya Patel",
    seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNYiVbFPMLFn3bhkaaOoWDcJwJuAwCZemgktsTo-z5Y-wcLLNMsEPZY1IhyAq3TbqL4IF3cDT6ESqlXkoavtlQTsrYiePK-IptMSWZZ_ba7I12TNnZurNR1TQnfl5t202i0fjdannsGkU_f7aqdMdoQCNSCW3g4uOALByeBoYi4N0r5EyknOFdWRdBXtJ9lCXGwccRMQzOCJIxiR9zhoAlcuRPmbYs6Mro4qtgkjk",
    seller_rating: 5.0,
    seller_deals: 12,
    seller_campus: "UC Berkeley '24",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAi3I9UDJicsLkxPUtGYp9mecjFrmlk9WzCIluCrqeT4K2M2kAw_M4r0B2AQHXXXjUaS0ERMseNfJiAJUDg4aB7wwJMAF2Tm9b1mXG3c7wL9FACIs0akzzw6hW39ArgNs6nM2xQ5GHAxB_oGot3DAiAi77gcv0NcRRAQZy2QFYIcy57SCah9-A1qwnps9ZASXKWDZECoQJsSS2gkd9z1hDOkhdQaGxtqUCI-rbjTj0"
    ],
    time_ago: "5 hours ago",
    distance: "0.6 miles"
  }
];

class CampusAPI {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || null;
    this.refreshToken = localStorage.getItem(REFRESH_KEY) || null;
    this.user = this.loadStoredUser();
    this.backendAlive = false;
    this.latencyMs = 0;
  }

  loadStoredUser() {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  }

  setSession(tokens, user = null) {
    if (tokens && tokens.access_token) {
      this.token = tokens.access_token;
      localStorage.setItem(TOKEN_KEY, tokens.access_token);
      if (tokens.refresh_token) {
        this.refreshToken = tokens.refresh_token;
        localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
      }
    }
    if (user) {
      this.user = user;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  clearSession() {
    this.token = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async checkHealth() {
    const start = performance.now();
    try {
      // First try relative endpoint (Vercel rewrite) or direct remote
      const res = await fetch(HEALTH_URL, { method: "GET", headers: { "Accept": "application/json" } });
      if (res.ok) {
        this.backendAlive = true;
        this.latencyMs = Math.round(performance.now() - start);
        return { ok: true, latency: this.latencyMs };
      }
    } catch (err) {
      // If relative failed and not direct, try direct
      if (HEALTH_URL !== `${REMOTE_BACKEND_URL}/health`) {
        try {
          const directRes = await fetch(`${REMOTE_BACKEND_URL}/health`);
          if (directRes.ok) {
            this.backendAlive = true;
            this.latencyMs = Math.round(performance.now() - start);
            return { ok: true, latency: this.latencyMs };
          }
        } catch (e) {}
      }
    }
    this.backendAlive = false;
    return { ok: false, latency: 0 };
  }

  async request(endpoint, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options.headers || {})
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

    try {
      const response = await fetch(url, { ...options, headers });

      // If token expired, attempt refresh
      if (response.status === 401 && this.refreshToken && !endpoint.includes("/auth/")) {
        const refreshed = await this.refreshAuth();
        if (refreshed) {
          headers["Authorization"] = `Bearer ${this.token}`;
          return fetch(url, { ...options, headers });
        }
      }

      return response;
    } catch (networkError) {
      // If fetching through relative proxy fails in local dev, try direct remote URL
      if (!endpoint.startsWith("http") && API_BASE !== `${REMOTE_BACKEND_URL}/api/v1`) {
        try {
          const fallbackUrl = `${REMOTE_BACKEND_URL}/api/v1${endpoint}`;
          return await fetch(fallbackUrl, { ...options, headers });
        } catch (e) {
          throw networkError;
        }
      }
      throw networkError;
    }
  }

  async register(email, password, fullName, campusName) {
    const res = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
        full_name: fullName.trim(),
        campus_name: campusName.trim()
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const msg = errorData.detail || (Array.isArray(errorData.detail) ? errorData.detail[0]?.msg : "Registration failed");
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }

    return await res.json();
  }

  async login(email, password) {
    const res = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password
      })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || "Invalid email or password");
    }

    const tokens = await res.json();
    this.setSession(tokens);

    // Fetch user profile immediately
    try {
      const meUser = await this.getMe();
      this.setSession(tokens, meUser);
      return { tokens, user: meUser };
    } catch (e) {
      const fallbackUser = {
        email: email.trim().toLowerCase(),
        full_name: email.split("@")[0].replace(".", " "),
        campus_name: "UC Berkeley",
        campus_verified: email.endsWith(".edu")
      };
      this.setSession(tokens, fallbackUser);
      return { tokens, user: fallbackUser };
    }
  }

  async refreshAuth() {
    if (!this.refreshToken) return false;
    try {
      const res = await fetch(`${API_BASE}/auth/refresh?refresh_token=${encodeURIComponent(this.refreshToken)}`, {
        method: "POST"
      });
      if (res.ok) {
        const tokens = await res.json();
        this.setSession(tokens);
        return true;
      }
    } catch (e) {}
    this.clearSession();
    return false;
  }

  async logout() {
    if (this.refreshToken) {
      try {
        await this.request(`/auth/logout?refresh_token=${encodeURIComponent(this.refreshToken)}`, {
          method: "POST"
        });
      } catch (e) {}
    }
    this.clearSession();
  }

  async getMe() {
    const res = await this.request("/auth/me");
    if (!res.ok) throw new Error("Failed to retrieve profile");
    const user = await res.json();
    this.user = user;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  async getListings(category = null) {
    let remoteListings = [];
    try {
      const param = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : "";
      const res = await this.request(`/listings${param}`);
      if (res.ok) {
        remoteListings = await res.json();
      }
    } catch (e) {
      console.warn("Using offline / seeded listings fallback:", e.message);
    }

    // Merge remote database listings with verified seeded listings
    // Remote listings appear at the top
    const formattedRemote = remoteListings.map(item => ({
      ...item,
      price: parseFloat(item.price) || 0,
      seller_name: this.user?.full_name || "Verified Student",
      seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNYiVbFPMLFn3bhkaaOoWDcJwJuAwCZemgktsTo-z5Y-wcLLNMsEPZY1IhyAq3TbqL4IF3cDT6ESqlXkoavtlQTsrYiePK-IptMSWZZ_ba7I12TNnZurNR1TQnfl5t202i0fjdannsGkU_f7aqdMdoQCNSCW3g4uOALByeBoYi4N0r5EyknOFdWRdBXtJ9lCXGwccRMQzOCJIxiR9zhoAlcuRPmbYs6Mro4qtgkjk",
      seller_rating: 5.0,
      seller_deals: 1,
      seller_campus: this.user?.campus_name || "UC Berkeley",
      verified_seller: true,
      condition: "Student Verified",
      time_ago: "Just now",
      distance: "0.1 miles",
      images: [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC3WtJjASTuugCYgHxZOGqKfPpqUcvguhWieK5Mvm5tCcbyQ7bKB7kz7szTviyEXkFwIdfZNx1KQ6F4zopOxfeYXE3jj_htHbD5L-DvL91sAnKSD5qhu407HtLDf9uJfOezId41tlx3YLEAMX-cAMSl8epYEspo_nPaSZxaCofubqop7dS3fmSPtLZkN3WpS-ACRq-qNQm5dxrBv1TtDuue_VYClj_JbeLFkssfFAo"
      ]
    }));

    // Filter seed listings if category is specified
    let filteredSeed = SEED_LISTINGS;
    if (category && category !== "all") {
      filteredSeed = SEED_LISTINGS.filter(l => 
        l.category.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(l.category.toLowerCase())
      );
    }

    // Avoid duplicate IDs
    const remoteIds = new Set(formattedRemote.map(r => r.id));
    const combined = [...formattedRemote, ...filteredSeed.filter(s => !remoteIds.has(s.id))];

    return combined;
  }

  async getListing(id) {
    // Check seed first
    const seed = SEED_LISTINGS.find(l => l.id === id);
    try {
      const res = await this.request(`/listings/${id}`);
      if (res.ok) {
        const remote = await res.json();
        return {
          ...seed,
          ...remote,
          price: parseFloat(remote.price) || 0,
          images: seed?.images || [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCH9J_nhk_6YInUuaOuZk7oBn551ty6kpkII0M8cDGaWXuM7OIPXQLNtd4pwaQ30I5fNebvV53Fi7yYabmGU7Rkz1OOf1EYwenZ-lqV_Wc0McYSEv9kxUgHE4cleDM5OvYPFTXA0UofI0FlAyufxmQYSzYDsfqEA8zkrHg7Y7QFdFxyaihVRR2xsxLX_NdoFcdxeTSMP0-9iJNjfBaMhtYHZQRr5C-vcELnPpw40l4"
          ]
        };
      }
    } catch (e) {}

    return seed || null;
  }

  async createListing(listingData) {
    if (!this.token) {
      throw new Error("Please sign in with your student account to publish a listing.");
    }

    const payload = {
      title: listingData.title.trim(),
      description: listingData.description.trim(),
      category: listingData.category.trim(),
      price: parseFloat(listingData.price),
      price_unit: listingData.price_unit || "/item",
      pickup_location: listingData.pickup_location.trim(),
      quantity: parseInt(listingData.quantity) || 1
    };

    const res = await this.request("/listings", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to create listing on backend");
    }

    const created = await res.json();
    return {
      ...created,
      price: parseFloat(created.price),
      seller_name: this.user?.full_name || "You",
      seller_avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuQi1ZABRLQVM-9Kh1xfE_1Szwlnkc3DE2_uSWVTbOMMVdLRERvcjL_FQ3k7piRckukcrPtmElsHTSN1g3fZGqoyYIqEYdhuRh65bqx5rRx3_jWuXiIiVD3tA8bnzWgNI8akdqNhtwYfXHbX-Vi6Q2t8eTuRFyeODKVIHOw_Yu6qc988VVtiwUyBAFQ6DRgi3dVqenhcTyLGTZN4TG4xXonu5UBxg5oqsj4Rv2Fs4",
      seller_rating: 5.0,
      seller_deals: 1,
      seller_campus: this.user?.campus_name || "UC Berkeley",
      verified_seller: true,
      condition: "Inspected • Brand New",
      time_ago: "Just now",
      distance: "0.1 miles",
      images: listingData.images && listingData.images.length > 0 ? listingData.images : [
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC3WtJjASTuugCYgHxZOGqKfPpqUcvguhWieK5Mvm5tCcbyQ7bKB7kz7szTviyEXkFwIdfZNx1KQ6F4zopOxfeYXE3jj_htHbD5L-DvL91sAnKSD5qhu407HtLDf9uJfOezId41tlx3YLEAMX-cAMSl8epYEspo_nPaSZxaCofubqop7dS3fmSPtLZkN3WpS-ACRq-qNQm5dxrBv1TtDuue_VYClj_JbeLFkssfFAo"
      ]
    };
  }

  async deleteListing(listingId) {
    if (!this.token) throw new Error("Not authenticated");
    const res = await this.request(`/listings/${listingId}`, {
      method: "DELETE"
    });
    return res.ok;
  }

  async updateListing(listingId, listingData) {
    if (!this.token) throw new Error("Not authenticated");

    const payload = {
      title: String(listingData.title || "").trim(),
      description: String(listingData.description || "").trim(),
      category: String(listingData.category || "").trim(),
      price: parseFloat(listingData.price),
      price_unit: listingData.price_unit || "/item",
      pickup_location: String(listingData.pickup_location || "").trim(),
      quantity: parseInt(listingData.quantity) || 1
    };

    const res = await this.request(`/listings/${listingId}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update listing");
    }

    const updated = await res.json();
    return { ...updated, price: parseFloat(updated.price) };
  }
}

// Export singleton instance and seed items
window.campusApi = new CampusAPI();
window.SEED_LISTINGS = SEED_LISTINGS;
