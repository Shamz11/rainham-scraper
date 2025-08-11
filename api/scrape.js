import fetch from "node-fetch";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const url = req.method === "GET" ? req.query.url : (req.body?.url);
    if (!url) return res.status(400).json({ error: "Missing ?url or body.url" });

    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RM-StockBot/1.0)" }
    });
    if (!r.ok) return res.status(r.status).json({ error: `Fetch failed: ${r.status}` });

    const html = await r.text();
    const $ = cheerio.load(html);

    const itemSel  = ".car, .vehicle, .listing, .stock-item, .result, .product, .search-result";
    const titleSel = ".title, .vehicle-title, h2, h3";
    const priceSel = ".price, .vehicle-price, .cost";
    const milesSel = ".mileage, .odometer, .miles";

    const cars = [];
    $(itemSel).each((_, el) => {
      const $el = $(el);
      const title   = $el.find(titleSel).first().text().trim();
      const price   = $el.find(priceSel).first().text().trim();
      const mileage = $el.find(milesSel).first().text().trim();
      let link = $el.find("a[href]").first().attr("href") || "";
      if (link?.startsWith("/")) {
        try { const u = new URL(url); link = u.origin + link; } catch {}
      }
      if (title || price || mileage) cars.push({ title, price, mileage, link });
    });

    res.status(200).json({ sourceUrl: url, count: cars.length, cars });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
