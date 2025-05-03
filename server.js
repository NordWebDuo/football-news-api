const express = require("express");
const PORT = process.env.PORT || 8000;
const cheerio = require("cheerio");
const axios = require("axios");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

// Arrays pentru fiecare sursă
tconst news_array_ninenine = [];
const news_array_onefootball = [];
const news_array_espn = [];
const news_array_goaldotcom = [];
const news_array_fftw_epl = [];
const news_array_fftw_laliga = [];
const news_array_fftw_ucl = [];
const news_array_fftw_bundesliga = [];

// Ruta principală listă surse
router.get("/news", (req, res) => {
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

// Extragere 90mins (nemodificat)
router.get("/news/90mins", async (req, res) => {
  try {
    const { data: html } = await axios.get("https://www.90min.com/categories/football-news");
    const $ = cheerio.load(html);
    const validPatterns = [
      /^https:\/\/www\.90min\.com\/[a-z0-9-]+$/,
      /^https:\/\/www\.90min\.com\/features\/[a-z0-9-]+$/
    ];
    $("a").each((_, el) => {
      const title = $(el).find("header h3").text().trim();
      const url   = $(el).attr("href");
      if (title && validPatterns.some(rx => rx.test(url))) {
        news_array_ninenine.push({ title, url });
      }
    });
    res.json(news_array_ninenine);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch 90mins" });
  }
});

// ROUTA ONEFOOTBALL cu content extras
router.get("/news/onefootball", async (req, res) => {
  try {
    // 1. Preluăm lista de articole
    const { data: htmlList } = await axios.get("https://onefootball.com/en/home");
    const $ = cheerio.load(htmlList);
    const items = [];

    $("li").each((_, el) => {
      const a     = $(el).find("a").eq(1);
      const title = a.find("p").eq(0).text().trim();
      const href  = a.attr("href");
      const url   = href ? `https://onefootball.com${href}` : null;
      const img   = $(el).find("img").attr("src");
      if (title && url) {
        items.push({ title, url, img });
      }
    });

    // 2. Pentru fiecare articol, extragem content
    const detailed = await Promise.all(
      items.map(async item => {
        try {
          const { data: htmlDetail } = await axios.get(item.url);
          const $$ = cheerio.load(htmlDetail);
          // Selector pentru conținut (părți de text)
          const content = $$(".article-detail__body p")
            .map((i, p) => $$(p).text().trim())
            .get()
            .join("\n\n");
          return { ...item, content };
        } catch (e) {
          console.warn(`Could not fetch content for ${item.url}`);
          return { ...item, content: null };
        }
      })
    );

    res.json(detailed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch OneFootball" });
  }
});

// Restul rutelor (ESPn, GOAL, FourFourTwo) pot rămâne neschimbate...

//  router.get('/news/espn', ...)
//  router.get('/news/goal', ...)
//  router.get('/news/fourfourtwo/epl', ...)
//  router.get('/news/fourfourtwo/laliga', ...)
//  router.get('/news/fourfourtwo/ucl', ...)
//  router.get('/news/fourfourtwo/bundesliga', ...)

app.use("/api", router);

// Run local
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports.handler = serverless(app);
