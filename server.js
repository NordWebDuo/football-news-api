const express = require("express");
const PORT = process.env.PORT || 8000;
const cheerio = require("cheerio");
const axios = require("axios");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

// Health checks
app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.json({ status: "OK" }));

// List of available sources
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

// 90mins
router.get("/90mins", async (req, res) => {
  try {
    const { data } = await axios.get("https://www.90min.com/categories/football-news");
    const $ = cheerio.load(data);
    const valid = [/^https:\/\/www\.90min\.com\/[a-z0-9-]+$/, /^https:\/\/www\.90min\.com\/features\/[a-z0-9-]+$/];
    const list = [];
    $("a").each((_, el) => {
      const title = $(el).find("header h3").text().trim();
      const url = $(el).attr("href");
      if (title && valid.some(rx => rx.test(url))) {
        list.push({ title, url, img: null });
      }
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// One Football
router.get("/onefootball", async (req, res) => {
  try {
    const { data } = await axios.get("https://onefootball.com/en/home");
    const $ = cheerio.load(data);
    const list = [];
    $("li").each((_, el) => {
      const a = $(el).find("a").eq(1);
      const title = a.find("p").first().text().trim();
      const href = a.attr("href");
      const url = href ? `https://onefootball.com${href}` : null;
      const img = $(el).find("img").attr("src");
      if (title && url) list.push({ title, url, img });
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ESPN
router.get("/espn", async (req, res) => {
  try {
    const { data } = await axios.get("https://www.espn.in/football/");
    const $ = cheerio.load(data);
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
    res.status(500).json({ error: err.message });
  }
});

// GOAL
router.get("/goal", async (req, res) => {
  try {
    const { data } = await axios.get("https://www.goal.com/en-in/news");
    const $ = cheerio.load(data);
    const list = [];
    $("li").each((_, el) => {
      const href = $(el).find("a").attr("href");
      const url = href ? `https://goal.com${href}` : null;
      let title = $(el).find("h3").text().trim();
      title = title.replace(/Getty|Images|\/Goal/gi, "").replace(/[^\w\s\-.]/g, "").trim();
      const img = $(el).find("img").attr("src");
      if (title && url) list.push({ title, url, img });
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// FourFourTwo routes
const fftw = [
  { slug: "epl", path: "premier-league" },
  { slug: "laliga", path: "la-liga" },
  { slug: "ucl", path: "champions-league" },
  { slug: "bundesliga", path: "bundesliga" }
];
fftw.forEach(({ slug, path }) => {
  router.get(`/fourfourtwo/${slug}`, async (req, res) => {
    try {
      const { data } = await axios.get(`https://www.fourfourtwo.com/${path}`);
      const $ = cheerio.load(data);
      const list = [];
      $(".small").each((_, el) => {
        const title = $(el).find("h3.article-name").text().trim();
        const url = $(el).find("a").attr("href");
        const srcset = $(el).find("img").attr("data-srcset") || "";
        const img = srcset.split(" ")[0] || null;
        if (title && url) list.push({ title, url, img });
      });
      res.json(list);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// Mount router
app.use("/api", router);
app.use("/news", router);

// Start server
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports.handler = serverless(app);
