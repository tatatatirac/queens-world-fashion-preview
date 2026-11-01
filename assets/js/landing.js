(function () {
  const revision = "2026-11-01-atelier-v1";

  function migrate() {
    if (localStorage.getItem("qw_preview_landing_revision") === revision) return;
    const settings = JSON.parse(localStorage.getItem("qw_preview_settings") || "{}");
    const slides = JSON.parse(localStorage.getItem("qw_preview_hero_slides") || "null");
    // Keep the previous landing content; leave catalog, orders and cart untouched.
    localStorage.setItem("qw_preview_landing_backup_20261101", JSON.stringify({ settings, slides }));
    const defaults = window.QW_DEFAULTS.settings;
    ["landingEyebrow", "landingTitle", "landingLead"].forEach((key) => {
      settings[key] = defaults[key];
    });
    localStorage.setItem("qw_preview_settings", JSON.stringify(settings));
    localStorage.setItem("qw_preview_hero_slides", JSON.stringify(window.QW_DEFAULTS.heroSlides));
    localStorage.setItem("qw_preview_landing_revision", revision);
  }

  function header() {
    return `
      <header class="landing-header">
        <div class="landing-brand-row">
          <a class="landing-brand" href="index.html" aria-label="Queen's World Fashion, početna">
            <img class="landing-logo-poster" src="images/queens-world-logo-poster.png" alt="Queen's World Fashion" width="1080" height="1080" fetchpriority="high">
            <video class="landing-logo-video" muted loop playsinline preload="metadata" poster="images/queens-world-logo-poster.png" aria-hidden="true" tabindex="-1">
              <source data-src="images/queens-world-rotating-logo.mp4" type="video/mp4">
            </video>
            <img class="landing-logo-gif" data-src="images/queens-world-rotating-logo.gif" alt="" width="432" height="432" aria-hidden="true" hidden>
          </a>
          <button class="logo-motion-toggle" type="button" data-logo-motion aria-label="Pauziraj animaciju logotipa" aria-pressed="false" hidden>Ⅱ</button>
        </div>
        <div class="landing-nav-row">
          <nav class="landing-nav" aria-label="Glavna navigacija">
            <a href="index.html" class="nav-link is-active" aria-current="page">Početna</a>
            <a href="prodavnica.html" class="nav-link">Prodavnica</a>
          </nav>
          <a class="landing-instagram" href="https://www.instagram.com/qw__fashion/" target="_blank" rel="noreferrer">@qw__fashion</a>
          <div class="landing-controls">
            <button type="button" class="icon-button" data-theme-toggle aria-label="Promeni temu">
              <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
              <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
            </button>
            <a href="admin.html" class="landing-login" aria-label="Prijava u admin panel">Login</a>
            <button type="button" class="icon-button landing-cart" data-cart-toggle aria-label="Otvori korpu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 4h2l2.2 10.4A2 2 0 0 0 9.15 16H18a2 2 0 0 0 1.95-1.57L21 8H7"/><circle cx="10" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/></svg>
              <span data-cart-count class="landing-cart-count">0</span>
            </button>
          </div>
        </div>
      </header>`;
  }

  function footer() {
    return `
      <footer class="atelier-footer">
        <img class="atelier-footer-photo" src="images/workshop/atelje.webp" alt="" loading="lazy" decoding="async">
        <div class="atelier-footer-veil" aria-hidden="true"></div>
        <img class="atelier-footer-logo" src="images/queens-world-logo-poster.png" alt="" width="1080" height="1080" loading="lazy" aria-hidden="true">
        <div class="atelier-footer-content">
          <div class="atelier-footer-left">
            <p>Pažljivo birani ručno rađeni modeli za svakodnevnu eleganciju.</p>
            <strong class="font-serif">Izradjeno u nas Zemunu</strong>
          </div>
          <div class="atelier-footer-right">
            <p>Sve modele možete videti i na Instagramu</p>
            <strong class="font-serif">Pratite nas</strong>
            <a href="https://www.instagram.com/qw__fashion/" target="_blank" rel="noreferrer">@qw__fashion</a>
          </div>
        </div>
        <p class="atelier-footer-copyright">© 2026 Kaleya Ventures LLC</p>
      </footer>`;
  }

  function bindLogo() {
    const video = document.querySelector(".landing-logo-video");
    const gif = document.querySelector(".landing-logo-gif");
    const button = document.querySelector("[data-logo-motion]");
    if (!video || !gif || !button) return;
    const source = video.querySelector("source");
    let wantsPlayback = true;
    let useGif = false;
    let requestId = 0;
    let loadTimer;
    video.muted = true;
    video.defaultMuted = true;
    button.hidden = false;

    const updateButton = () => {
      button.textContent = wantsPlayback ? "Ⅱ" : "▷";
      button.setAttribute("aria-pressed", String(!wantsPlayback));
      button.setAttribute("aria-label", wantsPlayback ? "Pauziraj animaciju logotipa" : "Pokreni animaciju logotipa");
    };
    const showGif = () => {
      if (!wantsPlayback) return;
      useGif = true;
      clearTimeout(loadTimer);
      video.pause();
      video.classList.remove("is-playing");
      gif.src = gif.dataset.src;
      gif.hidden = false;
      gif.classList.add("is-playing");
    };
    const pause = (showPoster = false) => {
      wantsPlayback = false;
      requestId += 1;
      clearTimeout(loadTimer);
      video.pause();
      if (showPoster) video.classList.remove("is-playing");
      gif.hidden = true;
      gif.classList.remove("is-playing");
      gif.removeAttribute("src");
      updateButton();
    };
    const play = () => {
      wantsPlayback = true;
      const currentRequest = ++requestId;
      updateButton();
      if (useGif) return showGif();
      if (!source.hasAttribute("src")) {
        source.src = source.dataset.src;
        video.load();
      }
      // A blocked autoplay or an unsupported video must not leave a static logo.
      clearTimeout(loadTimer);
      loadTimer = setTimeout(() => {
        if (currentRequest === requestId && wantsPlayback) showGif();
      }, 5000);
      video.play().then(() => {
        if (currentRequest !== requestId || !wantsPlayback || useGif) return;
        clearTimeout(loadTimer);
        video.classList.add("is-playing");
      }).catch(() => {
        if (currentRequest === requestId && wantsPlayback) showGif();
      });
    };
    video.addEventListener("error", showGif);
    source.addEventListener("error", showGif);
    gif.addEventListener("error", () => pause(true));
    button.addEventListener("click", () => {
      if (wantsPlayback) pause();
      else play();
    });
    window.addEventListener("pageshow", (event) => {
      // Browser Back can restore the old paused page without reloading scripts.
      if (event.persisted) play();
    });
    play();
  }

  function bindGallery() {
    const track = document.querySelector(".landing-hero .hero-track");
    const button = document.querySelector("[data-marquee-toggle]");
    if (!track || !button) return;
    let paused = false;
    const update = () => {
      track.classList.toggle("is-running", !paused);
      track.classList.toggle("is-paused", paused);
      button.classList.toggle("is-paused", paused);
      button.setAttribute("aria-pressed", String(paused));
      button.setAttribute("aria-label", paused ? "Pokreni animaciju galerije" : "Pauziraj animaciju galerije");
    };
    button.addEventListener("click", () => {
      paused = !paused;
      update();
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        paused = false;
        update();
      }
    });
    update();
  }

  window.QW_LANDING = { migrate, header, footer, bindLogo, bindGallery };
})();
