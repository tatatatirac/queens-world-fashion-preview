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
    query: "",
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
          <img src="${QW.escapeHtml(product.image)}" alt="${QW.escapeHtml(product.name)}" loading="lazy" decoding="async" class="frame-img">
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
    if (!grid) {
      return;
    }

    let products = QW.getProducts();
    const total = products.length;

    if (shopState.category !== "all") {
      products = products.filter((item) => (item.category || "ostalo") === shopState.category);
    }

    if (shopState.query) {
      const needle = shopState.query.toLowerCase();
      products = products.filter((item) =>
        `${item.name} ${item.description}`.toLowerCase().includes(needle)
      );
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

    if (countNode) {
      countNode.textContent = `${products.length} od ${total} artikala`;
    }

    grid.innerHTML = products.length
      ? products.map(renderProductCard).join("")
      : '<div class="empty-state md:col-span-2 xl:col-span-3">Nema artikala za zadatu pretragu. Probaj drugu reč ili kategoriju.</div>';
  }

  function renderShopPage() {
    const products = QW.getProducts();
    const settings = QW.getSettings();
    const categories = [...new Set(products.map((item) => item.category || "ostalo"))].sort();
    const target = document.querySelector("[data-page-root]");

    target.innerHTML = `
      <section class="mb-8">
        <p class="mini-label mb-3">Prodavnica</p>
        <h1 class="section-title font-serif">Svi proizvodi za poručivanje</h1>
        <p class="section-subtitle mt-4 max-w-3xl">${QW.escapeHtml(settings.shopNote)}</p>
      </section>
      <section class="filter-bar mb-8">
        <input type="search" class="field-input" placeholder="Traži artikal..." aria-label="Pretraga artikala" data-shop-query>
        <select class="field-select" aria-label="Kategorija" data-shop-category>
          <option value="all">Sve kategorije</option>
          ${categories.map((category) => `<option value="${QW.escapeHtml(category)}">${QW.escapeHtml(category)}</option>`).join("")}
        </select>
        <select class="field-select" aria-label="Sortiranje" data-shop-sort>
          <option value="default">Najnovije prvo</option>
          <option value="price-asc">Cena: niža → viša</option>
          <option value="price-desc">Cena: viša → niža</option>
        </select>
        <span class="mini-label" data-shop-count></span>
      </section>
      <section class="grid gap-6 md:grid-cols-2 xl:grid-cols-3" data-shop-grid></section>
    `;

    renderShopGrid();

    document.querySelector("[data-shop-query]")?.addEventListener("input", (event) => {
      shopState.query = String(event.target.value || "").trim();
      renderShopGrid();
    });
    document.querySelector("[data-shop-category]")?.addEventListener("change", (event) => {
      shopState.category = event.target.value || "all";
      renderShopGrid();
    });
    document.querySelector("[data-shop-sort]")?.addEventListener("change", (event) => {
      shopState.sort = event.target.value || "default";
      renderShopGrid();
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
      <section class="mb-8">
        <a href="prodavnica.html" class="text-sm font-medium text-[color:var(--muted)] hover:text-[color:var(--gold-deep)]">← Nazad u prodavnicu</a>
      </section>
      <section class="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <figure class="surface-card overflow-hidden rounded-[2rem]">
          <img src="${QW.escapeHtml(product.image)}" alt="${QW.escapeHtml(product.name)}" decoding="async" class="frame-img aspect-[4/5] w-full object-cover">
        </figure>
        <div class="surface-card rounded-[2rem] p-6 sm:p-8">
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
