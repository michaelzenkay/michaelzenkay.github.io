/**
 * training-report-gate
 *
 * Path-scoped HTTP Basic Auth for training report pages.
 * Keeps the rest of the site public.
 *
 * Required Worker secrets:
 *   BASIC_USER
 *   BASIC_PASS
 *
 * Optional Worker secret:
 *   BASIC_REALM (defaults to "Training Report")
 */

function b64decode(input) {
  try {
    return atob(input);
  } catch {
    return "";
  }
}

function parseBasicAuth(header) {
  if (!header || !header.startsWith("Basic ")) {
    return null;
  }
  const payload = b64decode(header.slice(6).trim());
  const idx = payload.indexOf(":");
  if (idx < 0) {
    return null;
  }
  return {
    user: payload.slice(0, idx),
    pass: payload.slice(idx + 1),
  };
}

function isProtectedPath(pathname) {
  if (pathname === "/reports/mg_best_report.html") {
    return true;
  }
  return /^\/results\/[^/]+\/report\.html$/i.test(pathname);
}

function unauthorized(realm) {
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${realm}"`,
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!isProtectedPath(url.pathname)) {
      return fetch(request);
    }

    const expectedUser = env.BASIC_USER || "";
    const expectedPass = env.BASIC_PASS || "";
    const realm = env.BASIC_REALM || "Training Report";
    const auth = parseBasicAuth(request.headers.get("Authorization"));

    if (!auth) {
      return unauthorized(realm);
    }
    if (auth.user !== expectedUser || auth.pass !== expectedPass) {
      return unauthorized(realm);
    }

    return fetch(request);
  },
};

