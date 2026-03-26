/**
 * review-system.js
 *
 * Legacy compatibility shim.
 * Reviewer authentication now lives in review-system-auth.js via AWS /login.
 * This file intentionally contains no reviewer passwords or password hashes.
 */

(function () {
  const paths = [
    "./review-system-auth.js",
    "../review-system-auth.js",
    "/review-system-auth.js",
  ];

  function loadNext(idx) {
    if (idx >= paths.length) {
      console.warn("[review] review-system-auth.js not found in expected paths.");
      return;
    }
    const s = document.createElement("script");
    s.src = paths[idx];
    s.async = false;
    s.onload = () => console.info(`[review] loaded auth script: ${paths[idx]}`);
    s.onerror = () => {
      s.remove();
      loadNext(idx + 1);
    };
    document.head.appendChild(s);
  }

  loadNext(0);
})();
