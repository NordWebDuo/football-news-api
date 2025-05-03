const express = require("express");
const PORT = process.env.PORT || 8000;
const cheerio = require("cheerio");
const axios = require("axios");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

const news_array_ninenine = [];
const news_array_onefootball = [];
const news_array_espn = [];
const news_array_goaldotcom = [];
const news_array_fourfourtwo_epl = [];
const news_array_fourfourtwo_laliga = [];
const news_array_fourfourtwo_ucl = [];
const news_array_fourfourtwo_bundesliga = [];

const news_websites = [
  { title: "90mins" },
  { title: "One Football" },
  { title: "ESPN" },
  { title: "GOAL" },
  { title: "FourFourtwo" },
];

router.get("/news", (req, res) => {
  res.json(news_websites);
});

router.get("/news/90mins", (req, res) => {
  axios
    .get("https://www.90min.com/categories/football-news")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      const validUrlPatterns = [
        /^https:\/\/www\.90min\.com\/[a-z0-9-]+$/,
        /^https:\/\/www\.90min\.com\/features\/[a-z0-9-]+$/,
      ];

      $("a", html).each(function () {
        const title = $(this).find("header h3").text();
        const url = $(this).attr("href");
        const isValidUrl = validUrlPatterns.some((pattern) =>
          pattern.test(url)
        );
        if (isValidUrl && title) {
          news_array_ninenine.push({ title, url });
        }
      });

      res.json(news_array_ninenine);
    })
    .catch((err) => console.error(err));
});

router.get("/news/onefootball", (req, res) => {
  axios
    .get("https://onefootball.com/en/home")
    .then((response) => {
      const html1 = response.data;
      const $ = cheerio.load(html1);

      $("li", html1).each(function () {
        const title = $(this).find("a").eq(1).find("p").eq(0).text();
        const url = "https://onefootball.com" + $(this).find("a").eq(1).attr("href");
        const img = $(this).find("img").attr("src");

        if (title) {
          news_array_onefootball.push({ title, url, img });
        }
      });

      res.json(news_array_onefootball);
    })
    .catch((err) => console.error(err));
});

router.get("/news/espn", (req, res) => {
  axios
    .get("https://www.espn.in/football/")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $("a", html).each(function () {
        const title = $(this).find("h2").text();
        const url = "https://www.espn.in" + $(this).attr("href");
        const img = $(this).find("img").attr("data-default-src");

        if (url.includes("story") && title) {
          news_array_espn.push({ title, url, img });
        }
      });

      res.json(news_array_espn);
    })
    .catch((err) => console.error(err));
});

router.get("/news/goal", (req, res) => {
  axios
    .get("https://www.goal.com/en-in/news")
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      $("li", html).each(function () {
        const wordsToRemove = ["Getty", "Images", "/Goal"];
        const pattern = new RegExp(
          `^\s+|(${wordsToRemove.join("|")}|[^a-zA-Z0-9\s\-.])`,
          "gi"
        );
        const url = "https://goal.com" + $(this).find("a").attr("href");
        const title = $(this).find("h3").text();
        const news_img = $(this).find("img").attr("src");
        const cleanTitle = title.replace(pattern, "").replace("CC", "").replace("IG-leomessiIG-leomessiDear god", "");

        if (url.includes("lists") && cleanTitle) {
          news_array_goaldotcom.push({ url, title: cleanTitle, news_img });
        }
      });

      res.json(news_array_goaldotcom);
    })
    .catch((err) => console.error(err));
});

// FourFourTwo routes (EPL, LaLiga, UCL, Bundesliga)
const f4tRoutes = [
  { slug: "epl", url: "premier-league" },
  { slug: "laliga", url: "la-liga" },
  { slug: "ucl", url: "champions-league" },
  { slug: "bundesliga", url: "bundesliga" },
];

f4tRoutes.forEach(({ slug, url: path }) => {
  router.get(`/news/fourfourtwo/${slug}`, (req, res) => {
    axios
      .get(`https://www.fourfourtwo.com/${path}`)
      .then((response) => {
        const html = response.data;
        const $ = cheerio.load(html);
        const arrayKey = `news_array_fourfourtwo_${slug}`;

        $(`.small`, html).each((_, element) => {
          const $el = $(element);
          const link = $el.find("a").attr("href");
          const title = $el.find("h3.article-name").text();
          const srcset = $el.find("img").attr("data-srcset") || "";
          const news_img = srcset.split(" ")[0] || null;
          const rawDesc = $el.find("p.synopsis").text()?.trim() || "";
          const desc = rawDesc.replace(/^La Liga\n|IN THE MAG\n|HOW TO WATCH\n|EXCLUSIVE\n/g, "");

          if (link && title) {
            eval(`${arrayKey}.push({ url: link, title, news_img, short_desc: desc });`);
          }
        });

        res.json(eval(arrayKey));
      })
      .catch((err) => console.error(err));
  });
});

app.use("/api", router);

// Fallback for local dev
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports.handler = serverless(app);
