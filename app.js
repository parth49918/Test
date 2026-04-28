

(function () {
  const state = {
    header: null,
    burger: null,
    overlay: null,
    closeSheet: null,
    dds: [],
    mqDesktop: window.matchMedia("(min-width: 981px)"),
  };
  // Helpers
  function qs(sel, root = document) {
    return root.querySelector(sel);
  }
  function qsa(sel, root = document) {
    return Array.from(root.querySelectorAll(sel));
  }

  function isDesktop() {
    return state.mqDesktop.matches;
  }

  function openMobile() {
    if (!state.overlay || !state.burger) return;
    state.overlay.hidden = false;
    state.burger.setAttribute("aria-expanded", "true");
    state.burger.setAttribute("aria-label", "Close menu");
    state.burger.textContent = "✕";
    document.body.style.overflow = "hidden";
  }

  function closeMobile() {
    if (!state.overlay || !state.burger) return;
    state.overlay.hidden = true;
    state.burger.setAttribute("aria-expanded", "false");
    state.burger.setAttribute("aria-label", "Open menu");
    state.burger.textContent = "☰";
    document.body.style.overflow = "";

    // Collapse all mobile submenus
    qsa(".sheetToggle").forEach((btn) => {
      const key = btn.dataset.expand;
      const sub = document.getElementById(`sub-${key}`);
      if (!sub) return;
      btn.setAttribute("aria-expanded", "false");
      sub.hidden = true;
    });
  }

  function closeAllDesktop() {
    state.dds.forEach((dd) => {
      dd.classList.remove("open");
      const btn = qs(".navbtn", dd);
      if (btn) btn.setAttribute("aria-expanded", "false");
    });

    if (state.header) state.header.classList.remove("mega-open");
  }

  function updateHeaderOnScroll() {
    if (!state.header) return;

    // Only desktop
    if (!isDesktop()) {
      state.header.classList.remove("is-scrolled");
      state.header.classList.remove("mega-open");
      return;
    }

    // If mega is open
    if (state.header.classList.contains("mega-open")) return;

    if (window.scrollY > 60) state.header.classList.add("is-scrolled");
    else state.header.classList.remove("is-scrolled");
  }

  // GLOBAL listeners (bind once)
  let globalsBound = false;

  function bindGlobalListenersOnce() {
    if (globalsBound) return;
    globalsBound = true;

    // Click outside closes desktop dropdown
    document.addEventListener("click", (e) => {
      // If click is inside header, ignore here (dropdown click handler will manage)
      if (state.header && state.header.contains(e.target)) return;
      closeAllDesktop();
    });

    // ESC closes desktop dropdown + mobile
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAllDesktop();
        closeMobile();
      }
    });

    // Keep header scroll state updated
    window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
    window.addEventListener("load", updateHeaderOnScroll);
    window.addEventListener("resize", updateHeaderOnScroll);

    // If leaving desktop width, close desktop mega
    state.mqDesktop.addEventListener("change", () => {
      if (!isDesktop()) closeAllDesktop();
      // If switching to desktop, close mobile menu
      if (isDesktop()) closeMobile();
      updateHeaderOnScroll();
    });

    // Smooth scroll for normal anchors (page content)
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;

      const id = a.getAttribute("href");
      if (!id || id === "#") return;

      const el = document.querySelector(id);
      if (!el) return;

      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", id);
    });

    // data-scroll-to buttons (page content)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-scroll-to]");
      if (!btn) return;

      const targetId = btn.dataset.scrollTo;
      const target = document.getElementById(targetId);
      if (!target) return;

      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${targetId}`);
    });

    // INTRODUCTION smart routing (works from any page)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-scroll-to="intro"]');
      if (!btn) return;

      const intro = document.getElementById("intro");

      // If intro exists on this page, smooth scroll
      if (intro) {
        intro.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", "#intro");
        return;
      }

      // Otherwise go to homepage intro
      window.location.href = "/#intro";
    });
  }

  // HEADER/NAV init (call after injection)
  window.initHeader = function initHeader() {
    state.header = document.getElementById("siteHeader");
    state.burger = document.getElementById("burger");
    state.overlay = document.getElementById("mobileOverlay");
    state.closeSheet = document.getElementById("closeSheet");
    state.dds = qsa(".dd"); // desktop dropdown containers

    bindGlobalListenersOnce();

    // If header missing
    if (!state.header) return;

    if (state.burger && !state.burger.dataset.bound) {
      state.burger.dataset.bound = "true";
      state.burger.addEventListener("click", () => {
        const isOpen = state.burger.getAttribute("aria-expanded") === "true";
        isOpen ? closeMobile() : openMobile();
      });
    }

    if (state.closeSheet && !state.closeSheet.dataset.bound) {
      state.closeSheet.dataset.bound = "true";
      state.closeSheet.addEventListener("click", closeMobile);
    }

    if (state.overlay && !state.overlay.dataset.bound) {
      state.overlay.dataset.bound = "true";
      state.overlay.addEventListener("click", (e) => {
        if (e.target === state.overlay) closeMobile();
      });
    }

    // Mobile submenu toggles (bind per element)
    qsa(".sheetToggle").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = "true";

      btn.addEventListener("click", () => {
        const key = btn.dataset.expand;
        const sub = document.getElementById(`sub-${key}`);
        if (!sub) return;

        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!expanded));
        sub.hidden = expanded;
      });
    });

    // Close mobile sheet when any link in sheet clicked
    qsa(".sheet a").forEach((a) => {
      if (a.dataset.bound) return;
      a.dataset.bound = "true";
      a.addEventListener("click", closeMobile);
    });

    // Desktop dropdown bindings (bind per injected header)
    state.dds.forEach((dd) => {
      const btn = qs(".navbtn", dd);
      const mega = qs(".mega", dd);
      if (!btn || !mega) return;

      if (btn.dataset.bound) return;
      btn.dataset.bound = "true";

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const willOpen = !dd.classList.contains("open");
        closeAllDesktop();

        dd.classList.toggle("open", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));

        // Expand header mega state (also affects badge/shrink styling)
        state.header.classList.toggle("mega-open", willOpen);

        updateHeaderOnScroll();
      });

      if (!mega.dataset.bound) {
        mega.dataset.bound = "true";
        mega.addEventListener("click", (e) => e.stopPropagation());
      }
    });

    // Ensure scroll state correct after injection
    updateHeaderOnScroll();
  };


  document.addEventListener("DOMContentLoaded", () => {
    bindGlobalListenersOnce();

    // LPSB Message: View Less
    const lpsb = document.getElementById("lpsbMessage");
    const viewLess = document.getElementById("lpsbViewLess");
    if (lpsb && viewLess && !viewLess.dataset.bound) {
      viewLess.dataset.bound = "true";
      viewLess.addEventListener("click", () => {
        lpsb.removeAttribute("open");
        const sum = lpsb.querySelector("summary");
        if (sum) sum.focus();
      });
    }

    // Fade-in Intersection
    const fadeEls = qsa(".fade-in");
    if (fadeEls.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("show");
          });
        },
        { threshold: 0.12 }
      );
      fadeEls.forEach((el) => io.observe(el));
    }

    // Reveal animations
    const revealEls = qsa(".reveal, .reveal-left, .reveal-right, .reveal-zoom");
    if (revealEls.length) {
      const revealIO = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("show");
              revealIO.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
      );

      revealEls.forEach((el) => revealIO.observe(el));
    }

    // Chief Message: View Less
    const chiefDetails = document.getElementById("chiefDetails");
    const chiefLessBtn = document.querySelector(".chiefLess");
    if (chiefDetails && chiefLessBtn && !chiefLessBtn.dataset.bound) {
      chiefLessBtn.dataset.bound = "true";
      chiefLessBtn.addEventListener("click", () => {
        chiefDetails.open = false;
        chiefDetails.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    // If header is hard-coded on any page (not injected)
    if (document.getElementById("siteHeader")) {
      window.initHeader();
    }
  });
})();
  const topics = [
    {
      title: "Awards & Recognition",
      url: "/Wellness/Awards & Recognition/awards_&_recognition.html",
      img: ""
    },
    {
      title: "Crime Analysis",
      url: "/Safety/Crime Analysis/Crime_Analysis.html",
      img: "/assets/crime.jpg"
    },
    {
      title: "Modernizing Policing",
      url: "/Wellness/Modernizing Policing/modernizing_policing.html",
      img: ""
    },
    {
      title: "Community Connections",
      url: "/Trust/Community Connections/community_connections.html",
      img: ""
    }
  ];
  function normalizePath(p) {
    return (p || "").toLowerCase().replace(/\/+$/, ""); // removes trailing /
  }

  function pickRandom(arr, n) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }

  const currentPath = normalizePath(window.location.pathname);

  // remove current page from list
  const filteredTopics = topics.filter(t => normalizePath(t.url) !== currentPath);

  // pick 2 random from remaining
  const selected = pickRandom(filteredTopics, 2);

  const grid = document.getElementById("findoutGrid");

  grid.innerHTML = selected.map(t => `
    <a class="findout__card" href="${t.url}">
      <img class="findout__img" src="${t.img}" alt="">
      <div class="findout__label">${t.title}</div>
      <div class="findout__more">Read More &nbsp;›</div>
    </a>
  `).join("");