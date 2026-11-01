(function () {
  const STORAGE = {
    version: "qw_preview_state_version",
    settings: "qw_preview_settings",
    products: "qw_preview_products",
    models: "qw_preview_models",
    posts: "qw_preview_posts",
    heroSlides: "qw_preview_hero_slides",
    orders: "qw_preview_orders",
    cart: "qw_preview_cart",
    sync: "qw_preview_ig_sync",
    adminSession: "qw_preview_admin_session",
    theme: "qw_preview_theme",
  };



  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function linesFromCaption(text) {
    return String(text || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function titleFromFeedItem(item, index) {
    if (item.title) {
      return item.title;
    }
    if (item.sku) {
      return `Instagram model ${item.sku}`;
    }
    const firstLine = linesFromCaption(item.caption)[0];
    const cleaned = String(firstLine || "").replace(/\s+/g, " ").trim();
    if (!cleaned) {
      return `Instagram model ${index + 1}`;
    }
    return cleaned.length > 46 ? `${cleaned.slice(0, 45)}…` : cleaned;
  }

  function descriptionFromFeedItem(item) {
    const sku = item.sku || linesFromCaption(item.caption)[0] || "Instagram model";
    return `Preuzeto sa Instagram objave ${sku}. Detalje i cenu možeš da dopuniš iz admin panela.`;
  }

  function excerptFromFeedItem(item) {
    const parts = linesFromCaption(item.caption);
    if (!parts.length) {
      return "Instagram objava bez dodatnog opisa.";
    }
    return parts.slice(0, 4).join(" • ");
  }

  function instagramUrlFromCode(code) {
    return `https://www.instagram.com/p/${code}/`;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("sr-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  function formatDateTime(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("sr-RS", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  function truncate(text, limit) {
    const value = String(text || "");
    if (value.length <= limit) {
      return value;
    }
    return `${value.slice(0, limit - 1)}…`;
  }

  function toCurrency(value) {
    return new Intl.NumberFormat("sr-RS").format(value) + " RSD";
  }

  function parsePrice(value) {
    const cleaned = String(value ?? "")
      .replace(/[^\d,.-]/g, "")
      .replaceAll(".", "")
      .replace(",", ".");

    if (!cleaned) {
      return null;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function pickRandom(items, count) {
    return shuffle(items).slice(0, count);
  }

  function uniqueId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeFeedPost(item, index) {
    const date = item.date || item.timestamp || new Date().toISOString();
    return {
      id: item.id || uniqueId("post"),
      sku: item.sku || linesFromCaption(item.caption)[0] || `IG-${index + 1}`,
      title: titleFromFeedItem(item, index),
      date,
      image: item.image || item.media_url || item.thumbnail_url || "",
      excerpt: item.excerpt || excerptFromFeedItem(item),
      caption: String(item.caption || "").trim(),
      url: item.url || item.permalink || instagramUrlFromCode(item.code || ""),
      source: item.source || "instagram",
      code: item.code || "",
    };
  }

  function buildProductsFromFeed(feedItems) {
    return feedItems.map((item, index) => {
      const normalized = normalizeFeedPost(item, index);
      return {
        id: uniqueId("product"),
        name: normalized.title,
        price: "",
        image: normalized.image,
        description: descriptionFromFeedItem(normalized),
        category: "instagram",
        sku: normalized.sku,
        caption: normalized.caption,
        source: normalized.source,
        instagramUrl: normalized.url,
      };
    });
  }

  function buildPostsFromFeed(feedItems) {
    return feedItems.map((item, index) => normalizeFeedPost(item, index));
  }

  function buildDefaultModels() {
    return clone(window.QW_DEFAULTS.collectionItems).map((item, index) => ({
      id: item.id || uniqueId(`model-${index + 1}`),
      name: item.name,
      subtitle: item.subtitle,
      image: item.image,
    }));
  }

  function defaultSyncState() {
    return {
      enabled: false,
      token: "",
      lastSync: "",
      source: "import",
    };
  }

  function getStored(key, fallback) {
    return safeParse(localStorage.getItem(key), fallback);
  }

  function setStored(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function migrateLegacyOrders() { return []; }

  function migrateLegacyCart() { return getStored(STORAGE.cart, []); }

  function seedState(force) {
    const shouldReset =
      force || localStorage.getItem(STORAGE.version) !== window.QW_DEFAULTS.version;

    if (!shouldReset) {
      return;
    }

    const preservedOrders = migrateLegacyOrders();
    const preservedCart = migrateLegacyCart();

    setStored(STORAGE.settings, clone(window.QW_DEFAULTS.settings));
    setStored(STORAGE.heroSlides, clone(window.QW_DEFAULTS.heroSlides));
    setStored(STORAGE.models, buildDefaultModels());
    setStored(STORAGE.posts, buildPostsFromFeed(window.QW_DEFAULTS.instagramFeed));
    setStored(STORAGE.products, buildProductsFromFeed(window.QW_DEFAULTS.instagramFeed));
    setStored(STORAGE.orders, preservedOrders);
    setStored(STORAGE.cart, preservedCart);
    setStored(STORAGE.sync, defaultSyncState());
    localStorage.setItem(STORAGE.version, window.QW_DEFAULTS.version);
  }

  function getSettings() {
    return getStored(STORAGE.settings, clone(window.QW_DEFAULTS.settings));
  }

  function getHeroSlides() {
    return getStored(STORAGE.heroSlides, clone(window.QW_DEFAULTS.heroSlides));
  }

  function getProducts() {
    return getStored(STORAGE.products, buildProductsFromFeed(window.QW_DEFAULTS.instagramFeed));
  }

  function getModels() {
    return getStored(STORAGE.models, buildDefaultModels());
  }

  function getPosts() {
    return getStored(STORAGE.posts, buildPostsFromFeed(window.QW_DEFAULTS.instagramFeed));
  }

  function getOrders() { return []; }

  function getCart() {
    return getStored(STORAGE.cart, []);
  }

  function getSyncState() {
    return getStored(STORAGE.sync, defaultSyncState());
  }

  function setSettings(value) {
    return setStored(STORAGE.settings, value);
  }

  function setHeroSlides(value) {
    return setStored(STORAGE.heroSlides, value);
  }

  function setProducts(value) {
    return setStored(STORAGE.products, value);
  }

  function setModels(value) {
    return setStored(STORAGE.models, value);
  }

  function setPosts(value) {
    return setStored(STORAGE.posts, value);
  }

  function setOrders() { return []; }

  function setCart(value) {
    const next = setStored(STORAGE.cart, value);
    updateCartCount();
    renderCartDrawer();
    return next;
  }

  function setSyncState(value) {
    return setStored(STORAGE.sync, value);
  }

  function isAdminLoggedIn() { return false; }

  function loginAdmin() { return false; }

  function logoutAdmin() {
    localStorage.removeItem(STORAGE.adminSession);
  }

  function applyTheme(theme) {
    const next = theme === "night" ? "night" : "day";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(STORAGE.theme, next); } catch (error) { /* Keep the toggle usable when storage is unavailable. */ }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme") === "night" ? "night" : "day";
    applyTheme(current === "night" ? "day" : "night");
  }

  function initTheme() {
    let stored;
    try { stored = localStorage.getItem(STORAGE.theme); } catch (error) { /* Default to day without storage. */ }
    document.documentElement.setAttribute("data-theme", stored === "night" ? "night" : "day");
  }

  function toggleMobileNav() {
    document.querySelector("[data-mobile-nav]")?.classList.toggle("is-open");
  }

  function groupCartItems(items) {
    const grouped = new Map();
    items.forEach((item) => {
      const key = `${item.id || item.name}::${item.size || ""}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          ...item,
          quantity: 0,
        });
      }
      grouped.get(key).quantity += 1;
    });
    return [...grouped.values()];
  }

  function calculateCartState(items, settings) {
    const shippingValue = parsePrice(settings.shippingPrice) || 0;
    let subtotal = 0;
    let missingPrices = false;

    items.forEach((item) => {
      const numeric = parsePrice(item.price);
      if (numeric === null) {
        missingPrices = true;
      } else {
        subtotal += numeric;
      }
    });

    return {
      subtotal,
      shippingValue,
      total: subtotal + shippingValue,
      missingPrices,
    };
  }

  function productPriceLabel(product) {
    const numeric = parsePrice(product.price);
    return numeric === null ? "Cena na upit" : toCurrency(numeric);
  }

  function addToCart(productId, options) {
    const product = getProducts().find((item) => String(item.id) === String(productId));
    if (!product) {
      return;
    }

    const extras = options || {};
    const cart = getCart();
    cart.push({
      ...product,
      size: extras.size || "",
    });
    setCart(cart);
    openCart(true);
  }

  function removeFromCart(cartKey) {
    const cart = getCart();
    const [keyId, keySize] = String(cartKey).split("::");
    const index = cart.findIndex(
      (item) =>
        String(item.id) === String(keyId) && String(item.size || "") === String(keySize || "")
    );
    if (index === -1) {
      return;
    }
    cart.splice(index, 1);
    setCart(cart);
  }

  function clearCart() {
    setCart([]);
  }

  function updateCartCount() {
    const countNode = document.querySelector("[data-cart-count]");
    if (!countNode) {
      return;
    }
    countNode.textContent = String(getCart().length);
  }

  function openCart(shouldOpen) {
    const overlay = document.querySelector("[data-cart-overlay]");
    const drawer = document.querySelector("[data-cart-drawer]");
    if (!overlay || !drawer) {
      return;
    }

    overlay.classList.toggle("is-open", shouldOpen);
    drawer.classList.toggle("is-open", shouldOpen);
  }

  function openCheckout(shouldOpen) { const note = document.querySelector("[data-cart-note]"); if (shouldOpen && note) { note.textContent = "Ovo je javni pregled dizajna. Prijava i poručivanje nisu dostupni."; note.setAttribute("role", "status"); } }

  function renderCartDrawer() {
    const target = document.querySelector("[data-cart-items]");
    const totalNode = document.querySelector("[data-cart-total]");
    const noteNode = document.querySelector("[data-cart-note]");
    const checkoutButton = document.querySelector("[data-open-checkout]");
    if (!target || !totalNode || !noteNode || !checkoutButton) {
      return;
    }

    const cart = getCart();
    const grouped = groupCartItems(cart);
    const settings = getSettings();
    const totals = calculateCartState(cart, settings);

    if (!grouped.length) {
      target.innerHTML =
        '<div class="empty-state">Korpa je prazna. Dodaj artikle i isprobaj izgled korpe. Poručivanje nije dostupno.</div>';
      totalNode.textContent = "";
      noteNode.textContent = "";
      checkoutButton.disabled = true;
      checkoutButton.classList.add("opacity-50", "cursor-not-allowed");
      return;
    }

    checkoutButton.disabled = false;
    checkoutButton.classList.remove("opacity-50", "cursor-not-allowed");

    target.innerHTML = grouped
      .map(
        (item) => `
          <div class="flex gap-3 rounded-[1.25rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" class="h-24 w-20 rounded-2xl object-cover">
            <div class="flex-1">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-medium">${escapeHtml(item.name)}</p>
                  <p class="mt-1 text-sm text-[color:var(--muted)]">${escapeHtml(productPriceLabel(item))}</p>
                  ${item.size ? `<p class="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Veličina: ${escapeHtml(item.size)}</p>` : ""}
                  <p class="mt-1 text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Količina: ${item.quantity}</p>
                </div>
                <button type="button" class="text-xs uppercase tracking-[0.18em] text-[color:var(--danger)]" data-remove-cart="${escapeHtml(`${item.id}::${item.size || ""}`)}">Ukloni</button>
              </div>
            </div>
          </div>
        `
      )
      .join("");

    const subtotalLabel = totals.missingPrices
      ? totals.subtotal > 0
        ? `${toCurrency(totals.subtotal)} + artikli bez unete cene`
        : "Cena na upit"
      : toCurrency(totals.subtotal);

    totalNode.textContent = `Artikli: ${subtotalLabel}`;
    noteNode.textContent = `${settings.shippingEta} • ${settings.shippingBadgeLabel}: ${settings.shippingPrice}`;
  }

  function renderCheckoutSummary() {
    const target = document.querySelector("[data-checkout-summary]");
    const badge = document.querySelector("[data-shipping-badge]");
    const totalNode = document.querySelector("[data-checkout-total]");
    const noteNode = document.querySelector("[data-checkout-pricing-note]");
    if (!target || !badge || !totalNode || !noteNode) {
      return;
    }

    const cart = getCart();
    const grouped = groupCartItems(cart);
    const settings = getSettings();
    const totals = calculateCartState(cart, settings);

    target.innerHTML = grouped
      .map(
        (item) => `
          <div class="flex items-center gap-3 rounded-[1rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-3">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async" class="h-16 w-14 rounded-xl object-cover">
            <div class="flex-1">
              <p class="font-medium">${escapeHtml(item.name)}</p>
              <p class="text-sm text-[color:var(--muted)]">${escapeHtml(productPriceLabel(item))} • ${item.quantity} kom.${item.size ? ` • veličina ${escapeHtml(item.size)}` : ""}</p>
            </div>
          </div>
        `
      )
      .join("");

    badge.textContent = `${settings.shippingBadgeLabel}: ${settings.shippingPrice}`;
    totalNode.textContent = totals.missingPrices
      ? totals.subtotal > 0
        ? `Unete cene artikala: ${toCurrency(totals.subtotal)}`
        : "Ukupna cena artikala: cena na upit"
      : `Ukupno za artikle: ${toCurrency(totals.subtotal)}`;
    noteNode.textContent = `${settings.shippingEta} • Ako cena na nekom artiklu nije uneta, dopisaćeš je kasnije iz admin panela.`;
  }

  function submitCheckoutForm(event) { event.preventDefault(); }

  function showCheckoutError(message) {
    const errorNode = document.querySelector("[data-checkout-error]");
    if (!errorNode) {
      alert(message);
      return;
    }
    errorNode.textContent = message;
    errorNode.hidden = false;
  }

  function resetCheckoutView() {
    const contentNode = document.querySelector("[data-checkout-content]");
    const successNode = document.querySelector("[data-checkout-success]");
    const errorNode = document.querySelector("[data-checkout-error]");
    if (contentNode) {
      contentNode.hidden = false;
    }
    if (successNode) {
      successNode.hidden = true;
    }
    if (errorNode) {
      errorNode.hidden = true;
      errorNode.textContent = "";
    }
  }

  function renderOrderSuccess(order) {
    const contentNode = document.querySelector("[data-checkout-content]");
    const successNode = document.querySelector("[data-checkout-success]");
    const idNode = document.querySelector("[data-order-id]");
    const dateNode = document.querySelector("[data-order-date]");
    if (!contentNode || !successNode) {
      return;
    }
    contentNode.hidden = true;
    successNode.hidden = false;
    if (idNode) {
      idNode.textContent = `QW-${order.id}`;
    }
    if (dateNode) {
      dateNode.textContent = formatDateTime(order.createdAt);
    }
  }

  function createLayout(pageKey) {
    const settings = getSettings();
    const navItems = [
      { key: "home", href: "index.html", label: "Početna" },
      { key: "collection", href: "kolekcija.html", label: "Kolekcija" },
      { key: "shop", href: "prodavnica.html", label: "Prodavnica" },
      { key: "instagram", href: "blog.html", label: "Instagram" },
    ];

    const headerTarget = document.querySelector("[data-site-header]");
    const footerTarget = document.querySelector("[data-site-footer]");
    if (!headerTarget || !footerTarget) {
      return;
    }

    const headerNav = navItems
      .map(
        (item) => `
          <a href="${item.href}" class="nav-link ${item.key === pageKey ? "is-active" : ""}">${item.label}</a>
        `
      )
      .join("");

    const mobileNav = navItems
      .map(
        (item) => `
          <a href="${item.href}" class="nav-link ${item.key === pageKey ? "is-active" : ""}">${item.label}</a>
        `
      )
      .join("") + `
          <a href="admin.html" class="nav-link ${pageKey === "admin" ? "is-active" : ""}">Admin</a>
        `;

    headerTarget.innerHTML = pageKey === "home" && window.QW_LANDING ? window.QW_LANDING.header() : `
      <header class="site-header">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="header-inner flex min-h-[5.2rem] items-center justify-between gap-5 py-3">
            <a href="index.html" class="brand-lockup">
              <img src="images/brand-crown.jpg" alt="Queen's World Fashion logo" class="brand-icon">
              <img src="images/brand-wordmark.png" alt="Queen's World Fashion" class="brand-wordmark">
            </a>
            <nav class="hidden items-center gap-8 md:flex">
              ${headerNav}
            </nav>
            <div class="flex items-center gap-3">
              <a href="${escapeHtml(settings.instagramUrl)}" target="_blank" rel="noreferrer" class="hidden text-sm text-[color:var(--muted)] sm:inline-flex">${escapeHtml(settings.instagramHandle)}</a>
              <button type="button" class="icon-button" data-theme-toggle aria-label="Promeni temu">
                <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
                <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
              </button>
              <a href="admin.html" class="hidden rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--ink)] transition hover:-translate-y-[1px] sm:inline-flex">Admin</a>
              <button type="button" class="icon-button md:hidden" data-menu-toggle aria-label="Otvori meni">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              </button>
              ${
                pageKey === "admin"
                  ? ""
                  : `
                    <button type="button" class="relative rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] p-3 shadow-sm transition hover:-translate-y-[1px]" data-cart-toggle aria-label="Otvori korpu">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M3 4h2l2.2 10.4A2 2 0 0 0 9.15 16H18a2 2 0 0 0 1.95-1.57L21 8H7" />
                        <circle cx="10" cy="20" r="1.2" />
                        <circle cx="18" cy="20" r="1.2" />
                      </svg>
                      <span data-cart-count class="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[color:var(--ink)] text-[11px] text-[color:var(--on-ink)]">0</span>
                    </button>
                  `
              }
            </div>
          </div>
          <nav data-mobile-nav class="mobile-nav md:hidden">
            ${mobileNav}
          </nav>
        </div>
      </header>
    `;

    footerTarget.innerHTML = pageKey === "home" && window.QW_LANDING ? window.QW_LANDING.footer() : `
      <footer class="site-footer mt-24">
        <div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 text-sm sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <div class="mb-4 flex items-center gap-3">
              <img src="images/brand-crown.jpg" alt="Logo" class="h-12 w-12 rounded-full object-cover">
              <img src="images/brand-wordmark.png" alt="Queen's World Fashion" class="w-44">
            </div>
            <p class="text-[color:var(--muted)]">${escapeHtml(settings.footerNote)}</p>
            <p class="mt-2 font-medium">${escapeHtml(settings.madeInText)}</p>
          </div>
          <div>
            <p class="mini-label mb-3">Prati nas</p>
            <a href="${escapeHtml(settings.instagramUrl)}" target="_blank" rel="noreferrer" class="text-base font-medium hover:text-[color:var(--gold-deep)]">${escapeHtml(settings.instagramHandle)}</a>
            <p class="mt-2 text-[color:var(--muted)]">Instagram objave i proizvodi mogu da se osvežavaju iz admin panela.</p>
          </div>
          <div>
            <p class="mini-label mb-3">Kontakt i dostava</p>
            <p class="text-[color:var(--muted)]">${escapeHtml(settings.location)}</p>
            <p class="mt-2">${escapeHtml(settings.shippingEta)}</p>
            <p class="mt-1">${escapeHtml(settings.shippingBadgeLabel)}: ${escapeHtml(settings.shippingPrice)}</p>
          </div>
        </div>
        <div class="border-t border-[color:var(--line)] px-4 py-4 text-center text-xs text-[color:var(--muted)]">
          © ${new Date().getFullYear()} ${escapeHtml(settings.storeName)}
        </div>
      </footer>
    `;

    if (pageKey !== "admin") {
      ensureGlobalPanels();
      updateCartCount();
      renderCartDrawer();
    }

    document.querySelector("[data-theme-toggle]")?.addEventListener("click", toggleTheme);
    if (pageKey === "home") window.QW_LANDING?.bindLogo();
    document.querySelector("[data-menu-toggle]")?.addEventListener("click", toggleMobileNav);
    document.querySelector("[data-mobile-nav]")?.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        toggleMobileNav();
      }
    });
  }

  function ensureGlobalPanels() {
    if (document.querySelector("[data-cart-drawer]")) {
      return;
    }

    const settings = getSettings();
    const panels = document.createElement("div");
    panels.innerHTML = `
      <div data-cart-overlay class="overlay fixed inset-0 z-40 bg-[color:var(--overlay)]"></div>
      <aside data-cart-drawer class="cart-drawer fixed right-4 top-4 z-50 w-[min(92vw,26rem)] rounded-[2rem] border border-[color:var(--card-edge)] bg-[color:var(--surface-strong)] p-5 shadow-[0_24px_60px_rgba(32,20,38,0.18)]">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <p class="mini-label">Korpa</p>
            <h2 class="font-serif text-3xl">Tvoja porudžbina</h2>
          </div>
          <button type="button" class="rounded-full border border-[color:var(--line)] bg-[color:var(--surface)] px-3 py-2 text-xs uppercase tracking-[0.18em]" data-cart-close>Zatvori</button>
        </div>
        <div data-cart-items class="space-y-3"></div>
        <div class="mt-5 rounded-[1.4rem] border border-[color:var(--line)] bg-[color:var(--surface)] p-4">
          <p data-cart-total class="font-medium"></p>
          <p data-cart-note class="mt-2 text-sm text-[color:var(--muted)]"></p>
        </div>
        <div class="mt-4 flex gap-3">
          <button type="button" class="action-button action-button-secondary flex-1" data-cart-clear>Očisti</button>
          <button type="button" class="action-button action-button-primary flex-1" data-open-checkout>Demo pregled</button>
        </div>
      </aside>
    `;

    document.body.append(panels);

    document.querySelector("[data-cart-overlay]")?.addEventListener("click", () => openCart(false));
    document.querySelector("[data-cart-close]")?.addEventListener("click", () => openCart(false));
    document.querySelector("[data-cart-clear]")?.addEventListener("click", clearCart);
    document.querySelector("[data-open-checkout]")?.addEventListener("click", () => {
      if (!getCart().length) {
        return;
      }
      openCheckout(true);
    });
    document.querySelector("[data-checkout-overlay]")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) {
        openCheckout(false);
      }
    });
    document.querySelector("[data-close-checkout]")?.addEventListener("click", () => openCheckout(false));
    document.querySelector("[data-close-checkout-success]")?.addEventListener("click", () => openCheckout(false));
    document.querySelector("[data-checkout-form]")?.addEventListener("submit", submitCheckoutForm);

    document.addEventListener("click", (event) => {
      const cartToggle = event.target.closest("[data-cart-toggle]");
      const removeButton = event.target.closest("[data-remove-cart]");
      if (cartToggle) {
        openCart(!document.querySelector("[data-cart-drawer]")?.classList.contains("is-open"));
      }
      if (removeButton) {
        removeFromCart(removeButton.getAttribute("data-remove-cart"));
      }
    });
  }

  async function syncInstagramFromToken() { throw new Error("Instagram Sync nije dostupan u javnom pregledu."); }

  function restoreImportedInstagramData() {
    setPosts(buildPostsFromFeed(window.QW_DEFAULTS.instagramFeed));
    setProducts(buildProductsFromFeed(window.QW_DEFAULTS.instagramFeed));
    setSyncState(defaultSyncState());
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Nije moguće učitati izabrani fajl."));
      reader.readAsDataURL(file);
    });
  }

  seedState(false);
  if (document.body.dataset.page === "home") window.QW_LANDING?.migrate();
  initTheme();

  window.QW = {
    STORAGE,
    addToCart,
    applyTheme,
    buildPostsFromFeed,
    buildProductsFromFeed,
    calculateCartState,
    clone,
    createLayout,
    descriptionFromFeedItem,
    escapeHtml,
    formatDate,
    formatDateTime,
    getCart,
    getHeroSlides,
    getModels,
    getOrders,
    getPosts,
    getProducts,
    getSettings,
    getSyncState,
    initTheme,
    instagramUrlFromCode,
    isAdminLoggedIn,
    linesFromCaption,
    loginAdmin,
    logoutAdmin,
    openCart,
    openCheckout,
    parsePrice,
    pickRandom,
    productPriceLabel,
    readImageFile,
    renderCartDrawer,
    renderCheckoutSummary,
    restoreImportedInstagramData,
    seedState,
    setCart,
    setHeroSlides,
    setModels,
    setOrders,
    setPosts,
    setProducts,
    setSettings,
    setSyncState,
    shuffle,
    syncInstagramFromToken,
    titleFromFeedItem,
    toCurrency,
    toggleTheme,
    truncate,
    uniqueId,
    updateCartCount,
  };
})();
