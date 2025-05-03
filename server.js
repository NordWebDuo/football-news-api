const express   = require("express");
const PORT      = process.env.PORT || 8000;
const cheerio   = require("cheerio");
const axios     = require("axios");
const puppeteer = require("puppeteer");       // ← here
const serverless= require("serverless-http");

const app    = express();
const router = express.Router();

// … (arrays, ruta /news şi /news/90mins identice)

// Ruta OneFootball
router.get("/news/onefootball", async (req, res) => {
  try {
    // 1) Ia lista de articole
    const { data: listHtml } = await axios.get("https://onefootball.com/en/home");
    const $ = cheerio.load(listHtml);
    const items = [];
    $("li").each((_, el) => {
      const a     = $(el).find("a").eq(1);
      const title = a.find("p").eq(0).text().trim();
      const href  = a.attr("href");
      const url   = href ? `https://onefootball.com${href}` : null;
      const img   = $(el).find("img").attr("src");
      if (title && url) items.push({ title, url, img });
    });

    // 2) Folosește puppeteer pentru a reda pagina și prelua <article><p>
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const detailed = [];
    for (let item of items) {
      const page = await browser.newPage();
      await page.goto(item.url, { waitUntil: "networkidle2" });
      const content = await page.$$eval("article p", ps =>
        ps.map(p => p.innerText.trim()).filter(t => t).join("\n\n")
      );
      await page.close();
      detailed.push({ ...item, content });
    }
    await browser.close();

    res.json(detailed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch OneFootball" });
  }
});

// … (restul rutelor, app.use, export handler etc.)