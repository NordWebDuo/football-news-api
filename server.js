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
  { title: "FourFourTwo" }
];

router.get("/news", (req, res) => res.json(news_websites));

router.get("/news/90mins", async (req, res) => {
  try {
    const response = await axios.get("https://www.90min.com/categories/football-news");
    const $ = cheerio.load(response.data);
    const validPatterns = [/^\/categories\//];
    $("a").each((_, el) => {
      const title = $(el).find("header h3").text().trim();
      const href = $(el).attr("href");
      if (title && validPatterns.some(p => p.test(href))) {
        news_array_ninenine.push({ title, url: href });
      }
    });
    res.json(news_array_ninenine);
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch 90mins" });
  }
});

// ... (rest of routes identical, omitted for brevity)
// NOTE: include the other routes for onefootball, espn, goal, fourfourtwo

app.use("/api", router);

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

module.exports.handler = serverless(app);
