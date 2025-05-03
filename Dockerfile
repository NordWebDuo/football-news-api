FROM node:18-slim

# Dacă folosești puppeteer (nu puppeteer-core), nu mai ai nevoie de
# apt-get pentru Chromium, Puppeteer îl aduce singur.

WORKDIR /usr/src/app

# Copiem doar package.json și instalăm
COPY package.json ./
RUN npm install --production

# Apoi restul codului
COPY . .

EXPOSE 8000
CMD ["node", "server.js"]