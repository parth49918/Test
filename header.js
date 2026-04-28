(function () {
  async function injectHTML({ url, mountSelector, fallbackSelector, onAfterInject }) {
    const mount = document.querySelector(mountSelector) || (fallbackSelector ? document.querySelector(fallbackSelector) : null);
    if (!mount) return false;

    if (mount.dataset && mount.dataset.injected === "true") return true;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);

      const html = await res.text();
      mount.innerHTML = html;

      if (mount.dataset) mount.dataset.injected = "true";

      if (typeof onAfterInject === "function") onAfterInject();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  function runInitHooks() {

    const hooks = [
      "initHeader",        
      "initNav",          
      "initHeaderShrink",  
      "initDropdowns",     
      "initMobileMenu"     
    ];

    hooks.forEach((name) => {
      if (typeof window[name] === "function") {
        try {
          window[name]();
        } catch (e) {
          console.error(`Error running ${name}():`, e);
        }
      }
    });

    document.dispatchEvent(new CustomEvent("site:headerLoaded"));
  }

  async function loadSharedParts() {
   
    await injectHTML({
      url: "/header/header.html",
      mountSelector: "#headerMount",
      fallbackSelector: "#siteHeader",
      onAfterInject: runInitHooks
    });

    await injectHTML({
     url: "/footer/footer.html",
     mountSelector: "#footerMount",
     fallbackSelector: null,
     onAfterInject: () => document.dispatchEvent(new CustomEvent("site:footerLoaded"))
    });
  }

  // Run after DOM is ready
  document.addEventListener("DOMContentLoaded", loadSharedParts);
})();
