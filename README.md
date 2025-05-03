# Football News API

Acest micro-serviciu oferă endpoint-uri pentru extragerea știrilor de fotbal de pe diferite site-uri.

## Cum să folosești

1. Instalează dependențele:
   ```bash
   yarn install
   ```

2. Pornește local:
   ```bash
   yarn start
   ```
   Serverul va rula pe http://localhost:8000

3. Endpoint-uri disponibile:
   - GET /api/news
   - GET /api/news/90mins
   - GET /api/news/onefootball
   - GET /api/news/espn
   - GET /api/news/goal
   - GET /api/news/fourfourtwo/epl
   - GET /api/news/fourfourtwo/laliga
   - GET /api/news/fourfourtwo/ucl
   - GET /api/news/fourfourtwo/bundesliga

4. Deploy pe Coolify:
   - În Coolify, adaugă un **Git-Based Application** cu acest repo.
   - Port: `8000`
   - Deckpanel-ul va folosi `Dockerfile` pentru build și CMD pentru start.
