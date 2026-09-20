var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var PRODUCTION_CRYPTOBOT_TOKEN = "635195:AA8ZrofzsxEgReQqhpQdWg1J2aLdXYV8FSD";
var CRYPTO_PAY_BASE_URL = "https://pay.crypt.bot/api";
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "gta6-companion-server" });
  });
  app.post("/api/cryptobot/createInvoice", async (req, res) => {
    try {
      const { asset = "USDT", amount = "2.99", description = "GTA 6 Leonida - \u041F\u043E\u0436\u0438\u0437\u043D\u0435\u043D\u043D\u044B\u0439 VIP Pass", payload = "" } = req.body || {};
      const response = await fetch(`${CRYPTO_PAY_BASE_URL}/createInvoice`, {
        method: "POST",
        headers: {
          "Crypto-Pay-API-TOKEN": PRODUCTION_CRYPTOBOT_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          asset,
          amount,
          description,
          payload
        })
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Server error creating invoice:", err);
      res.status(500).json({
        ok: false,
        error: {
          code: 500,
          name: "INTERNAL_SERVER_ERROR",
          description: err?.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F \u0441\u043E \u0448\u043B\u044E\u0437\u043E\u043C Crypto Pay"
        }
      });
    }
  });
  app.get("/api/cryptobot/getInvoices", async (req, res) => {
    try {
      const urlParams = new URLSearchParams();
      if (req.query.invoice_ids) {
        urlParams.set("invoice_ids", String(req.query.invoice_ids));
      }
      if (req.query.status) {
        urlParams.set("status", String(req.query.status));
      }
      if (req.query.count) {
        urlParams.set("count", String(req.query.count));
      }
      const queryString = urlParams.toString();
      const targetUrl = `${CRYPTO_PAY_BASE_URL}/getInvoices${queryString ? `?${queryString}` : ""}`;
      const response = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Crypto-Pay-API-TOKEN": PRODUCTION_CRYPTOBOT_TOKEN
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("Server error fetching invoices:", err);
      res.status(500).json({
        ok: false,
        error: {
          code: 500,
          name: "INTERNAL_SERVER_ERROR",
          description: err?.message || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F \u0441\u043E \u0448\u043B\u044E\u0437\u043E\u043C Crypto Pay"
        }
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
