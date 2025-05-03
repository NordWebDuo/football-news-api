const express = require("express");
const PORT = process.env.PORT || 8000;
const cheerio = require("cheerio");
const axios = require("axios");
const puppeteer = require("puppeteer-core");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

// Health checks
app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.json({ status: "OK" }));

// List of sources
app.get("/news", (req, res) => {
  res.json([
    { title: "90mins", path: "90mins" },
    { title: "One Football", path: "onefootball" },
    { title: "ESPN", path: "espn" },
    { title: "GOAL", path: "goal" },
    { title: "4-4-2 EPL", path: "fourfourtwo/epl" },
    { title: "4-4-2 LaLiga", path: "fourfourtwo/laliga" },
    { title: "4-4-2 UCL", path: "fourfourtwo/ucl" },
    { title: "4-4-2 Bundesliga", path: "fourfourtwo/bundesliga" }
  ]);
});

// 90mins endpoint
router.get("/90mins", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://www.90min.com/categories/football-news");
    const $ = cheerio.load(html);
    const valid = [/^https:\/\/www\.90min\.com\/[a-z0-9-]+$/, /^https:\/\/www\.90min\.com\/features\/[a-z0-9-]+$/];
    const list = [];
    $("a").each((_, el) => {
      const title = $(el).find("header h3").text().trim();
      const url = $(el).attr("href");
      if (title && valid.some(rx => rx.test(url))) list.push({ title, url });
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch 90mins" });
  }
});

// OneFootball endpoint with lazy Puppeteer launch
let browser;
router.get("/onefootball", async (req, res) => {
  try {
    // Fetch list
    const { data: htmlList } = await axios.get("https://onefootball.com/en/home");
    const $ = cheerio.load(htmlList);
    let items = [];
    $("li").each((_, el) => {
      const a = $(el).find("a").eq(1);
      const title = a.find("p").first().text().trim();
      const href = a.attr("href");
      const url = href ? `https://onefootball.com${href}` : null;
      const img = $(el).find("img").attr("src");
      if (title && url) items.push({ title, url, img });
    });
    items = items.slice(0, 5); // limit to avoid long runs

    // Launch browser if needed
    if (!browser) {
      try {
        browser = await puppeteer.launch({
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
        });
      } catch (err) {
        console.error("Puppeteer launch failed", err);
        return res.status(500).json({ error: "Failed to launch browser" });
      }
    }

    const detailed = [];
    for (const item of items) {
      try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(20000);
        await page.goto(item.url, { waitUntil: "networkidle2" });
        const content = await page.$$eval(
          "p",
          ps => ps.map(p => p.innerText.trim()).filter(t => t.length > 30).join("\n\n")
        );
        await page.close();
        detailed.push({ ...item, content });
      } catch (e) {
        console.warn(`Error fetching detail for ${item.url}`, e);
        detailed.push({ ...item, content: null });
      }
    }
    res.json(detailed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch OneFootball" });
  }
});

// ESPN endpoint
router.get("/espn", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://www.espn.in/football/");
    const $ = cheerio.load(html);
    const list = [];
    $("a").each((_, el) => {
      const title = $(el).find("h2").text().trim();
      const href = $(el).attr("href");
      const url = href ? `https://www.espn.in${href}` : null;
      const img = $(el).find("img").attr("data-default-src");
      if (title && url && url.includes("story")) list.push({ title, url, img });
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ESPN" });
  }
});

// GOAL endpoint
router.get("/goal", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://www.goal.com/en-in/news");
    const $ = cheerio.load(html);
    const list = [];
    $("li").each((_, el) => {
      const href = $(el).find("a").attr("href");
      const url = href ? `https://goal.com${href}` : null;
      let title = $(el).find("h3").text().trim();
      const img = $(el).find("img").attr("src");
      title = title.replace(/Getty|Images|\/Goal/gi, "").replace(/[^a-zA-Z0-9\s\-.]/g, "").trim();
      if (title && url && url.includes("lists")) list.push({ title, url, img });
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch GOAL" });
  }
});

// FourFourTwo endpoints
const fftw = [
  { slug: "epl", path: "premier-league" },
  { slug: "laliga", path: "la-liga" },
  { slug: "ucl", path: "champions-league" },
  { slug: "bundesliga", path: "bundesliga" }
];
fftw.forEach(({ slug, path }) => {
  router.get(`/${slug}`, async (req, res) => {
    try {
      const { data: html } = await axios.get(`https://www.fourfourtwo.com/${path}`);
      const $ = cheerio.load(html);
      const list = [];
      $(".small").each((_, el) => {
        const link = $(el).find("a").attr("href");
        const title = $(el).find("h3.article-name").text().trim();
        const srcset = $(el).find("img").attr("data-srcset") || "";
        const img = srcset.split(" ")[0] || null;
        let desc = $(el).find("p.synopsis").text().trim();
        desc = desc.replace(/^(La Liga\n|IN THE MAG\n|HOW TO WATCH\n|EXCLUSIVE\n)/g, "").trim();
        if (link && title) list.push({ title, url: link, img, short_desc: desc });
      });
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to fetch FourFourTwo ${slug}` });
    }
  });
});

// Mount router
app.use("/news", router);
app.use("/api/news", router);

// Local run
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports.handler = serverless(app);
