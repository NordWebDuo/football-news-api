// server.js
const express = require("express");
const PORT = process.env.PORT || 8000;
const cheerio = require("cheerio");
const axios = require("axios");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

// ▶️ Arrays unde adunăm articolele
const news_array_ninenine = [];
const news_array_onefootball = [];
const news_array_espn = [];
const news_array_goaldotcom = [];
const news_array_fftw_epl = [];
const news_array_fftw_laliga = [];
const news_array_fftw_ucl = [];
const news_array_fftw_bundesliga = [];

// ▶️ Lista de site-uri suportate
router.get("/news", (req, res) => {
  res.json([
    { title: "90mins", path: "90mins" },
    { title: "One Football", path: "onefootball" },
    { title: "ESPN", path: "espn" },
    { title: "GOAL", path: "goal" },
    { title: "4-4-2 EPL", path: "fourfourtwo/epl" },
    { title: "4-4-2 LaLiga", path: "fourfourtwo/laliga" },
    { title: "4-4-2 UCL", path: "fourfourtwo/ucl" },
    { title: "4-4-2 Bundesliga", path: "fourfourtwo/bundesliga" },
  ]);
});


router.get("/news/90mins", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://www.90min.com/categories/football-news");
    const $ = cheerio.load(html);
    const valid = [
      /^https:\/\/www\.90min\.com\/[a-z0-9-]+$/,
      /^https:\/\/www\.90min\.com\/features\/[a-z0-9-]+$/
    ];
    $("a").each((_, el) => {
      const title = $(el).find("header h3").text().trim();
      const url   = $(el).attr("href");
      if (title && valid.some(rx => rx.test(url))) {
        news_array_ninenine.push({ title, url });
      }
    });
    res.json(news_array_ninenine);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch 90mins" });
  }
});


router.get("/news/onefootball", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://onefootball.com/en/home");
    const $ = cheerio.load(html);
    $("li").each((_, el) => {
      const a = $(el).find("a").eq(1);
      const title = a.find("p").eq(0).text().trim();
      const href  = a.attr("href");
      const url   = href ? `https://onefootball.com${href}` : null;
      const img   = $(el).find("img").attr("src");
      if (title && url) news_array_onefootball.push({ title, url, img });
    });
    res.json(news_array_onefootball);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch OneFootball" });
  }
});


router.get("/news/espn", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://www.espn.in/football/");
    const $ = cheerio.load(html);
    $("a").each((_, el) => {
      const title = $(el).find("h2").text().trim();
      const href  = $(el).attr("href");
      const url   = href ? `https://www.espn.in${href}` : null;
      const img   = $(el).find("img").attr("data-default-src");
      if (title && url && url.includes("story")) {
        news_array_espn.push({ title, url, img });
      }
    });
    res.json(news_array_espn);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch ESPN" });
  }
});


router.get("/news/goal", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://www.goal.com/en-in/news");
    const $ = cheerio.load(html);
    $("li").each((_, el) => {
      const href = $(el).find("a").attr("href");
      const url  = href ? `https://goal.com${href}` : null;
      let title = $(el).find("h3").text().trim();
      const img  = $(el).find("img").attr("src");
      // curățăm titlul
      title = title
        .replace(/Getty|Images|\/Goal/gi, "")
        .replace(/[^a-zA-Z0-9\s\-.]/g, "")
        .trim();
      if (title && url && url.includes("lists")) {
        news_array_goaldotcom.push({ title, url, img });
      }
    });
    res.json(news_array_goaldotcom);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch GOAL" });
  }
});


const fftwRoutes = [
  { slug: "epl",       path: "premier-league",     arr: news_array_fftw_epl },
  { slug: "laliga",    path: "la-liga",            arr: news_array_fftw_laliga },
  { slug: "ucl",       path: "champions-league",   arr: news_array_fftw_ucl },
  { slug: "bundesliga",path: "bundesliga",         arr: news_array_fftw_bundesliga },
];

fftwRoutes.forEach(({ slug, path, arr }) => {
  router.get(`/news/fourfourtwo/${slug}`, async (req, res) => {
    try {
      const { data: html } = await axios.get(`https://www.fourfourtwo.com/${path}`);
      const $ = cheerio.load(html);
      $(".small").each((_, el) => {
        const $el   = $(el);
        const href  = $el.find("a").attr("href");
        const title = $el.find("h3.article-name").text().trim();
        const srcset= $el.find("img").attr("data-srcset") || "";
        const img   = srcset.split(" ")[0] || null;
        let desc    = $el.find("p.synopsis").text().trim();
        // scoatem etichete gen IN THE MAG, HOW TO WATCH
        desc = desc.replace(/^(La Liga\n|IN THE MAG\n|HOW TO WATCH\n|EXCLUSIVE\n)/g, "").trim();
        if (title && href) arr.push({ title, url: href, img, short_desc: desc });
      });
      res.json(arr);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: `Failed to fetch FourFourTwo ${slug}` });
    }
  });
});


app.use("/api", router);


// pentru rulare locală
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports.handler = serverless(app);