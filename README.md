# Football News API (npm version)

This project scrapes football news from multiple sites and exposes them via Express.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run locally:
   ```bash
   npm start
   ```
   Server runs at http://localhost:8000

3. Endpoints:
   - GET /api/news
   - GET /api/news/90mins
   - GET /api/news/onefootball
   - GET /api/news/espn
   - GET /api/news/goal
   - GET /api/news/fourfourtwo/epl
   - GET /api/news/fourfourtwo/laliga
   - GET /api/news/fourfourtwo/ucl
   - GET /api/news/fourfourtwo/bundesliga

## Docker

Build and run with:
```bash
docker-compose up --build
```
