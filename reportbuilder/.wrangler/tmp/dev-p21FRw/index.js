var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-NVybam/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// node_modules/itty-router/index.mjs
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: t = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: /* @__PURE__ */ __name((o3, s2, r, n) => "handle" == s2 ? r.fetch : (o4, ...a) => t.push([s2.toUpperCase?.(), RegExp(`^${(n = (e2 + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), a, n]) && r, "get") }), routes: t, ...o2, async fetch(e3, ...o3) {
  let s2, r, n = new URL(e3.url), a = e3.query = { __proto__: null };
  for (let [e4, t2] of n.searchParams) a[e4] = a[e4] ? [].concat(a[e4], t2) : t2;
  for (let [a2, c2, i2, l2] of t) if ((a2 == e3.method || "ALL" == a2) && (r = n.pathname.match(c2))) {
    e3.params = r.groups || {}, e3.route = l2;
    for (let t2 of i2) if (null != (s2 = await t2(e3.proxy ?? e3, ...o3))) return s2;
  }
} }), "e");
var o = /* @__PURE__ */ __name((e2 = "text/plain; charset=utf-8", t) => (o2, { headers: s2 = {}, ...r } = {}) => void 0 === o2 || "Response" === o2?.constructor.name ? o2 : new Response(t ? t(o2) : o2, { headers: { "content-type": e2, ...s2.entries ? Object.fromEntries(s2) : s2 }, ...r }), "o");
var s = o("application/json; charset=utf-8", JSON.stringify);
var c = o("text/plain; charset=utf-8", String);
var i = o("text/html");
var l = o("image/jpeg");
var p = o("image/png");
var d = o("image/webp");

// src/index.js
var router = e();
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  "Access-Control-Max-Age": "86400"
};
function corsResponse(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
__name(corsResponse, "corsResponse");
function log(level, message, data = {}) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logLevel = globalThis.LOG_LEVEL || "info";
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  if (levels[level] >= levels[logLevel]) {
    console[level](`[${timestamp}] [${level.toUpperCase()}] [ReportBuilder] ${message}`, data);
  }
}
__name(log, "log");
router.get("/health", () => {
  log("info", "Health check requested");
  const response = new Response(JSON.stringify({
    status: "ok",
    service: "Galileo Report Builder",
    version: globalThis.VERSION || "1.0.0",
    environment: globalThis.ENVIRONMENT || "unknown",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    capabilities: {
      browserRendering: true,
      pdfGeneration: true,
      cloudflareWorker: true
    }
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
  return corsResponse(response);
});
router.post("/api/generate-pdf", async (request, env) => {
  try {
    log("info", "PDF generation request received");
    const { html, filename = "document.pdf", options = {} } = await request.json();
    if (!html) {
      log("error", "No HTML content provided");
      return corsResponse(new Response(JSON.stringify({
        error: "HTML content is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }));
    }
    log("info", `Generating PDF: ${filename}`, {
      htmlSize: html.length,
      filename,
      hasOptions: Object.keys(options).length > 0
    });
    const pdfOptions = {
      format: "Letter",
      margin: {
        top: "0.25in",
        right: "0.1in",
        bottom: "0.4in",
        left: "0.1in"
      },
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: '<div style="font-size:11px; text-align:center; width:100%; color:#6b7280; font-family: Plus Jakarta Sans, sans-serif; padding: 0 0.2in;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> \u2022 Confidential & Proprietary</div>',
      ...options
      // Allow custom options to override defaults
    };
    log("debug", "Launching browser session");
    const browser = await env.BROWSER.launch();
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1200, height: 1600 });
      log("debug", "Setting page content");
      await page.setContent(html, {
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: 3e4
      });
      log("debug", "Waiting for fonts and render completion");
      await page.evaluateHandle(() => document.fonts.ready);
      await new Promise((resolve) => setTimeout(resolve, 3e3));
      log("debug", "Generating PDF with options", pdfOptions);
      const pdfBuffer = await page.pdf(pdfOptions);
      log("info", `PDF generated successfully`, {
        filename,
        sizeBytes: pdfBuffer.length,
        sizeKB: Math.round(pdfBuffer.length / 1024)
      });
      const response = new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": pdfBuffer.length.toString()
        }
      });
      return corsResponse(response);
    } finally {
      await page.close();
      await browser.close();
      log("debug", "Browser session closed");
    }
  } catch (error) {
    log("error", "PDF generation failed", {
      error: error.message,
      stack: error.stack
    });
    const response = new Response(JSON.stringify({
      error: "PDF generation failed",
      details: error.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
    return corsResponse(response);
  }
});
router.get("/", () => {
  const response = new Response(JSON.stringify({
    service: "Galileo Report Builder",
    version: globalThis.VERSION || "1.0.0",
    description: "PDF generation service using Cloudflare Browser Rendering",
    endpoints: {
      health: "/health",
      generatePdf: "POST /api/generate-pdf"
    },
    documentation: "https://docs.galileo.tax/reportbuilder",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
  return corsResponse(response);
});
router.options("*", () => {
  return corsResponse(new Response(null, { status: 200 }));
});
router.all("*", () => {
  const response = new Response(JSON.stringify({
    error: "Not Found",
    message: "The requested endpoint does not exist",
    availableEndpoints: {
      health: "GET /health",
      generatePdf: "POST /api/generate-pdf",
      root: "GET /"
    }
  }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
  return corsResponse(response);
});
var src_default = {
  async fetch(request, env, ctx) {
    try {
      globalThis.ENVIRONMENT = env.ENVIRONMENT || "unknown";
      globalThis.VERSION = env.VERSION || "1.0.0";
      globalThis.LOG_LEVEL = env.LOG_LEVEL || "info";
      log("debug", "Request received", {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get("User-Agent")
      });
      return await router.handle(request, env, ctx);
    } catch (error) {
      log("error", "Unhandled error in main fetch handler", {
        error: error.message,
        stack: error.stack
      });
      const response = new Response(JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
      return corsResponse(response);
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e2) {
      console.error("Failed to drain the unused request body.", e2);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e2) {
  return {
    name: e2?.name,
    message: e2?.message ?? String(e2),
    stack: e2?.stack,
    cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e2) {
    const error = reduceError(e2);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-NVybam/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-NVybam/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
