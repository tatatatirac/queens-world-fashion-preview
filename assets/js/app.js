(function () {
  const page = document.body.dataset.page;
  if (!page || page === "admin") {
    return;
  }

  const { QW } = window;

  const detailState = {
    id: "",
    size: "",
  };

  const shopState = {
    category: "all",
    sort: "default",
  };

  function sizesFromProduct(product) {
    const post = QW.getPosts().find((item) => item.sku === product.sku);
    const text = `${product.caption || ""} ${post?.caption || ""} ${product.description || ""}`.toLowerCase();
    if (/xs\s*[-–]\s*3xl/.test(text)) {
      return ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
    }
    if (/xs\s*[-–]\s*xxl/.test(text)) {
      return ["XS", "S", "M", "L", "XL", "XXL"];
    }
    if (/s\s*[-–]\s*xxl/.test(text)) {
      return ["S", "M", "L", "XL", "XXL"];
    }
    return [];
  }

  function productHref(product) {
    return `proizvod.html?id=${encodeURIComponent(product.id)}`;
  }

  function shopProductKind(product) {
    const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();
    if (/haljin|aya|princes/.test(text)) return "haljine";
    if (/komplet|kombinacij|sport/.test(text)) return "kompleti";
    return "ostalo";
  }

  function shopProductKindLabel(product) {
    return { haljine: "Haljine", kompleti: "Kompleti", ostalo: "Posebni modeli" }[shopProductKind(product)];
  }

  function shopProductCaption(product) {
    const post = QW.getPosts().find((item) => String(item.sku) === String(product.sku));
    return String(product.caption || post?.caption || post?.excerpt || "").trim();
  }

  function shopProductDescription(product) {
    const manualDescription = String(product.description || "").trim();
    if (manualDescription && !/^Preuzeto sa Instagram objave/i.test(manualDescription)) {
      return QW.truncate(manualDescription, 135);
    }

    const lines = shopProductCaption(product)
      .split(/\r?\n|\s+•\s+/)
      .slice(1)
      .map((line) => line.replace(/\/\/\s*[\d.]+(?:\s*RSD)?/gi, "").replace(/#\S+/g, "").replace(/@\S+/g, "").trim())
      .filter((line) => line && !/^(?:xs|s)\s*[-–]\s*(?:xxl|3xl)$/i.test(line));

    return QW.truncate(
      lines.slice(0, 2).join(" ") || "Ručno izrađen model iz naše radionice, uz mogućnost dogovora oko detalja.",
      135
    );
  }

  function shopProductPriceLabel(product) {
    if (QW.parsePrice(product.price) !== null) return QW.productPriceLabel(product);

    const prices = [...shopProductCaption(product).matchAll(/\/\/\s*([\d][\d.]*)/g)]
      .map((match) => QW.parsePrice(match[1]))
      .filter((value) => value !== null && value >= 100);
    const uniquePrices = [...new Set(prices)];
    if (!uniquePrices.length) return QW.productPriceLabel(product);

    const lowestPrice = Math.min(...uniquePrices);
    return `${uniquePrices.length > 1 ? "od " : ""}${new Intl.NumberFormat("sr-RS").format(lowestPrice)} RSD`;
  }

  function productMediaData(product) {
    const image = String(product.image || "").trim();
    return {
      image,
      image2: String(product.image2 || product.secondaryImage || image).trim() || image,
      video: String(product.video || product.videoUrl || "").trim(),
    };
  }

  function renderProductMedia(product, options = {}) {
    const media = productMediaData(product);
    const variant = options.variant ? ` product-media-stage--${options.variant}` : "";
    const loading = options.loading === "eager" ? "eager" : "lazy";
    const focusable = options.focusable ? ' tabindex="0"' : "";

    return `
      <span class="product-media-stage${variant}" data-product-media${focusable}>
        <img src="${QW.escapeHtml(media.image)}" alt="${QW.escapeHtml(product.name)}" loading="${loading}" decoding="async" class="product-media-frame frame-img is-active" data-product-frame="0">
        <img src="${QW.escapeHtml(media.image2)}" alt="" aria-hidden="true" loading="lazy" decoding="async" class="product-media-frame frame-img" data-product-frame="1">
        ${
          media.video
            ? `<video class="product-media-video" data-product-video muted loop playsinline preload="metadata" poster="${QW.escapeHtml(media.image)}" aria-hidden="true"><source src="${QW.escapeHtml(media.video)}"></video><span class="product-media-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>`
            : ""
        }
        <span class="product-media-dots" aria-hidden="true"><i class="is-active" data-product-dot="0"></i><i data-product-dot="1"></i></span>
      </span>
    `;
  }

  function initProductMedia(root = document) {
    root.querySelectorAll("[data-product-media]:not([data-product-media-ready])").forEach((media) => {
      media.setAttribute("data-product-media-ready", "true");
      const frames = [...media.querySelectorAll("[data-product-frame]")];
      const dots = [...media.querySelectorAll("[data-product-dot]")];
      const video = media.querySelector("[data-product-video]");
      const hoverTarget = media.closest("a") || media;
      let activeIndex = 0;
      let wantsVideo = false;

      const showFrame = (index) => {
        activeIndex = index % frames.length;
        frames.forEach((frame, frameIndex) => frame.classList.toggle("is-active", frameIndex === activeIndex));
        dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === activeIndex));
      };

      const timer = window.setInterval(() => {
        if (!media.isConnected) {
          window.clearInterval(timer);
          return;
        }
        if (!media.classList.contains("is-video-playing")) showFrame(activeIndex + 1);
      }, 3600);

      const startPreview = () => {
        if (!video) {
          media.classList.add("is-photo-preview");
          return;
        }
        wantsVideo = true;
        video.currentTime = 0;
        const playAttempt = video.play();
        if (playAttempt) {
          playAttempt
            .then(() => {
              if (wantsVideo) media.classList.add("is-video-playing");
              else video.pause();
            })
            .catch(() => media.classList.remove("is-video-playing"));
        }
      };

      const stopPreview = () => {
        wantsVideo = false;
        media.classList.remove("is-video-playing", "is-photo-preview");
        if (video) {
          video.pause();
          video.currentTime = 0;
        }
      };

      hoverTarget.addEventListener("mouseenter", startPreview);
      hoverTarget.addEventListener("mouseleave", stopPreview);
      hoverTarget.addEventListener("focus", startPreview);
      hoverTarget.addEventListener("blur", stopPreview);
    });
  }

  function initShopRowWheel(root) {
    if (!root || root.hasAttribute("data-shop-row-wheel-ready")) {
      return;
    }

    root.setAttribute("data-shop-row-wheel-ready", "true");
    let wheelLocked = false;

    root.addEventListener(
      "wheel",
      (event) => {
        if (
          wheelLocked ||
          event.ctrlKey ||
          event.shiftKey ||
          Math.abs(event.deltaY) < 2 ||
          !window.matchMedia("(hover: hover) and (pointer: fine)").matches
        ) {
          return;
        }

        const hoveredCard = event.target.closest("[data-feature-product], [data-shop-card]");
        if (!hoveredCard) {
          return;
        }

        const cards = [...root.querySelectorAll("[data-feature-product], [data-shop-card]")].filter((card) => {
          const rect = card.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        const rows = [];
        cards.forEach((card) => {
          const top = Math.round(card.getBoundingClientRect().top + window.scrollY);
          const row = rows.find((item) => Math.abs(item.top - top) <= 4);
          if (row) row.cards.push(card);
          else rows.push({ top, cards: [card] });
        });
        rows.sort((a, b) => a.top - b.top);

        const currentIndex = rows.findIndex((row) => row.cards.includes(hoveredCard));
        const targetIndex = currentIndex + Math.sign(event.deltaY);
        if (currentIndex < 0 || targetIndex < 0 || targetIndex >= rows.length) {
          return;
        }

        event.preventDefault();
        wheelLocked = true;
        rows[targetIndex].cards[0].scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "center",
          inline: "nearest",
        });
        window.setTimeout(() => {
          wheelLocked = false;
        }, 520);
      },
      { passive: false }
    );
  }

  function renderShopFeatureCard(product, index) {
    return `
      <article class="shop-feature-card" data-feature-product="${QW.escapeHtml(product.id)}" style="--feature-index:${index}">
        <a href="${productHref(product)}" class="shop-feature-link" aria-label="Pogledaj ${QW.escapeHtml(product.name)}">
          <span class="shop-feature-media">
            ${renderProductMedia(product, { loading: index ? "lazy" : "eager", variant: "feature" })}
            <span class="shop-feature-number" aria-hidden="true">0${index + 1}</span>
          </span>
          <div class="shop-feature-copy">
            <p class="shop-feature-category">${QW.escapeHtml(shopProductKindLabel(product))}</p>
            <h3 class="font-serif">${QW.escapeHtml(product.name)}</h3>
            <p class="shop-feature-description">${QW.escapeHtml(shopProductDescription(product))}</p>
            <span class="shop-feature-meta"><strong>${QW.escapeHtml(shopProductPriceLabel(product))}</strong><b>Pogledaj model</b></span>
          </div>
        </a>
      </article>
    `;
  }

  function renderShopProductCard(product, index) {
    return `
      <article class="shop-product-card" data-shop-card data-shop-product="${QW.escapeHtml(product.id)}" style="--card-index:${index % 6}">
        <a href="${productHref(product)}" class="shop-product-media" aria-label="Pogledaj ${QW.escapeHtml(product.name)}">
          ${renderProductMedia(product, { variant: "shop" })}
          <span class="shop-product-badge">Ručno rađeno</span>
          <span class="shop-product-view">Pogledaj model</span>
        </a>
        <div class="shop-product-info">
          <p class="mini-label">${QW.escapeHtml(shopProductKindLabel(product))}</p>
          <h3 class="font-serif"><a href="${productHref(product)}">${QW.escapeHtml(product.name)}</a></h3>
          <p class="shop-product-description">${QW.escapeHtml(shopProductDescription(product))}</p>
          <div class="shop-product-footer">
            <span class="shop-product-price">${QW.escapeHtml(shopProductPriceLabel(product))}</span>
            <button type="button" class="shop-quick-add" data-add-product="${QW.escapeHtml(product.id)}" aria-label="Dodaj ${QW.escapeHtml(product.name)} u korpu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 4h2l2.2 10.4A2 2 0 0 0 9.15 16H18a2 2 0 0 0 1.95-1.57L21 8H7"/><path d="M12 10v4m-2-2h4"/></svg>
              <span>Dodaj</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function renderShopStory(settings) {
    return `
      <aside class="shop-story-callout">
        <div>
          <p class="mini-label">Po vašoj meri</p>
          <h3 class="font-serif">Ne mora sve da bude konfekcijski.</h3>
        </div>
        <p>Želite malu korekciju dužine ili kroja? Pošaljite nam svoje mere i dogovorićemo detalje.</p>
        <a href="${QW.escapeHtml(settings.instagramUrl)}" target="_blank" rel="noreferrer">Pišite nam <span aria-hidden="true">→</span></a>
      </aside>
    `;
  }

  function renderHeroTrack(slides) {
    const duplicated = [...slides, ...slides];
    return duplicated
      .map(
        (slide) => `
          <article class="hero-card">
            <img src="${QW.escapeHtml(slide.image)}" alt="${QW.escapeHtml(slide.title)}" decoding="async">
            <div class="p-4">
              <p class="mini-label mb-2">Queen's World</p>
              <h3 class="font-serif text-2xl">${QW.escapeHtml(slide.title)}</h3>
              <p class="mt-2 text-sm text-[color:var(--muted)]">${QW.escapeHtml(slide.subtitle)}</p>
            </div>
          </article>
        `
      )
      .join("");
  }

  function renderProductCard(product) {
    return `
      <article class="product-card surface-card">
        <a href="${productHref(product)}" class="card-link" aria-label="${QW.escapeHtml(product.name)}">
          ${renderProductMedia(product, { variant: "card" })}
        </a>
        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="mini-label mb-2">${QW.escapeHtml(product.category || "proizvod")}</p>
              <h3 class="font-serif text-2xl">
                <a href="${productHref(product)}" class="card-link">${QW.escapeHtml(product.name)}</a>
              </h3>
            </div>
            <span class="meta-chip">${QW.escapeHtml(QW.productPriceLabel(product))}</span>
          </div>
          <p class="mt-3 text-sm text-[color:var(--muted)]">${QW.escapeHtml(product.description)}</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <button type="button" class="action-button action-button-primary" data-add-product="${QW.escapeHtml(product.id)}">Dodaj u korpu</button>
            ${
              product.instagramUrl
                ? `<a href="${QW.escapeHtml(product.instagramUrl)}" target="_blank" rel="noreferrer" class="action-button action-button-secondary">Instagram</a>`
                : ""
            }
          </div>
        </div>
      </article>
    `;
  }

  function renderModelCard(model) {
    return `
      <article class="model-card surface-card">
        <img src="${QW.escapeHtml(model.image)}" alt="${QW.escapeHtml(model.name)}" loading="lazy" decoding="async" class="frame-img">
        <div class="p-5">
          <p class="mini-label mb-2">Kolekcija</p>
          <h3 class="font-serif text-2xl">${QW.escapeHtml(model.name)}</h3>
          <p class="mt-2 text-sm text-[color:var(--muted)]">${QW.escapeHtml(model.subtitle)}</p>
        </div>
      </article>
    `;
  }

  function renderPostCard(post) {
    return `
      <article class="post-card surface-card">
        <img src="${QW.escapeHtml(post.image)}" alt="${QW.escapeHtml(post.title)}" loading="lazy" decoding="async" class="frame-img">
        <div class="flex flex-1 flex-col p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="mini-label mb-2">Instagram</p>
              <h3 class="font-serif text-2xl">${QW.escapeHtml(post.title)}</h3>
            </div>
            <span class="meta-chip">${QW.escapeHtml(QW.formatDate(post.date))}</span>
          </div>
          <p class="mt-3 text-sm text-[color:var(--muted)]">${QW.escapeHtml(QW.truncate(post.excerpt, 170))}</p>
          <div class="mt-5">
            <a href="${QW.escapeHtml(post.url)}" target="_blank" rel="noreferrer" class="action-button action-button-secondary">Otvori objavu</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderHomePage() {
    const settings = QW.getSettings();
    const slides = QW.getHeroSlides();
    const products = QW.pickRandom(QW.getProducts(), 3);
    const models = QW.pickRandom(QW.getModels(), 3);
    const posts = QW.getPosts().slice(0, 3);
    const target = document.querySelector("[data-page-root]");

    target.innerHTML = `
      <section class="landing-hero">
        <div class="landing-story surface-card rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <span class="badge-pill">${QW.escapeHtml(settings.landingEyebrow)}</span>
          <h1 class="section-title font-serif mt-5 max-w-2xl">${QW.escapeHtml(settings.landingTitle)}</h1>
          <p class="section-subtitle mt-5 max-w-xl text-base leading-7 sm:text-lg">${QW.escapeHtml(settings.landingLead)}</p>
          <div class="landing-story-actions mt-8 flex flex-wrap gap-3">
            <a href="prodavnica.html" class="action-button action-button-primary">Uđi u prodavnicu</a>
          </div>
        </div>
        <div class="hero-marquee" role="region" aria-label="Galerija radionice">
          <button type="button" class="marquee-toggle" data-marquee-toggle aria-label="Pauziraj animaciju galerije" aria-pressed="false">
            <svg class="icon-pause" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5v14M15 5v14"/></svg>
            <svg class="icon-play" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 5l12 7-12 7V5Z"/></svg>
          </button>
          <div class="hero-track">${renderHeroTrack(slides)}</div>
        </div>
      </section>

      <section class="mt-20">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 class="section-title font-serif">Modeli u fokusu</h2>
          </div>
          <a href="kolekcija.html" class="text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--gold-deep)]">Cela kolekcija</a>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          ${models.map(renderModelCard).join("")}
        </div>
      </section>

      <section class="mt-20">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 class="section-title font-serif">Najprodavaniji modeli</h2>
          </div>
          <a href="prodavnica.html" class="text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--gold-deep)]">Otvori prodavnicu</a>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          ${products.map(renderProductCard).join("")}
        </div>
      </section>

      <section class="mt-20">
        <div class="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 class="section-title font-serif">Sa Instagrama</h2>
          </div>
          <a href="blog.html" class="text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--gold-deep)]">Sve objave</a>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          ${posts.map(renderPostCard).join("")}
        </div>
      </section>
    `;

    window.QW_LANDING?.bindGallery();
  }

  function renderCollectionPage() {
    const models = QW.getModels();
    const target = document.querySelector("[data-page-root]");

    target.innerHTML = `
      <section class="mb-10">
        <p class="mini-label mb-3">Kolekcija</p>
        <h1 class="section-title font-serif">Svi modeli na posebnoj stranici</h1>
        <p class="section-subtitle mt-4 max-w-2xl">Ovi modeli se menjaju direktno iz admin taba Modeli: naziv, opis i slika mogu odmah da se prepravljaju bez diranja HTML fajlova.</p>
      </section>
      <section class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        ${models.map(renderModelCard).join("")}
      </section>
    `;
  }

  function renderShopGrid() {
    const grid = document.querySelector("[data-shop-grid]");
    const countNode = document.querySelector("[data-shop-count]");
    const titleNode = document.querySelector("[data-shop-results-title]");
    const featuredNode = document.querySelector("[data-shop-featured]");
    if (!grid) {
      return;
    }

    const allProducts = QW.getProducts();
    const total = allProducts.length;
    const featuredIds = new Set(allProducts.slice(0, 3).map((product) => String(product.id)));
    const isExploring = Boolean(shopState.category !== "all" || shopState.sort !== "default");
    let products = [...allProducts];

    if (shopState.category !== "all") {
      products = products.filter((item) => shopProductKind(item) === shopState.category);
    }

    if (shopState.sort === "price-asc") {
      products = [...products].sort(
        (a, b) => (QW.parsePrice(a.price) ?? Infinity) - (QW.parsePrice(b.price) ?? Infinity)
      );
    }

    if (shopState.sort === "price-desc") {
      products = [...products].sort(
        (a, b) => (QW.parsePrice(b.price) ?? -Infinity) - (QW.parsePrice(a.price) ?? -Infinity)
      );
    }

    if (shopState.sort === "name-asc") {
      products.sort((a, b) => String(a.name).localeCompare(String(b.name), "sr"));
    }

    if (!isExploring) {
      products = products.filter((product) => !featuredIds.has(String(product.id)));
    }

    if (countNode) {
      countNode.textContent = isExploring ? `${products.length} ${products.length === 1 ? "rezultat" : "rezultata"}` : `${total} modela`;
    }

    if (titleNode) titleNode.textContent = isExploring ? "Prikaz modela" : "Još modela za vas";
    if (featuredNode) featuredNode.hidden = isExploring;
    document.querySelectorAll("[data-shop-kind]").forEach((button) => {
      const isActive = button.getAttribute("data-shop-kind") === shopState.category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (!products.length) {
      grid.innerHTML = '<div class="shop-empty"><p class="font-serif">Nema modela u ovoj kategoriji.</p><span>Pogledajte sve dostupne modele.</span><button type="button" data-clear-shop>Prikaži sve</button></div>';
      return;
    }

    const cards = products.map(renderShopProductCard);
    if (cards.length > 6) cards.splice(6, 0, renderShopStory(QW.getSettings()));
    grid.innerHTML = cards.join("");
    initProductMedia(grid);
  }

  function renderShopPage() {
    const products = QW.getProducts();
    const settings = QW.getSettings();
    const kinds = [
      { key: "all", label: "Svi modeli", count: products.length },
      { key: "haljine", label: "Haljine", count: products.filter((item) => shopProductKind(item) === "haljine").length },
      { key: "kompleti", label: "Kompleti", count: products.filter((item) => shopProductKind(item) === "kompleti").length },
      { key: "ostalo", label: "Ostalo", count: products.filter((item) => shopProductKind(item) === "ostalo").length },
    ].filter((kind) => kind.key === "all" || kind.count);
    const featured = products.slice(0, 3);
    const target = document.querySelector("[data-page-root]");

    target.innerHTML = `
      <section class="shop-hero">
        <div class="shop-hero-copy">
          <p class="mini-label">Queen's World izbor</p>
          <h1 class="font-serif">Modeli koje ćete želeti da nosite ponovo.</h1>
          <p>Ženstveni krojevi iz naše radionice, ručno izrađeni sa pažnjom i prilagodljivi vašim merama.</p>
          <a href="#svi-modeli" class="action-button action-button-primary">Istražite modele</a>
        </div>
        <div class="shop-promises" aria-label="Prednosti Queen's World modela">
          <div><span>01</span><strong>Ručno izrađeno</strong><p>Svaki model prolazi kroz ruke naših krojačica.</p></div>
          <div><span>02</span><strong>Korekcije po meri</strong><p>Dogovaramo manje izmene kroja i dužine.</p></div>
          <div><span>03</span><strong>${QW.escapeHtml(settings.shippingEta)}</strong><p>Brzo do modela koji ste izabrali.</p></div>
        </div>
      </section>

      <section class="shop-featured" data-shop-featured>
        <div class="shop-section-heading">
          <div><p class="mini-label">Izdvojeno za vas</p><h2 class="font-serif">Počnite od ovih modela</h2></div>
          <p>Tri različita raspoloženja, ista pažnja u svakom detalju.</p>
        </div>
        <div class="shop-feature-grid">${featured.map(renderShopFeatureCard).join("")}</div>
      </section>

      <section class="shop-filter-shell" aria-label="Filteri i sortiranje proizvoda">
        <div class="shop-kind-list" aria-label="Vrsta modela">
          ${kinds.map((kind) => `<button type="button" data-shop-kind="${kind.key}" aria-pressed="${kind.key === "all"}">${kind.label}<span>${kind.count}</span></button>`).join("")}
        </div>
        <div class="shop-toolbar-row">
          <label class="shop-sort">
            <span>Sortiraj</span>
            <select aria-label="Sortiranje" data-shop-sort>
              <option value="default">Naš izbor</option>
              <option value="name-asc">Naziv A–Z</option>
          <option value="price-asc">Cena: niža → viša</option>
          <option value="price-desc">Cena: viša → niža</option>
        </select>
          </label>
        </div>
      </section>

      <section class="shop-results" id="svi-modeli">
        <div class="shop-results-heading"><h2 class="font-serif" data-shop-results-title>Još modela za vas</h2><span data-shop-count></span></div>
        <div class="shop-product-grid" data-shop-grid></div>
      </section>
    `;

    renderShopGrid();
    initProductMedia(target);
    initShopRowWheel(target);

    document.querySelector("[data-shop-sort]")?.addEventListener("change", (event) => {
      shopState.sort = event.target.value || "default";
      renderShopGrid();
    });
    target.addEventListener("click", (event) => {
      const kind = event.target.closest("[data-shop-kind]");
      if (kind) {
        shopState.category = kind.getAttribute("data-shop-kind") || "all";
        renderShopGrid();
      }
      if (event.target.closest("[data-clear-shop]")) {
        shopState.category = "all";
        shopState.sort = "default";
        document.querySelector("[data-shop-sort]").value = "default";
        renderShopGrid();
      }
    });
  }

  function renderProductDetailPage() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    const products = QW.getProducts();
    const product =
      products.find((item) => String(item.id) === String(productId)) || products[0];
    const target = document.querySelector("[data-page-root]");

    if (!product) {
      target.innerHTML = `
        <section class="empty-state">
          Trenutno nema dostupnih artikala.
          <a href="prodavnica.html" class="font-semibold text-[color:var(--gold-deep)]">Vrati se u prodavnicu</a>.
        </section>
      `;
      return;
    }

    const sizes = sizesFromProduct(product);
    detailState.id = String(product.id);
    detailState.size = sizes[0] || "";
    const settings = QW.getSettings();
    const related = QW.pickRandom(
      products.filter((item) => String(item.id) !== String(product.id)),
      3
    );

    target.innerHTML = `
      <section class="product-detail-nav">
        <a href="prodavnica.html" class="text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--gold-deep)]">← Nazad u prodavnicu</a>
      </section>
      <section class="product-detail-layout">
        <figure class="product-detail-figure surface-card">
          ${renderProductMedia(product, { loading: "eager", variant: "detail", focusable: true })}
        </figure>
        <div class="product-detail-copy surface-card">
          <p class="mini-label mb-3">${QW.escapeHtml(product.category || "proizvod")}${product.sku ? ` • ${QW.escapeHtml(product.sku)}` : ""}</p>
          <h1 class="section-title font-serif">${QW.escapeHtml(product.name)}</h1>
          <p class="mt-4"><span class="meta-chip text-base">${QW.escapeHtml(QW.productPriceLabel(product))}</span></p>
          <p class="mt-5 leading-7 text-[color:var(--muted)]">${QW.escapeHtml(product.description)}</p>
          ${
            sizes.length
              ? `
                <div class="mt-6">
                  <p class="mini-label mb-3">Veličina</p>
                  <div class="flex flex-wrap gap-2" data-size-group>
                    ${sizes
                      .map(
                        (size) =>
                          `<button type="button" class="size-chip ${size === detailState.size ? "is-selected" : ""}" data-size="${size}">${size}</button>`
                      )
                      .join("")}
                  </div>
                </div>
              `
              : ""
          }
          <div class="mt-7 flex flex-wrap gap-3">
            <button type="button" class="action-button action-button-primary" data-add-product="${QW.escapeHtml(product.id)}">Dodaj u korpu</button>
            ${
              product.instagramUrl
                ? `<a href="${QW.escapeHtml(product.instagramUrl)}" target="_blank" rel="noreferrer" class="action-button action-button-secondary">Vidi Instagram objavu</a>`
                : ""
            }
          </div>
          <p class="mt-5 text-sm text-[color:var(--muted)]">${QW.escapeHtml(settings.shippingEta)} • ${QW.escapeHtml(settings.shippingBadgeLabel)}: ${QW.escapeHtml(settings.shippingPrice)}</p>
        </div>
      </section>
      ${
        related.length
          ? `
            <section class="mt-16">
              <div class="mb-8">
                <p class="mini-label mb-3">Iz iste kolekcije</p>
                <h2 class="section-title font-serif">Može da se kombinuje</h2>
              </div>
              <div class="grid gap-6 md:grid-cols-3">
                ${related.map(renderProductCard).join("")}
              </div>
            </section>
          `
          : ""
      }
    `;

    initProductMedia(target);

    document.querySelector("[data-size-group]")?.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-size]");
      if (!chip) {
        return;
      }
      detailState.size = chip.getAttribute("data-size") || "";
      document.querySelectorAll("[data-size-group] .size-chip").forEach((node) => {
        node.classList.toggle("is-selected", node === chip);
      });
    });
  }

  function renderInstagramPage() {
    const posts = QW.getPosts();
    const settings = QW.getSettings();
    const target = document.querySelector("[data-page-root]");

    target.innerHTML = `
      <section class="mb-10">
        <p class="mini-label mb-3">Instagram</p>
        <h1 class="section-title font-serif">Objave sa profila ${QW.escapeHtml(settings.instagramHandle)}</h1>
        <p class="section-subtitle mt-4 max-w-3xl">Početno stanje je popunjeno javno dostupnim objavama sa profila, a iz admin taba Instagram Sync možeš kasnije da ubaciš svoj token i osvežiš sadržaj.</p>
      </section>
      <section class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        ${posts.map(renderPostCard).join("")}
      </section>
    `;
  }

  function initPage() {
    QW.createLayout(page);

    if (page === "home") {
      renderHomePage();
    }

    if (page === "collection") {
      renderCollectionPage();
    }

    if (page === "shop") {
      renderShopPage();
    }

    if (page === "product") {
      renderProductDetailPage();
    }

    if (page === "instagram") {
      renderInstagramPage();
    }
  }

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
      const isDetailProduct = String(addButton.getAttribute("data-add-product")) === detailState.id;
      QW.addToCart(addButton.getAttribute("data-add-product"), {
        size: isDetailProduct ? detailState.size : "",
      });
    }
  });

  initPage();
})();
