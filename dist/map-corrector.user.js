
// ==UserScript==
// @name        Map Corrector
// @namespace   http://tampermonkey.net/
// @version     1.0.1
// @description Corrects corrupted PBF maps on wplace.live using GM_xmlhttpRequest
// @author      You
// @match       https://wplace.live/*
// @grant       GM_xmlhttpRequest
// @connect     tiles.openfreemap.org
// @run-at      document-start
// ==/UserScript==

(() => {
  // src/proxy.js
  function installFetchHook() {
    const originalFetch = window.fetch;
    const TILE_TEMPLATE = "https://tile.openstreetmap.jp/data/planet/{z}/{x}/{y}.pbf";
    const TILE_BASE = "https://tile.openstreetmap.jp/data/planet/";
    console.log("[MapCorrector] Switching Source to OSM Japan...");
    const originalParse = JSON.parse;
    JSON.parse = function(text, reviver) {
      const obj = originalParse.apply(this, arguments);
      if (obj && typeof obj === "object") {
        let changed = false;
        if (obj.sources && obj.sources.openmaptiles) {
          delete obj.sources.openmaptiles.url;
          obj.sources.openmaptiles.tiles = [TILE_TEMPLATE];
          obj.sources.openmaptiles.minzoom = 0;
          obj.sources.openmaptiles.maxzoom = 14;
          changed = true;
        }
        if (Array.isArray(obj.tiles) && obj.tiles.length > 0 && obj.tiles[0].includes("wplace")) {
          obj.tiles = [TILE_TEMPLATE];
          changed = true;
        }
        if (obj.glyphs && obj.glyphs.includes("wplace.live")) {
          obj.glyphs = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
          changed = true;
        }
        if (obj.sprite && obj.sprite.includes("wplace.live")) {
          obj.sprite = "https://tiles.openfreemap.org/sprites/liberty/sprite";
          changed = true;
        }
        if (changed) console.log("[MapCorrector] SUCCESS: JSON Patched to OSM Japan.");
      }
      return obj;
    };
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(obj) {
      if (obj instanceof Blob && (obj.type.includes("javascript") || obj.type === "")) {
        const originalUrl = originalCreateObjectURL.call(this, obj);
        const injection = `
        (function() {
          const orgFetch = self.fetch;
          const TILE_BASE = '${TILE_BASE}';
          self.fetch = async function(...args) {
            let url = (args[0] instanceof Request ? args[0].url : args[0]) + "";
            if (url.includes('.pbf')) {
              const m = url.match(/\\/(\\d+)\\/(\\d+)\\/(\\d+)\\.pbf/);
              if (m && url.includes('wplace.live')) {
                const newUrl = TILE_BASE + m[1] + "/" + m[2] + "/" + m[3] + ".pbf";
                return orgFetch(newUrl, { mode: 'cors' });
              }
            }
            return orgFetch.apply(self, args);
          };
        })();
        importScripts("${originalUrl}");
      `;
        return originalCreateObjectURL.call(this, new Blob([injection], { type: "text/javascript" }));
      }
      return originalCreateObjectURL.apply(this, arguments);
    };
    window.fetch = async function(resource, init) {
      let url = (resource instanceof Request ? resource.url : resource) + "";
      if (url.includes("maps.wplace.live") && url.includes("/styles/liberty")) {
        return new Promise((resolve) => {
          GM_xmlhttpRequest({
            method: "GET",
            url: "https://tiles.openfreemap.org/styles/liberty",
            onload: (r) => resolve(new Response(r.responseText, { status: 200, headers: { "Content-Type": "application/json" } })),
            onerror: () => originalFetch(resource, init).then(resolve)
          });
        });
      }
      return originalFetch(resource, init);
    };
    if (navigator.serviceWorker) {
      navigator.serviceWorker.register = () => new Promise(() => {
      });
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
    }
  }

  // src/index.js
  console.log("Map Corrector script started");
  installFetchHook();
})();
